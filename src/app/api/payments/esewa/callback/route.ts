import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { escrows, fiatPayments } from "@/lib/db/schema";
import { withServiceRole } from "@/lib/db/rls";
import { verifyEsewaCallback, checkEsewaStatus } from "@/lib/payments/esewa";
import { runJob } from "@/lib/jobs/handlers";
import { enqueue } from "@/lib/jobs/queue";

export const dynamic = "force-dynamic";

/**
 * Esewa redirects the browser here with `?data=<base64>` after a payment.
 * No session — we run as service. HMAC-verify, double-check via status API,
 * mark fiat_payment settled, attempt convert+fund inline. On failure we enqueue.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const data = url.searchParams.get("data");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || url.origin;

  if (!data) {
    return NextResponse.redirect(`${baseUrl}/dashboard?payment=missing`);
  }

  let payload;
  try {
    payload = verifyEsewaCallback(data);
  } catch (err) {
    console.warn("esewa bad signature", err);
    return NextResponse.redirect(`${baseUrl}/dashboard?payment=invalid`);
  }

  const payment = await withServiceRole(async (tx) => {
    const [p] = await tx
      .select()
      .from(fiatPayments)
      .where(eq(fiatPayments.providerRef, payload.transaction_uuid))
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

  let confirmed = payload;
  try {
    confirmed = await checkEsewaStatus(
      payload.transaction_uuid,
      Number(payload.total_amount)
    );
  } catch (err) {
    console.warn("esewa status check failed, trusting callback", err);
  }

  if (confirmed.status !== "COMPLETE") {
    await withServiceRole(async (tx) => {
      await tx
        .update(fiatPayments)
        .set({
          status: "failed",
          providerStatus: confirmed.status,
          rawResponse: confirmed as unknown as Record<string, unknown>,
        })
        .where(eq(fiatPayments.id, payment.id));
      if (payment.escrowId) {
        await tx
          .update(escrows)
          .set({ state: "failed", failureReason: `esewa:${confirmed.status}` })
          .where(eq(escrows.id, payment.escrowId));
      }
    });
    return NextResponse.redirect(
      `${baseUrl}/escrow/${payment.escrowId}/failed`
    );
  }

  await withServiceRole(async (tx) => {
    await tx
      .update(fiatPayments)
      .set({
        status: "settled",
        providerStatus: confirmed.status,
        settledAt: new Date(),
        rawResponse: confirmed as unknown as Record<string, unknown>,
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
