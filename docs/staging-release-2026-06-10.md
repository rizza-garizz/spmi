# Staging Release 2026-06-10

Release tag:

```bash
staging-2026-06-10
```

Commit:

```bash
61992ff feat: prepare deployment and accreditation workflows
```

## Scope

- Production Docker Compose dengan Traefik, PostgreSQL, backend, dan frontend.
- Environment template untuk production, staging, dan SIAKAD.
- Integrasi SIAKAD org unit dengan preview, staging table, commit, dan UAT script.
- Modul akreditasi: periode, instrumen, kriteria, LKPS, LED, bukti, self assessment, review, approval, export package, dan download manifest.
- Perbaikan sidebar/menu dan akses modul.

## Deploy Command

Jalankan di server/VPS:

```bash
git clone git@github.com:rizza-garizz/spmi.git
cd spmi
git checkout master
cp .env.production.example .env
nano .env
./scripts/preflight-staging.sh
./scripts/backup-staging.sh
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
docker compose -f docker-compose.prod.yml --env-file .env exec backend npm run prisma:seed
```

Untuk server Ubuntu baru, bootstrap Docker dan repo bisa memakai script:

```bash
curl -fsSL https://raw.githubusercontent.com/rizza-garizz/spmi/master/scripts/bootstrap-ubuntu-staging.sh -o bootstrap-ubuntu-staging.sh
sudo bash bootstrap-ubuntu-staging.sh
```

Setelah mengisi `.env`, jalankan preflight sebelum deploy:

```bash
cd /opt/spmi
sudo ./scripts/preflight-staging.sh
```

Sebelum deploy ulang atau UAT penting, ambil backup staging:

```bash
cd /opt/spmi
sudo ./scripts/backup-staging.sh
```

Backup berisi dump PostgreSQL format custom dan arsip `uploads` dari container backend.

## GitHub Actions Deploy

Setelah bootstrap server dan `.env` staging siap, deploy bisa dijalankan dari GitHub Actions:

```text
Actions -> Deploy Staging -> Run workflow
```

Repository secrets yang wajib diisi:

```text
STAGING_HOST
STAGING_USER
STAGING_SSH_KEY
```

Opsional:

```text
STAGING_PORT
```

Disarankan aktifkan environment protection di GitHub:

```text
Settings -> Environments -> staging
```

Tambahkan reviewer untuk approval deploy staging jika server sudah dipakai tim.

Default release workflow:

```text
master
```

Isi `health_url` agar workflow memverifikasi API setelah deploy:

```text
https://api-domain/health
```

Untuk deploy versi beku, isi input `release_ref` dengan tag staging, misalnya:

```text
staging-ready-2026-06-11
```

## Required Env

Wajib diganti sebelum deploy:

```env
TRAEFIK_ACME_EMAIL=
SPMI_FRONTEND_DOMAIN=
SPMI_API_DOMAIN=
POSTGRES_PASSWORD=
JWT_SECRET=
```

`JWT_SECRET` minimal 32 karakter.

Untuk staging dengan mock SIAKAD internal:

```env
SIAKAD_SYNC_ENABLED=true
SIAKAD_BASE_URL=http://127.0.0.1:4555/api
SIAKAD_ORG_UNITS_PATH=/org-units
```

Untuk SIAKAD asli, isi:

```env
SIAKAD_SYNC_ENABLED=true
SIAKAD_BASE_URL=
SIAKAD_AUTH_TYPE=bearer
SIAKAD_API_TOKEN=
SIAKAD_ORG_UNITS_PATH=/org-units
```

## Verification

```bash
docker compose -f docker-compose.prod.yml --env-file .env ps
curl https://api-domain/health
```

Lalu buka frontend:

```text
https://frontend-domain
```

## UAT After Deploy

Database and API smoke:

```bash
docker compose -f docker-compose.prod.yml --env-file .env exec backend npm test
```

SIAKAD UAT mock:

```bash
docker compose -f docker-compose.prod.yml --env-file .env exec backend npm run uat:siakad:database
```

SIAKAD UAT API publik:

```bash
docker compose -f docker-compose.prod.yml --env-file .env exec \
  -e UAT_BASE_URL=https://api-domain \
  backend npm run uat:siakad:database
```

SIAKAD asli preview-only:

```bash
docker compose -f docker-compose.prod.yml --env-file .env exec \
  -e UAT_START_MOCK_SIAKAD=false \
  -e UAT_BASE_URL=https://api-domain \
  backend npm run uat:siakad:database
```

Commit data SIAKAD asli hanya setelah preview disetujui:

```bash
docker compose -f docker-compose.prod.yml --env-file .env exec \
  -e UAT_START_MOCK_SIAKAD=false \
  -e UAT_ALLOW_COMMIT=true \
  -e UAT_BASE_URL=https://api-domain \
  backend npm run uat:siakad:database
```

## Rollback

Checkout tag sebelumnya jika tersedia, lalu rebuild:

```bash
git fetch --tags
git checkout <previous-tag>
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Jangan jalankan `docker compose down -v` di staging/production kecuali memang ingin menghapus database dan upload.
