import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "./schema";

let _db: ReturnType<typeof createDb> | undefined;

/**
 * App connects via the WebSocket-pool driver so that `db.transaction()` works
 * — required for setting per-request RLS context via SET LOCAL inside the tx.
 *
 * Connection string preference:
 *   APP_DATABASE_URL  — non-bypass role (app_user). RLS policies enforced.
 *   DATABASE_URL      — fallback for hackathon dev where the owner role is fine.
 *
 * Migrations + seed scripts MUST use DATABASE_URL (the owner) — they need
 * DDL privileges and the ability to bypass RLS during initial loads.
 */
function createDb() {
  const url = process.env.APP_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Neither APP_DATABASE_URL nor DATABASE_URL is set"
    );
  }
  const pool = new Pool({ connectionString: url });
  return drizzle(pool, { schema });
}

export function getDb() {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}
