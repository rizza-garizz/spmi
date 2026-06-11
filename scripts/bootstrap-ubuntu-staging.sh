#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${REPO_URL:-git@github.com:rizza-garizz/spmi.git}"
APP_DIR="${APP_DIR:-/opt/spmi}"
RELEASE_REF="${RELEASE_REF:-master}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run this script as root or with sudo."
  exit 1
fi

echo "==> Installing Docker prerequisites"
apt-get update
apt-get install -y ca-certificates curl git gnupg
install -m 0755 -d /etc/apt/keyrings

if [[ ! -f /etc/apt/keyrings/docker.gpg ]]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
fi

source /etc/os-release
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker

echo "==> Preparing application directory: ${APP_DIR}"
mkdir -p "$(dirname "${APP_DIR}")"

if [[ -d "${APP_DIR}/.git" ]]; then
  git -C "${APP_DIR}" fetch --all --tags
else
  git clone "${REPO_URL}" "${APP_DIR}"
fi

git -C "${APP_DIR}" checkout "${RELEASE_REF}"

if [[ ! -f "${APP_DIR}/.env" ]]; then
  cp "${APP_DIR}/.env.production.example" "${APP_DIR}/.env"
  chmod 600 "${APP_DIR}/.env"
  echo "==> Created ${APP_DIR}/.env from template."
  echo "==> Edit it before deploy: sudo nano ${APP_DIR}/.env"
else
  echo "==> Existing ${APP_DIR}/.env preserved."
fi

echo "==> Bootstrap complete"
echo "Next commands:"
echo "  cd ${APP_DIR}"
echo "  sudo nano .env"
echo "  sudo docker compose -f docker-compose.prod.yml --env-file .env up -d --build"
echo "  sudo docker compose -f docker-compose.prod.yml --env-file .env exec backend npm run prisma:seed"
