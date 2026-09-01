import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { escrows, fiatPayments, listings } from "@/lib/db/schema";
import { withServiceRole } from "@/lib/db/rls";
import { buildEsewaForm } from "@/lib/payments/esewa";
import { initiateKhaltiPayment } from "@/lib/payments/khalti";
import { MAX_ESCROW_DEPOSIT_NPR, MAX_ESCROW_DEPOSIT_PAISA } from "@/lib/constants";
import type { InitPaymentResponse } from "@/types/payment";

export const dynamic = "force-dynamic";

type InitBody = {
  listingId: string;
  amountPaisa: number;
  provider: "esewa" | "khalti";
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Sign in first" } },
      { status: 401 }
    );
  }

  let body: InitBody;
  try {
    body = (await req.json()) as InitBody;
  } catch {
    return NextResponse.json(
      { data: null, error: { code: "BAD_JSON", message: "Invalid JSON" } },
      { status: 400 }
    );
  }

  if (!body.listingId || !body.amountPaisa || !body.provider) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "MISSING_FIELDS",
          message: "listingId, amountPaisa, provider required",
        },
      },
      { status: 400 }
    );
  }

  if (body.amountPaisa > MAX_ESCROW_DEPOSIT_PAISA) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "DEPOSIT_TOO_LARGE",
          message: `Deposits over Rs ${MAX_ESCROW_DEPOSIT_NPR.toLocaleString()} are not supported on the platform yet.`,
        },
      },
      { status: 400 }
    );
  }

  // Validate listing + create the escrow + payment rows in one service-context tx.
  const setup = await withServiceRole(async (tx) => {
    const [listing] = await tx
      .select()
      .from(listings)
      .where(eq(listings.id, body.listingId))
      .limit(1);
    if (!listing) return { kind: "no_listing" as const };
    if (listing.landlordId === session.user!.id!) {
      return { kind: "own_listing" as const };
    }

    const [escrow] = await tx
      .insert(escrows)
      .values({
        listingId: body.listingId,
        tenantId: session.user!.id!,
        landlordId: listing.landlordId,
        amountPaisa: body.amountPaisa,
        // amountLamports + quoteId are legacy columns from the SOL escrow flow
        // (now nullable). Left null since no SOL conversion happens.
        state: "pending_fiat",
      })
      .returning();

    const providerRef = `nyg-${escrow.id}-${randomUUID().slice(0, 8)}`;

    const [payment] = await tx
      .insert(fiatPayments)
      .values({
        userId: session.user!.id!,
        escrowId: escrow.id,
        provider: body.provider,
        direction: "deposit_in",
        amountPaisa: body.amountPaisa,
        providerRef,
        status: "pending",
      })
      .returning();

    return {
      kind: "ok" as const,
      escrow,
      payment,
      providerRef,
      listingTitle: listing.title,
    };
  });

  if (setup.kind === "no_listing") {
    return NextResponse.json(
      { data: null, error: { code: "LISTING_NOT_FOUND", message: "Listing missing" } },
      { status: 404 }
    );
  }
  if (setup.kind === "own_listing") {
    return NextResponse.json(
      {
        data: null,
        error: { code: "OWN_LISTING", message: "Cannot rent your own listing" },
      },
      { status: 400 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const totalNpr = body.amountPaisa / 100;

  if (body.provider === "esewa") {
    const { actionUrl, fields } = buildEsewaForm({
      totalNpr,
      transactionUuid: setup.providerRef,
      successUrl: `${baseUrl}/api/payments/esewa/callback`,
      failureUrl: `${baseUrl}/escrow/${setup.escrow.id}/failed`,
    });
    const res: InitPaymentResponse = {
      provider: "esewa",
      actionUrl,
      fields: fields as unknown as Record<string, string>,
      paymentId: setup.payment.id,
      escrowId: setup.escrow.id,
    };
    return NextResponse.json({ data: res, error: null });
  }

  // Khalti
  try {
    const init = await initiateKhaltiPayment({
      totalPaisa: body.amountPaisa,
      purchaseOrderId: setup.providerRef,
      purchaseOrderName: `Deposit for ${setup.listingTitle}`.slice(0, 100),
      returnUrl: `${baseUrl}/api/payments/khalti/callback`,
      websiteUrl: baseUrl,
      customer: {
        name: session.user.name || "NayaGhar Tenant",
        phone:
          (session.user as unknown as { phone?: string }).phone || undefined,
      },
    });

    await withServiceRole(async (tx) => {
      await tx
        .update(fiatPayments)
        .set({ providerRef: init.pidx })
        .where(eq(fiatPayments.id, setup.payment.id));
    });

    const res: InitPaymentResponse = {
      provider: "khalti",
      paymentUrl: init.payment_url,
      pidx: init.pidx,
      paymentId: setup.payment.id,
      escrowId: setup.escrow.id,
    };
    return NextResponse.json({ data: res, error: null });
  } catch (err) {
    console.error("khalti init failed", err);
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "KHALTI_INIT_FAILED",
          message: "Could not initiate Khalti payment",
        },
      },
      { status: 502 }
    );
  }
}
