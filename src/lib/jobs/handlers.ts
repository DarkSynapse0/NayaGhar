import "server-only";
import { eq } from "drizzle-orm";
import { escrows, fiatPayments } from "@/lib/db/schema";
import { withServiceRole } from "@/lib/db/rls";
import { JobPayload } from "./queue";

/**
 * Job handlers — payments-only.
 *
 *   Tenant pays Esewa/Khalti → platform Esewa merchant account
 *   (deposit_in fiat_payment, status=settled)
 *
 *   Platform marks the escrow row as held (state=held)
 *
 *   Landlord clicks Release → platform pays out via Esewa MerchantPay
 *   (payout_out fiat_payment, status=settled). Same for refunds.
 *
 * The "escrow" is the platform holding the NPR. State machine + RLS prevent
 * either party from unilaterally taking funds; admin arbitrates disputes.
 *
 * Every handler is idempotent — retried jobs are no-ops once their target
 * state is reached.
 */

export async function runJob(
  kind: string,
  payload: Record<string, unknown>
): Promise<void> {
  switch (kind) {
    case "convert_and_fund":
    case "mark_held":
      // "convert_and_fund" name retained for backwards compat with already-queued
      // jobs; same as mark_held now.
      return markHeld(payload as JobPayload["convert_and_fund"]);
    case "release_and_payout":
      return releaseAndPayout(payload as JobPayload["release_and_payout"]);
    case "refund":
      return refund(payload as JobPayload["refund"]);
    case "esewa_reconcile":
      return esewaReconcile();
    default:
      throw new Error(`Unknown job kind: ${kind}`);
  }
}

/** Move escrow from fiat_settled → held (funded). */
async function markHeld({ escrowId }: { escrowId: string }) {
  await withServiceRole(async (tx) => {
    const [esc] = await tx
      .select()
      .from(escrows)
      .where(eq(escrows.id, escrowId))
      .limit(1);
    if (!esc) throw new Error(`Escrow ${escrowId} not found`);
    if (esc.state === "funded" || esc.state === "released") return;
    if (esc.state !== "fiat_settled") {
      throw new Error(`Escrow ${escrowId} in unexpected state: ${esc.state}`);
    }

    await tx
      .update(escrows)
      .set({ state: "funded", updatedAt: new Date() })
      .where(eq(escrows.id, escrowId));
  });
}

/** Mark escrow as released; record landlord payout. */
async function releaseAndPayout({
  escrowId,
  moveOutDate,
}: JobPayload["release_and_payout"]) {
  await withServiceRole(async (tx) => {
    const [escrow] = await tx
      .select()
      .from(escrows)
      .where(eq(escrows.id, escrowId))
      .limit(1);
    if (!escrow) throw new Error(`Escrow ${escrowId} not found`);
    if (escrow.state === "released") return;
    if (escrow.state !== "funded" && escrow.state !== "disputed") {
      throw new Error(`Cannot release in state ${escrow.state}`);
    }

    // In production this would call Esewa MerchantPay to push NPR from the
    // platform's merchant account to the landlord's Esewa. For the hackathon
    // we record the row as settled — the actual payout integration is the
    // next thing to wire when going live.
    await tx.insert(fiatPayments).values({
      userId: escrow.landlordId,
      escrowId: escrow.id,
      provider: "esewa",
      direction: "payout_out",
      amountPaisa: escrow.amountPaisa,
      providerRef: `payout-${escrow.id}-${Date.now()}`,
      status: "settled",
      settledAt: new Date(),
    });

    await tx
      .update(escrows)
      .set({
        state: "released",
        moveOutDate,
        updatedAt: new Date(),
      })
      .where(eq(escrows.id, escrowId));
  });
}

async function refund({ escrowId, reason }: JobPayload["refund"]) {
  await withServiceRole(async (tx) => {
    const [escrow] = await tx
      .select()
      .from(escrows)
      .where(eq(escrows.id, escrowId))
      .limit(1);
    if (!escrow) throw new Error(`Escrow ${escrowId} not found`);
    if (escrow.state === "refunded") return;

    // Off-chain refund — applies to any pre-payout state.
    if (
      escrow.state !== "pending_fiat" &&
      escrow.state !== "fiat_settled" &&
      escrow.state !== "funded" &&
      escrow.state !== "disputed"
    ) {
      throw new Error(`Cannot refund in state ${escrow.state}`);
    }

    // If we're past fiat_settled, money has actually landed in the platform's
    // Esewa merchant account — record the refund row. Pre-fiat states have no
    // money movement, just a state flip.
    if (escrow.state !== "pending_fiat") {
      await tx.insert(fiatPayments).values({
        userId: escrow.tenantId,
        escrowId: escrow.id,
        provider: "esewa",
        direction: "refund_out",
        amountPaisa: escrow.amountPaisa,
        providerRef: `refund-${escrow.id}-${Date.now()}`,
        status: "settled",
        settledAt: new Date(),
      });
    }

    await tx
      .update(escrows)
      .set({
        state: "refunded",
        failureReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(escrows.id, escrowId));

    // Mark the original deposit_in payment as refunded too (for the invariant).
    await tx
      .update(fiatPayments)
      .set({ status: "refunded" })
      .where(eq(fiatPayments.escrowId, escrowId));
  });
}

async function esewaReconcile(): Promise<void> {
  const { checkEsewaStatus } = await import("@/lib/payments/esewa");
  const cutoff = new Date(Date.now() - 10 * 60_000);

  const stale = await withServiceRole(async (tx) =>
    tx.select().from(fiatPayments).where(eq(fiatPayments.status, "pending"))
  );

  for (const p of stale) {
    if (p.provider !== "esewa") continue;
    if (p.createdAt > cutoff) continue;
    try {
      const status = await checkEsewaStatus(p.providerRef, p.amountPaisa / 100);
      if (status.status === "COMPLETE") {
        await withServiceRole(async (txDb) => {
          await txDb
            .update(fiatPayments)
            .set({
              status: "settled",
              providerStatus: status.status,
              settledAt: new Date(),
              rawResponse: status as unknown as Record<string, unknown>,
            })
            .where(eq(fiatPayments.id, p.id));
          if (p.escrowId) {
            await txDb
              .update(escrows)
              .set({ state: "fiat_settled", updatedAt: new Date() })
              .where(eq(escrows.id, p.escrowId));
          }
        });
        if (p.escrowId) {
          const { enqueue } = await import("./queue");
          await enqueue("convert_and_fund", { escrowId: p.escrowId });
        }
      } else if (status.status === "CANCELED" || status.status === "NOT_FOUND") {
        await withServiceRole(async (txDb) => {
          await txDb
            .update(fiatPayments)
            .set({ status: "failed", providerStatus: status.status })
            .where(eq(fiatPayments.id, p.id));
        });
        if (p.escrowId) {
          const { enqueue } = await import("./queue");
          await enqueue("refund", {
            escrowId: p.escrowId,
            reason: "esewa_not_settled",
          });
        }
      }
    } catch (err) {
      console.warn("reconcile failed for", p.id, err);
    }
  }
}
