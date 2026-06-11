#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
ENV_FILE="${ENV_FILE:-.env}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
BACKUP_DIR="${BACKUP_DIR:-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

cd "$APP_DIR"

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

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
target_dir="${BACKUP_DIR}/${timestamp}"
mkdir -p "$target_dir"
chmod 700 "$BACKUP_DIR" "$target_dir"

db_file="${target_dir}/postgres-${POSTGRES_DB}-${timestamp}.dump"
uploads_file="${target_dir}/backend-uploads-${timestamp}.tar.gz"
manifest_file="${target_dir}/manifest.txt"

echo "==> Backing up PostgreSQL database to ${db_file}"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$db_file"

echo "==> Backing up backend uploads to ${uploads_file}"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T backend \
  tar -czf - -C /app uploads > "$uploads_file"

{
  echo "timestamp=${timestamp}"
  echo "app_dir=${APP_DIR}"
  echo "compose_file=${COMPOSE_FILE}"
  echo "env_file=${ENV_FILE}"
  echo "git_ref=$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
  echo "postgres_db=${POSTGRES_DB}"
  echo
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
} > "$manifest_file"

echo "==> Cleaning backups older than ${RETENTION_DAYS} day(s)"
find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -mtime +"$RETENTION_DAYS" -print -exec rm -rf {} +

echo
echo "Backup complete:"
echo "  ${target_dir}"
