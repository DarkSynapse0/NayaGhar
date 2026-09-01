import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "./index";

/**
 * Per-request RLS context wrappers.
 *
 * The RLS policies in `rls.sql` read two Postgres session variables:
 *   app.user_id    — the authenticated user's UUID
 *   app.is_service — true for cron/admin/signup paths that bypass user-scoped checks
 *
 * Postgres `SET LOCAL` only persists for the current transaction. With Neon's HTTP
 * driver, every db.execute() is its own connection, so we have to bundle the SET
 * and the actual queries inside a single transaction.
 *
 * Usage:
 *
 *   await withRls(session.user.id, async (tx) => {
 *     return tx.select().from(escrows).where(...);
 *   });
 *
 *   await withServiceRole(async (tx) => {
 *     await tx.insert(jobs).values(...);
 *   });
 *
 * NOTE on current state: RLS is ENABLED but NOT FORCED. The Neon owner role (used
 * by the app) bypasses RLS on its own tables, so today these wrappers are
 * functionally identical to plain `getDb()` calls. They become load-bearing the
 * moment you `ALTER TABLE … FORCE ROW LEVEL SECURITY` (recommended: do it table
 * by table after migrating each route to use these helpers).
 */

export type Tx = Parameters<
  Parameters<ReturnType<typeof getDb>["transaction"]>[0]
>[0];

export async function withRls<T>(
  userId: string,
  fn: (tx: Tx) => Promise<T>
): Promise<T> {
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.user_id', ${userId}, true)`);
    await tx.execute(sql`SELECT set_config('app.is_service', 'false', true)`);
    return fn(tx);
  });
}

export async function withServiceRole<T>(
  fn: (tx: Tx) => Promise<T>
): Promise<T> {
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.user_id', '', true)`);
    await tx.execute(sql`SELECT set_config('app.is_service', 'true', true)`);
    return fn(tx);
  });
}

/**
 * Anonymous reads (e.g. browsing public listings without logging in). Sets
 * neither user_id nor is_service — only policies that allow `USING (true)` will
 * match, which is exactly what we want for the public profile / listings /
 * reviews / pois reads.
 */
export async function withAnon<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.user_id', '', true)`);
    await tx.execute(sql`SELECT set_config('app.is_service', 'false', true)`);
    return fn(tx);
  });
}
