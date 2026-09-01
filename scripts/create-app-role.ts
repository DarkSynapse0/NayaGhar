import postgres from "postgres";

/**
 * Bootstrap the `app_user` Postgres role (NOBYPASSRLS) and FORCE RLS on every
 * table. Idempotent: drops + recreates the role each run, so a re-run rotates
 * the password and re-grants privileges.
 *
 * Run: `DATABASE_URL=<owner-conn> npm run db:create-app-role`
 *
 * Prints a ready-to-paste APP_DATABASE_URL on success.
 */

const ownerUrl = process.env.DATABASE_URL;
if (!ownerUrl) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const TABLES = [
  "users",
  "user_wallets",
  "listings",
  "reviews",
  "pois",
  "conversations",
  "price_quotes",
  "escrows",
  "fiat_payments",
  "jobs",
];

function generatePassword(): string {
  // Neon's control plane requires a mix of upper, lower, digits, special chars.
  const upper = "ABCDEFGHIJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "!@#%^*+-_=";
  const rand = (chars: string, n: number) =>
    Array.from({ length: n }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  return `App_${rand(lower, 4)}${rand(upper, 4)}${rand(digits, 6)}${rand(
    special,
    2
  )}${rand(lower + upper + digits, 12)}`;
}

(async () => {
  const sql = postgres(ownerUrl);
  const password = generatePassword();
  try {
    await sql.unsafe("DROP ROLE IF EXISTS app_user");
    await sql.unsafe(
      `CREATE ROLE app_user WITH LOGIN PASSWORD '${password.replace(
        /'/g,
        "''"
      )}' NOBYPASSRLS NOCREATEDB NOCREATEROLE`
    );
    console.log("[ok] role app_user created");

    await sql`GRANT USAGE ON SCHEMA public TO app_user`;
    await sql`GRANT USAGE ON SCHEMA app TO app_user`;
    await sql`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user`;
    await sql`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user`;
    await sql`GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app TO app_user`;
    await sql`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user`;
    await sql`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_user`;
    console.log("[ok] grants applied");

    for (const t of TABLES) {
      await sql.unsafe(`ALTER TABLE ${t} FORCE ROW LEVEL SECURITY`);
    }
    console.log(`[ok] FORCE RLS on ${TABLES.length} tables`);

    // Build the APP_DATABASE_URL by swapping the user/password in the owner URL.
    const ownerParsed = new URL(ownerUrl);
    ownerParsed.username = "app_user";
    ownerParsed.password = encodeURIComponent(password);
    const appUrl = ownerParsed.toString();
    console.log("\n──────────────────────────────────────────────────────");
    console.log("Add to .env.local:");
    console.log(`APP_DATABASE_URL=${appUrl}`);
    console.log("──────────────────────────────────────────────────────");
  } finally {
    await sql.end();
  }
})().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
