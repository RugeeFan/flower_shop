#!/usr/bin/env bash
# Royal Rose — nightly backup
#
# Runs from /opt/royalrose (the docker compose project root). Produces
# two artifacts in ./backups/ per run:
#   1. uploads-YYYY-MM-DD.tgz    — tar of ./uploads
#   2. db-YYYY-MM-DD.sql.gz      — pg_dump of the postgres DB
#
# Keeps the last RETAIN_DAYS days, deletes older.
#
# Cron line (every day 03:30):
#   30 3 * * * cd /opt/royalrose && ./scripts/backup.sh >> backups/backup.log 2>&1
#
# Restore: see scripts/restore.sh.

set -euo pipefail

RETAIN_DAYS=${RETAIN_DAYS:-14}
TODAY=$(date +%Y-%m-%d)
NOW=$(date -Iseconds)
BACKUPS_DIR=${BACKUPS_DIR:-./backups}
UPLOADS_DIR=${UPLOADS_DIR:-./uploads}

mkdir -p "$BACKUPS_DIR"

# Resolve .env so we know the db credentials.
if [[ -f .env ]]; then
  # shellcheck disable=SC1091
  set -a; source .env; set +a
fi

: "${POSTGRES_USER:?POSTGRES_USER missing — check .env}"
: "${POSTGRES_DB:?POSTGRES_DB missing — check .env}"

echo "[$NOW] backup start"

# ── uploads ─────────────────────────────────────────────────────────────
if [[ -d "$UPLOADS_DIR" ]] && [[ -n "$(ls -A "$UPLOADS_DIR" 2>/dev/null)" ]]; then
  UPLOADS_OUT="$BACKUPS_DIR/uploads-$TODAY.tgz"
  tar -czf "$UPLOADS_OUT" -C "$(dirname "$UPLOADS_DIR")" "$(basename "$UPLOADS_DIR")"
  echo "[$NOW] wrote $UPLOADS_OUT ($(du -h "$UPLOADS_OUT" | cut -f1))"
else
  echo "[$NOW] uploads dir empty or missing, skipping tar"
fi

# ── database ────────────────────────────────────────────────────────────
DB_OUT="$BACKUPS_DIR/db-$TODAY.sql.gz"
docker compose exec -T db pg_dump \
  --clean --if-exists --no-owner --no-acl \
  -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  | gzip > "$DB_OUT"
echo "[$NOW] wrote $DB_OUT ($(du -h "$DB_OUT" | cut -f1))"

# ── retention ───────────────────────────────────────────────────────────
echo "[$NOW] pruning backups older than $RETAIN_DAYS days"
find "$BACKUPS_DIR" -maxdepth 1 -type f \
  \( -name 'uploads-*.tgz' -o -name 'db-*.sql.gz' \) \
  -mtime "+$RETAIN_DAYS" -print -delete || true

echo "[$NOW] backup done"
