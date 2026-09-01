#!/usr/bin/env bash
#
# Media backup for NayaGhar.
#
# The database only stores media URLs; the actual image/video files live on
# Cloudinary (and some seed images on Unsplash). This script reads every media
# URL referenced in the DB (listing photos/videos + user avatars) and downloads
# the files into backups/media/, preserving host+path, plus a manifest mapping
# each URL to its local file. That makes a move off Cloudinary self-contained:
# re-upload the files, then remap the URLs using the manifest.
#
# Usage:  npm run db:backup:media   (or)   bash scripts/backup-media.sh
# Idempotent: already-downloaded files are skipped.

set -euo pipefail
cd "$(dirname "$0")/.."

if [ -z "${DATABASE_URL:-}" ] && [ -f .env.local ]; then
  DATABASE_URL=$(grep -E '^DATABASE_URL=' .env.local | head -1 | cut -d= -f2- | sed -E 's/^["'\'']//; s/["'\'']$//')
fi
: "${DATABASE_URL:?DATABASE_URL not set (put it in .env.local or export it)}"

DEST="backups/media"
mkdir -p "$DEST"
MANIFEST="$DEST/manifest.tsv"
: > "$MANIFEST"

SQL="
  SELECT DISTINCT url FROM (
    SELECT jsonb_array_elements(COALESCE(photos, '[]'::jsonb))->>'url' AS url FROM listings
    UNION ALL
    SELECT jsonb_array_elements(COALESCE(videos, '[]'::jsonb))->>'url' AS url FROM listings
    UNION ALL
    SELECT jsonb_array_elements(COALESCE(videos, '[]'::jsonb))->>'thumbnail' AS url FROM listings
    UNION ALL
    SELECT avatar_url AS url FROM users
  ) s
  WHERE url IS NOT NULL AND url <> '' AND url LIKE 'http%';
"

saved=0; skipped=0; failed=0
while IFS= read -r url; do
  [ -z "$url" ] && continue
  rel=$(printf '%s' "$url" | sed -E 's#^https?://##; s#\?.*$##')          # strip proto + query
  out="$DEST/$rel"
  mkdir -p "$(dirname "$out")"
  if [ -f "$out" ]; then
    skipped=$((skipped + 1))
  elif curl -fsSL --max-time 120 "$url" -o "$out"; then
    saved=$((saved + 1)); echo "  saved: $rel"
  else
    failed=$((failed + 1)); rm -f "$out"; echo "  FAILED: $url" >&2
  fi
  printf '%s\t%s\n' "$url" "$out" >> "$MANIFEST"
done < <(psql "$DATABASE_URL" -Atq -c "$SQL")

echo "✓ Media backup: ${saved} saved, ${skipped} already present, ${failed} failed"
echo "  Location: ${DEST}  ($(du -sh "$DEST" 2>/dev/null | cut -f1)), manifest: ${MANIFEST}"
if [ "$failed" -gt 0 ]; then
  echo "  Note: ${failed} URL(s) were unreachable (dead/typo seed links or removed remote files); see FAILED lines above."
fi
exit 0
