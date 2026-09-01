import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { escrows, fiatPayments } from "@/lib/db/schema";
import { withServiceRole } from "@/lib/db/rls";
import { lookupKhaltiPayment } from "@/lib/payments/khalti";
import { runJob } from "@/lib/jobs/handlers";
import { enqueue } from "@/lib/jobs/queue";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const pidx = url.searchParams.get("pidx");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || url.origin;

  if (!pidx) {
    return NextResponse.redirect(`${baseUrl}/dashboard?payment=missing`);
  }

  return processKhaltiPidx(pidx, baseUrl);
}

export async function processKhaltiPidx(pidx: string, baseUrl: string) {
  const payment = await withServiceRole(async (tx) => {
    const [p] = await tx
      .select()
      .from(fiatPayments)
      .where(eq(fiatPayments.providerRef, pidx))
      .limit(1);
    return p;
  });

  if (!payment) {
    return NextResponse.redirect(`${baseUrl}/dashboard?payment=unknown`);
  }
  if (payment.status === "settled") {
    return NextResponse.redirect(
      `${baseUrl}/escrow/${payment.escrowId}/pending`
    );
  }

  let lookup;
  try {
    lookup = await lookupKhaltiPayment(pidx);
  } catch (err) {
    console.error("khalti lookup failed", err);
    return NextResponse.redirect(
      `${baseUrl}/escrow/${payment.escrowId}/pending`
    );
  }

  if (lookup.status !== "Completed") {
    if (lookup.status === "User canceled" || lookup.status === "Expired") {
      await withServiceRole(async (tx) => {
        await tx
          .update(fiatPayments)
          .set({ status: "failed", providerStatus: lookup.status })
          .where(eq(fiatPayments.id, payment.id));
        if (payment.escrowId) {
          await tx
            .update(escrows)
            .set({ state: "failed", failureReason: `khalti:${lookup.status}` })
            .where(eq(escrows.id, payment.escrowId));
        }
      });
      return NextResponse.redirect(
        `${baseUrl}/escrow/${payment.escrowId}/failed`
      );
    }
    return NextResponse.redirect(
      `${baseUrl}/escrow/${payment.escrowId}/pending`
    );
  }

  await withServiceRole(async (tx) => {
    await tx
      .update(fiatPayments)
      .set({
        status: "settled",
        providerStatus: lookup.status,
        settledAt: new Date(),
        rawResponse: lookup as unknown as Record<string, unknown>,
      })
      .where(eq(fiatPayments.id, payment.id));
    if (payment.escrowId) {
      await tx
        .update(escrows)
        .set({ state: "fiat_settled", updatedAt: new Date() })
        .where(eq(escrows.id, payment.escrowId));
    }
  });

  if (payment.escrowId) {
    try {
      await runJob("convert_and_fund", { escrowId: payment.escrowId });
    } catch (err) {
      console.error("inline convert_and_fund failed, enqueuing", err);
      await enqueue("convert_and_fund", { escrowId: payment.escrowId });
    }
  }

  return NextResponse.redirect(`${baseUrl}/escrow/${payment.escrowId}`);
}
