#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
ENV_FILE="${ENV_FILE:-.env}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
LOG_LINES="${LOG_LINES:-80}"
HEALTH_URL="${HEALTH_URL:-}"

cd "$APP_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Env file not found: ${ENV_FILE}"
  exit 1
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Compose file not found: ${COMPOSE_FILE}"
  exit 1
fi

echo "==> Git"
git log -1 --decorate --oneline || true
git status --short || true

echo
echo "==> Docker Compose services"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps

echo
echo "==> Container health"
docker inspect --format '{{.Name}} {{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
  spmi-traefik spmi-postgres spmi-api spmi-frontend 2>/dev/null || true

echo
echo "==> Internal API health"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T backend \
  node -e "fetch('http://127.0.0.1:4000/health').then(async r=>{console.log(r.status); console.log(await r.text())}).catch(e=>{console.error(e.message); process.exit(1)})" || true

if [[ -n "$HEALTH_URL" ]]; then
  echo
  echo "==> Public API health: ${HEALTH_URL}"
  curl -fsS "$HEALTH_URL" || true
  echo
fi

echo
echo "==> Disk usage"
df -h .
du -sh backups 2>/dev/null || true
du -sh backend-node/uploads 2>/dev/null || true

echo
echo "==> Recent backend logs"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs --tail "$LOG_LINES" backend || true

echo
echo "==> Recent frontend logs"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs --tail "$LOG_LINES" frontend || true
