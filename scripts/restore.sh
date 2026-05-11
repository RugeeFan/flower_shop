#!/usr/bin/env bash
# Royal Rose — restore from a backup.
#
# !!! DESTRUCTIVE !!!
# This script REPLACES the live database and overwrites uploads with the
# contents of the chosen backup pair. Don't run unless you're sure.
#
# Usage:
#   ./scripts/restore.sh DATE
#     where DATE matches the timestamp on the backup files, e.g. 2026-05-11
#
# Files expected:
#   backups/uploads-DATE.tgz
#   backups/db-DATE.sql.gz

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "usage: $0 YYYY-MM-DD"
  exit 1
fi

DATE="$1"
BACKUPS_DIR=${BACKUPS_DIR:-./backups}
UPLOADS_DIR=${UPLOADS_DIR:-./uploads}
UPLOADS_BAK="$BACKUPS_DIR/uploads-$DATE.tgz"
DB_BAK="$BACKUPS_DIR/db-$DATE.sql.gz"

if [[ ! -f "$DB_BAK" ]]; then
  echo "missing $DB_BAK"
  exit 1
fi
if [[ ! -f "$UPLOADS_BAK" ]]; then
  echo "warning: missing $UPLOADS_BAK (will skip uploads restore)"
fi

if [[ -f .env ]]; then
  # shellcheck disable=SC1091
  set -a; source .env; set +a
fi
: "${POSTGRES_USER:?POSTGRES_USER missing — check .env}"
: "${POSTGRES_DB:?POSTGRES_DB missing — check .env}"

echo "About to restore from $DATE. This is DESTRUCTIVE."
echo "  DB:      $DB_BAK   ->   $POSTGRES_DB"
echo "  Uploads: $UPLOADS_BAK -> $UPLOADS_DIR"
read -r -p "Type YES to continue: " CONFIRM
if [[ "$CONFIRM" != "YES" ]]; then
  echo "abort"
  exit 1
fi

# ── DB restore ──────────────────────────────────────────────────────────
echo "restoring DB..."
gunzip -c "$DB_BAK" | docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
echo "DB restored"

# ── uploads restore ─────────────────────────────────────────────────────
if [[ -f "$UPLOADS_BAK" ]]; then
  echo "restoring uploads..."
  # First, move the current uploads aside so we don't lose them outright.
  if [[ -d "$UPLOADS_DIR" ]]; then
    STASH="${UPLOADS_DIR}.replaced-$(date +%s)"
    mv "$UPLOADS_DIR" "$STASH"
    echo "previous uploads moved to $STASH (delete manually once happy)"
  fi
  tar -xzf "$UPLOADS_BAK" -C "$(dirname "$UPLOADS_DIR")"
  echo "uploads restored"
fi

# App restart so any in-memory caches are flushed.
echo "restarting app..."
docker compose restart app

echo "restore complete"
