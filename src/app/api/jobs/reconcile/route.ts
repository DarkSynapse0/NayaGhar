import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { withServiceRole } from "@/lib/db/rls";
import { runJob } from "@/lib/jobs/handlers";

export const dynamic = "force-dynamic";

/**
 * Reconciliation cron. Runs the esewa-reconcile job and the global financial
 * invariant check. Hook to a 5-minute Vercel Cron.
 *
 * Invariant: settled deposit_in == settled payout_out + funded/disputed escrow held + refunded out
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "bad secret" } },
      { status: 401 }
    );
  }

  await runJob("esewa_reconcile", {});

  const agg = await withServiceRole(async (tx) => {
    const result = (await tx.execute(sql`
      SELECT
        (SELECT COALESCE(SUM(amount_paisa),0) FROM fiat_payments
          WHERE direction='deposit_in' AND status='settled')::text  AS deposits_in,
        (SELECT COALESCE(SUM(amount_paisa),0) FROM fiat_payments
          WHERE direction='payout_out' AND status='settled')::text  AS payouts_out,
        (SELECT COALESCE(SUM(amount_paisa),0) FROM fiat_payments
          WHERE direction='refund_out' AND status='settled')::text  AS refunds_out,
        (SELECT COALESCE(SUM(amount_paisa),0) FROM escrows
          WHERE state IN ('funded','disputed'))::text                 AS held
    `)) as unknown as {
      rows: Array<{
        deposits_in: string | null;
        payouts_out: string | null;
        refunds_out: string | null;
        held: string | null;
      }>;
    };
    return result.rows[0];
  });

  const deposits = BigInt(agg.deposits_in ?? "0");
  const payouts = BigInt(agg.payouts_out ?? "0");
  const refunds = BigInt(agg.refunds_out ?? "0");
  const held = BigInt(agg.held ?? "0");
  const drift = deposits - (payouts + refunds + held);

  return NextResponse.json({
    data: {
      depositsInPaisa: deposits.toString(),
      payoutsOutPaisa: payouts.toString(),
      refundsOutPaisa: refunds.toString(),
      heldOnChainPaisa: held.toString(),
      driftPaisa: drift.toString(),
      ok: drift === BigInt(0),
    },
    error: null,
  });
}

export const GET = POST;
