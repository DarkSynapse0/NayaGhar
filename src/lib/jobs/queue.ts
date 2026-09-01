import "server-only";
import { and, eq, lte, sql } from "drizzle-orm";
import { jobs } from "@/lib/db/schema";
import { withServiceRole } from "@/lib/db/rls";

/**
 * Postgres-backed job queue. All operations run as service role: the jobs
 * table policy `jobs_service_only` rejects everything else.
 */

export type JobKind =
  | "convert_and_fund"  // legacy alias for mark_held — already-enqueued jobs use this name
  | "release_and_payout"
  | "refund"
  | "esewa_reconcile";

export type JobPayload = {
  convert_and_fund: { escrowId: string };
  release_and_payout: {
    escrowId: string;
    moveOutDate: string;
  };
  refund: { escrowId: string; reason: string };
  esewa_reconcile: Record<string, never>;
};

export async function enqueue<K extends JobKind>(
  kind: K,
  payload: JobPayload[K],
  opts: { runAfter?: Date; maxAttempts?: number } = {}
): Promise<string> {
  return withServiceRole(async (tx) => {
    const [row] = await tx
      .insert(jobs)
      .values({
        kind,
        payload: payload as Record<string, unknown>,
        runAfter: opts.runAfter ?? new Date(),
        maxAttempts: opts.maxAttempts ?? 3,
      })
      .returning({ id: jobs.id });
    return row.id;
  });
}

export async function claimNext(): Promise<{
  id: string;
  kind: string;
  payload: Record<string, unknown>;
  attempts: number;
  maxAttempts: number;
} | null> {
  return withServiceRole(async (tx) => {
    const result = (await tx.execute(sql`
      UPDATE jobs SET status = 'running', updated_at = now()
      WHERE id = (
        SELECT id FROM jobs
        WHERE status = 'pending' AND run_after <= now()
        ORDER BY run_after ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      RETURNING id, kind, payload, attempts, max_attempts
    `)) as unknown as {
      rows: Array<{
        id: string;
        kind: string;
        payload: Record<string, unknown>;
        attempts: number;
        max_attempts: number;
      }>;
    };

    const row = result.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      kind: row.kind,
      payload: row.payload,
      attempts: row.attempts,
      maxAttempts: row.max_attempts,
    };
  });
}

export async function completeJob(id: string): Promise<void> {
  await withServiceRole(async (tx) => {
    await tx
      .update(jobs)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(jobs.id, id));
  });
}

export async function failJob(
  id: string,
  attempts: number,
  maxAttempts: number,
  error: string
): Promise<void> {
  const nextAttempt = attempts + 1;
  await withServiceRole(async (tx) => {
    if (nextAttempt >= maxAttempts) {
      await tx
        .update(jobs)
        .set({
          status: "dead",
          attempts: nextAttempt,
          lastError: error,
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, id));
      return;
    }
    const backoffMs = Math.min(30_000 * 2 ** attempts, 30 * 60_000);
    await tx
      .update(jobs)
      .set({
        status: "pending",
        attempts: nextAttempt,
        lastError: error,
        runAfter: new Date(Date.now() + backoffMs),
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, id));
  });
}

export async function reapZombieJobs(staleMs = 5 * 60_000): Promise<number> {
  const cutoff = new Date(Date.now() - staleMs);
  return withServiceRole(async (tx) => {
    const result = await tx
      .update(jobs)
      .set({ status: "pending", updatedAt: new Date() })
      .where(and(eq(jobs.status, "running"), lte(jobs.updatedAt, cutoff)))
      .returning({ id: jobs.id });
    return result.length;
  });
}
