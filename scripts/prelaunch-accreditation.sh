#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
RUN_LOCAL_E2E="${RUN_LOCAL_E2E:-false}"
BASE_URL="${BASE_URL:-http://127.0.0.1:4000}"
FRONTEND_URL="${FRONTEND_URL:-http://127.0.0.1:3000}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@spmi.local}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Password123!}"
SMOKE_TIMEOUT_MS="${SMOKE_TIMEOUT_MS:-60000}"

cd "$APP_DIR"

echo "==> Git status"
git status --short
git log -1 --oneline --decorate

echo
echo "==> Validate operational scripts"
bash -n scripts/preflight-production.sh
bash -n scripts/launch-production.sh
bash -n scripts/status-production.sh
bash -n scripts/backup-production.sh
bash -n scripts/bootstrap-ubuntu-production.sh
bash -n scripts/generate-production-launch-secrets.sh
node -c scripts/smoke-production.js
node -c backend-node/scripts/uat-accreditation.js

echo
echo "==> Backend tests"
(cd backend-node && npm test)

if [[ "$RUN_LOCAL_E2E" == "true" ]]; then
  echo
  echo "==> Local smoke test"
  BASE_URL="$BASE_URL" \
    FRONTEND_URL="$FRONTEND_URL" \
    ADMIN_EMAIL="$ADMIN_EMAIL" \
    ADMIN_PASSWORD="$ADMIN_PASSWORD" \
    SMOKE_TIMEOUT_MS="$SMOKE_TIMEOUT_MS" \
    node scripts/smoke-production.js

  echo
  echo "==> Local accreditation UAT"
  (cd backend-node && \
    UAT_BASE_URL="$BASE_URL" \
    UAT_ADMIN_EMAIL="$ADMIN_EMAIL" \
    UAT_ADMIN_PASSWORD="$ADMIN_PASSWORD" \
    npm run uat:accreditation)
else
  echo
  echo "Skipping local E2E. Set RUN_LOCAL_E2E=true when local frontend/backend are running."
fi

echo
echo "==> Frontend production build"
(cd frontend && npm run build)

echo
echo "Prelaunch accreditation check passed."
