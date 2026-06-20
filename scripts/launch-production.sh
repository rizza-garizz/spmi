#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
ENV_FILE="${ENV_FILE:-.env}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
RUN_BACKUP="${RUN_BACKUP:-auto}"
RUN_SEED="${RUN_SEED:-true}"
RUN_SIAKAD_UAT="${RUN_SIAKAD_UAT:-false}"
HEALTH_URL="${HEALTH_URL:-}"
HEALTH_RETRIES="${HEALTH_RETRIES:-12}"
HEALTH_SLEEP_SECONDS="${HEALTH_SLEEP_SECONDS:-10}"

cd "$APP_DIR"

echo "==> Running production preflight"
./scripts/preflight-production.sh

if [[ "$RUN_BACKUP" == "auto" ]]; then
  if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps --status running --services | grep -qx "postgres"; then
    echo "==> Existing database detected; running production backup"
    ./scripts/backup-production.sh
  else
    echo "==> No running postgres service detected; skipping backup for first launch"
  fi
elif [[ "$RUN_BACKUP" == "true" ]]; then
  echo "==> Running production backup"
  ./scripts/backup-production.sh
else
  echo "==> Skipping production backup"
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
      break
    fi

    if [[ "$attempt" == "$HEALTH_RETRIES" ]]; then
      echo "Health check failed after retries: ${HEALTH_URL}"
      exit 1
    fi

    echo "Health check failed, retrying in ${HEALTH_SLEEP_SECONDS}s... (${attempt}/${HEALTH_RETRIES})"
    sleep "$HEALTH_SLEEP_SECONDS"
  done
else
  echo "HEALTH_URL is empty; skipping public health check."
fi

if [[ "$RUN_SIAKAD_UAT" == "true" ]]; then
  echo "==> Running SIAKAD UAT preview"
  uat_env=(-e UAT_START_MOCK_SIAKAD=false)
  if [[ -n "$HEALTH_URL" ]]; then
    uat_env+=(-e "UAT_BASE_URL=${HEALTH_URL%/health}")
  fi

  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T \
    "${uat_env[@]}" backend npm run uat:siakad:database
fi

echo
echo "Production launch flow complete."
