# Deploy SPMI dengan Docker Compose dan Traefik

Dokumen ini memakai backend resmi `backend-node/` dan frontend resmi `frontend/`.

## 1. Syarat Server

- Domain sudah mengarah ke IP server:
  - `spmi.example.com`
  - `api.spmi.example.com`
- Port publik terbuka: `80` dan `443`.
- Docker dan Docker Compose plugin sudah terpasang.

Untuk server Ubuntu baru, bootstrap Docker dan repo production:

```bash
curl -fsSL https://raw.githubusercontent.com/rizza-garizz/spmi/codex-spmi-ready/scripts/bootstrap-ubuntu-production.sh -o bootstrap-ubuntu-production.sh
sudo RELEASE_REF=launch-candidate-2026-06-21-r7 bash bootstrap-ubuntu-production.sh
```

Contoh install di Ubuntu:

```bash
sudo apt update
sudo apt install ca-certificates curl gnupg -y
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y
```

## 2. Siapkan Env

```bash
cp .env.production.example .env
nano .env
```

Untuk staging/UAT database dengan mock SIAKAD internal, boleh mulai dari:

```bash
cp .env.staging.example .env
nano .env
```

Wajib ganti:

- `TRAEFIK_ACME_EMAIL`
- `SPMI_FRONTEND_DOMAIN`
- `SPMI_API_DOMAIN`
- `POSTGRES_PASSWORD`
- `JWT_SECRET`

`JWT_SECRET` wajib panjang, minimal 32 karakter.

## 3. Build dan Jalankan

Cara cepat production:

```bash
HEALTH_URL=https://api.spmi.example.com/health ./scripts/launch-production.sh
```

Script ini menjalankan preflight, backup production jika database lama sudah berjalan, build/deploy container, seed database, dan health check publik. Untuk sekaligus menjalankan preview UAT SIAKAD setelah deploy:

```bash
HEALTH_URL=https://api.spmi.example.com/health RUN_SIAKAD_UAT=true ./scripts/launch-production.sh
```

Cara manual:

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Deploy production juga bisa dijalankan manual dari GitHub Actions workflow `Deploy Production` setelah secret server production disiapkan:

- `PRODUCTION_HOST`
- `PRODUCTION_PORT` opsional
- `PRODUCTION_USER`
- `PRODUCTION_SSH_KEY`
- `PRODUCTION_SMOKE_ADMIN_PASSWORD` jika smoke test workflow diaktifkan
- `PRODUCTION_SMOKE_ADMIN_EMAIL` opsional

Checklist detail tersedia di [production-github-actions-deploy-checklist.md](./production-github-actions-deploy-checklist.md).

Backend otomatis menjalankan:

```bash
npx prisma migrate deploy
npm start
```

## 4. Seed Data Awal

Setelah container hidup:

```bash
docker compose -f docker-compose.prod.yml --env-file .env exec backend npm run prisma:seed
```

## 5. Verifikasi

```bash
docker compose -f docker-compose.prod.yml --env-file .env ps
curl https://api.spmi.example.com/health
```

Buka frontend:

```text
https://spmi.example.com
```

## 5.1 UAT Integrasi SIAKAD Database

Runbook detail tersedia di [staging-database-uat-runbook.md](./staging-database-uat-runbook.md).

Setelah backend, database, migrate, dan seed selesai, jalankan UAT otomatis.

Untuk UAT dengan mock SIAKAD internal, backend harus sudah dijalankan dengan env berikut:

```env
SIAKAD_SYNC_ENABLED=true
SIAKAD_BASE_URL=http://127.0.0.1:4555/api
SIAKAD_API_KEY_HEADER=X-API-Key
SIAKAD_HEALTH_PATH=
SIAKAD_ORG_UNITS_PATH=/org-units
```

Lalu jalankan:

```bash
docker compose -f docker-compose.prod.yml --env-file .env exec backend npm run uat:siakad:database
```

Untuk UAT terhadap domain publik:

```bash
docker compose -f docker-compose.prod.yml --env-file .env exec \
  -e UAT_BASE_URL=https://api.spmi.example.com \
  backend npm run uat:siakad:database
```

Untuk memakai API SIAKAD asli, isi variabel `SIAKAD_*` di `.env`, deploy ulang backend, lalu jalankan:

```env
SIAKAD_SYNC_ENABLED=true
SIAKAD_BASE_URL=https://siakad.kampus.ac.id/api
SIAKAD_AUTH_TYPE=bearer
SIAKAD_API_KEY_HEADER=X-API-Key
SIAKAD_API_TOKEN=token-service-account
SIAKAD_HEALTH_PATH=/health
SIAKAD_ORG_UNITS_PATH=/org-units
```

```bash
docker compose -f docker-compose.prod.yml --env-file .env exec \
  -e UAT_START_MOCK_SIAKAD=false \
  -e UAT_BASE_URL=https://api.spmi.example.com \
  backend npm run uat:siakad:database
```

UAT SIAKAD asli default-nya preview-only. Untuk commit setelah preview disetujui:

```bash
docker compose -f docker-compose.prod.yml --env-file .env exec \
  -e UAT_START_MOCK_SIAKAD=false \
  -e UAT_ALLOW_COMMIT=true \
  -e UAT_BASE_URL=https://api.spmi.example.com \
  backend npm run uat:siakad:database
```

## 6. Operasi Harian

Status production cepat:

```bash
HEALTH_URL=https://api.spmi.example.com/health ./scripts/status-production.sh
```

Smoke test production:

```bash
BASE_URL=https://api.spmi.example.com \
FRONTEND_URL=https://spmi.example.com \
ADMIN_EMAIL=admin@spmi.local \
ADMIN_PASSWORD='Password123!' \
node scripts/smoke-production.js
```

UAT modul akreditasi:

```bash
docker compose -f docker-compose.prod.yml --env-file .env exec \
  -e UAT_BASE_URL=https://api.spmi.example.com \
  -e UAT_ADMIN_EMAIL=admin@spmi.local \
  -e UAT_ADMIN_PASSWORD='Password123!' \
  backend npm run uat:accreditation
```

Backup production manual:

```bash
./scripts/backup-production.sh
```

Lihat log:

```bash
docker compose -f docker-compose.prod.yml --env-file .env logs -f backend
docker compose -f docker-compose.prod.yml --env-file .env logs -f frontend
docker compose -f docker-compose.prod.yml --env-file .env logs -f traefik
```

Update deploy:

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Stop:

```bash
docker compose -f docker-compose.prod.yml --env-file .env down
```

Jangan pakai `down -v` di production kecuali memang mau menghapus data database dan upload.
