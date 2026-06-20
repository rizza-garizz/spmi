#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
ENV_FILE="${ENV_FILE:-.env}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

cd "$APP_DIR"

failures=0

check() {
  local label="$1"
  shift

  if "$@"; then
    echo "[OK] ${label}"
  else
    echo "[FAIL] ${label}"
    failures=$((failures + 1))
  fi
}

env_value() {
  local key="$1"
  grep -E "^${key}=" "$ENV_FILE" | tail -n 1 | cut -d= -f2-
}

is_filled() {
  local key="$1"
  local value
  value="$(env_value "$key" || true)"
  [[ -n "$value" && "$value" != change-this* && "$value" != "admin@example.com" && "$value" != *example.com* ]]
}

is_boolean() {
  local key="$1"
  local value
  value="$(env_value "$key" || true)"
  [[ "$value" == "true" || "$value" == "false" ]]
}

has_min_length() {
  local key="$1"
  local min="$2"
  local value
  value="$(env_value "$key" || true)"
  [[ "${#value}" -ge "$min" ]]
}

is_domain() {
  local key="$1"
  local value
  value="$(env_value "$key" || true)"
  [[ "$value" =~ ^[A-Za-z0-9.-]+$ && "$value" == *.* && "$value" != http* ]]
}

check "Docker CLI tersedia" command -v docker
check "Docker Compose plugin tersedia" docker compose version
check "curl tersedia" command -v curl
check "git tersedia" command -v git
check "File compose tersedia" test -f "$COMPOSE_FILE"
check "File env tersedia" test -f "$ENV_FILE"

if [[ -f "$ENV_FILE" ]]; then
  check "TRAEFIK_ACME_EMAIL sudah diisi" is_filled TRAEFIK_ACME_EMAIL
  check "SPMI_FRONTEND_DOMAIN sudah domain valid" is_domain SPMI_FRONTEND_DOMAIN
  check "SPMI_API_DOMAIN sudah domain valid" is_domain SPMI_API_DOMAIN
  check "POSTGRES_DB sudah diisi" is_filled POSTGRES_DB
  check "POSTGRES_USER sudah diisi" is_filled POSTGRES_USER
  check "POSTGRES_PASSWORD sudah diisi" is_filled POSTGRES_PASSWORD
  check "JWT_SECRET minimal 32 karakter" has_min_length JWT_SECRET 32
  check "ENABLE_API_DOCS boolean" is_boolean ENABLE_API_DOCS
  check "SIAKAD_SYNC_ENABLED boolean" is_boolean SIAKAD_SYNC_ENABLED

  if [[ "$(env_value SIAKAD_SYNC_ENABLED || true)" == "true" ]]; then
    check "SIAKAD_BASE_URL sudah diisi saat sync aktif" is_filled SIAKAD_BASE_URL
    check "SIAKAD_API_TOKEN sudah diisi saat sync aktif" is_filled SIAKAD_API_TOKEN
  fi

  check "Compose config valid" docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" config --quiet
fi

if [[ "$failures" -gt 0 ]]; then
  echo
  echo "Production preflight failed with ${failures} issue(s). Fix them before launch."
  exit 1
fi

echo
echo "Production preflight passed. Launch prerequisites look ready."
