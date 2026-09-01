#!/usr/bin/env bash
#
# Portable Postgres backup for NayaGhar.
#
# Produces a vendor-neutral, gzipped plain-SQL dump of the Neon database so it
# can be restored onto ANY Postgres (self-hosted, RDS, Supabase, ...) if we
# ever move off Neon. Flags chosen for portability:
#   --no-owner --no-privileges --no-acl  → no Neon-specific roles baked in
#   --clean --if-exists                  → restore cleanly over an existing DB
#
# Reads DATABASE_URL from .env.local (the owner role — needed to read every
# table and the pgvector extension). Keeps the newest 10 backups.
#
# Usage:  npm run db:backup      (or)   bash scripts/backup-db.sh
# Restore: gunzip -c backups/<file>.sql.gz | psql "<TARGET_DATABASE_URL>"
#          (target must have the `vector` extension available for pgvector)

set -euo pipefail
cd "$(dirname "$0")/.."

# --- resolve DATABASE_URL (prefer explicit env, else .env.local) ---
if [ -z "${DATABASE_URL:-}" ] && [ -f .env.local ]; then
  DATABASE_URL=$(grep -E '^DATABASE_URL=' .env.local | head -1 | cut -d= -f2- | sed -E 's/^["'\'']//; s/["'\'']$//')
fi
: "${DATABASE_URL:?DATABASE_URL not set (put it in .env.local or export it)}"

mkdir -p backups

TS=$(date +%Y%m%d-%H%M%S)
OUT="backups/nayaghar-${TS}.sql.gz"

echo "→ Dumping database to ${OUT} ..."
pg_dump "$DATABASE_URL" \
  --no-owner --no-privileges --no-acl \
  --clean --if-exists \
  | gzip > "$OUT"

echo "✓ Backup complete: $(du -h "$OUT" | cut -f1)  ${OUT}"

# --- retention: keep the 10 most recent ---
KEEP=10
mapfile -t OLD < <(ls -1t backups/nayaghar-*.sql.gz 2>/dev/null | tail -n +$((KEEP + 1)))
if [ "${#OLD[@]}" -gt 0 ]; then
  printf '%s\n' "${OLD[@]}" | xargs -r rm -f
  echo "  (pruned ${#OLD[@]} old backup(s), keeping newest ${KEEP})"
fi

echo "Backups on disk:"
ls -1t backups/nayaghar-*.sql.gz
