#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
ENV_FILE="${ENV_FILE:-.env}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
BACKUP_PATH="${1:-${BACKUP_PATH:-}}"
CONFIRM_RESTORE="${CONFIRM_RESTORE:-NO}"

cd "$APP_DIR"

if [[ "$CONFIRM_RESTORE" != "YES" ]]; then
  echo "Refusing to restore without explicit confirmation."
  echo "Run with: CONFIRM_RESTORE=YES ./scripts/restore-staging.sh <backup-dir>"
  exit 1
fi

if [[ -z "$BACKUP_PATH" ]]; then
  echo "Usage: CONFIRM_RESTORE=YES ./scripts/restore-staging.sh <backup-dir>"
  exit 1
fi

if [[ ! -d "$BACKUP_PATH" ]]; then
  echo "Backup directory not found: ${BACKUP_PATH}"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Env file not found: ${ENV_FILE}"
  exit 1
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Compose file not found: ${COMPOSE_FILE}"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

: "${POSTGRES_USER:?POSTGRES_USER is required in ${ENV_FILE}}"
: "${POSTGRES_DB:?POSTGRES_DB is required in ${ENV_FILE}}"

db_file="$(find "$BACKUP_PATH" -maxdepth 1 -type f -name "postgres-${POSTGRES_DB}-*.dump" | sort | tail -n 1)"
uploads_file="$(find "$BACKUP_PATH" -maxdepth 1 -type f -name "backend-uploads-*.tar.gz" | sort | tail -n 1)"

if [[ -z "$db_file" || ! -f "$db_file" ]]; then
  echo "Database dump not found in ${BACKUP_PATH}"
  exit 1
fi

echo "==> Restoring PostgreSQL database from ${db_file}"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres \
  pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner < "$db_file"

if [[ -n "$uploads_file" && -f "$uploads_file" ]]; then
  echo "==> Restoring backend uploads from ${uploads_file}"
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T backend \
    sh -c "rm -rf /app/uploads/* && tar -xzf - -C /app" < "$uploads_file"
else
  echo "==> Upload archive not found; skipping uploads restore."
fi

echo
echo "Restore complete from:"
echo "  ${BACKUP_PATH}"
