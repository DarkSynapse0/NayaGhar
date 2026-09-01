import { readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

/**
 * Apply src/lib/db/rls.sql to the database referenced by DATABASE_URL.
 * Idempotent — every CREATE POLICY is preceded by DROP POLICY IF EXISTS.
 *
 * Run: `npm run db:rls` (after migrate). For fresh setups: migrate, then this.
 */

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sqlText = readFileSync(
  join(__dirname, "..", "src", "lib", "db", "rls.sql"),
  "utf8"
);

const sql = postgres(url);

(async () => {
  try {
    await sql.unsafe(sqlText);
    console.log("[ok] RLS policies applied");

    const policies = await sql<{ tablename: string; policyname: string }[]>`
      SELECT tablename, policyname FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname
    `;
    const byTable = policies.reduce<Record<string, string[]>>((acc, p) => {
      (acc[p.tablename] ??= []).push(p.policyname);
      return acc;
    }, {});
    for (const [table, ps] of Object.entries(byTable)) {
      console.log(`  ${table}: ${ps.length} policies — ${ps.join(", ")}`);
    }
  } catch (err) {
    console.error("RLS application failed:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
})();
