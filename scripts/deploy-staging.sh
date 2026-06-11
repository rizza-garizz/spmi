#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
ENV_FILE="${ENV_FILE:-.env}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
RUN_BACKUP="${RUN_BACKUP:-true}"
RUN_SEED="${RUN_SEED:-false}"
HEALTH_URL="${HEALTH_URL:-}"
HEALTH_RETRIES="${HEALTH_RETRIES:-5}"
HEALTH_SLEEP_SECONDS="${HEALTH_SLEEP_SECONDS:-10}"

cd "$APP_DIR"

echo "==> Running staging preflight"
./scripts/preflight-staging.sh

if [[ "$RUN_BACKUP" == "true" ]]; then
  echo "==> Running staging backup"
  ./scripts/backup-staging.sh
else
  echo "==> Skipping staging backup"
fi

echo "==> Deploying containers"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build

if [[ "$RUN_SEED" == "true" ]]; then
  echo "==> Running database seed"
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T backend npm run prisma:seed
fi

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps

if [[ -n "$HEALTH_URL" ]]; then
  echo "==> Verifying API health: ${HEALTH_URL}"
  for attempt in $(seq 1 "$HEALTH_RETRIES"); do
    if curl -fsS "$HEALTH_URL"; then
      echo
      echo "Health check passed."
      exit 0
    fi

    echo "Health check failed, retrying in ${HEALTH_SLEEP_SECONDS}s... (${attempt}/${HEALTH_RETRIES})"
    sleep "$HEALTH_SLEEP_SECONDS"
  done

  echo "Health check failed after retries: ${HEALTH_URL}"
  exit 1
fi

echo
echo "Staging deploy complete."
