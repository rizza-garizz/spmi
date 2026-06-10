# Runbook UAT Database Staging

Runbook ini dipakai untuk membuktikan sinkronisasi SIAKAD sampai tahap commit database sebelum production.

## 1. Siapkan Server

Pastikan server sudah punya:

- Docker
- Docker Compose plugin
- Domain/subdomain staging yang mengarah ke IP server
- Port `80` dan `443` terbuka

## 2. Siapkan Env Staging

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

Untuk UAT mock SIAKAD internal, biarkan:

```env
SIAKAD_SYNC_ENABLED=true
SIAKAD_BASE_URL=http://127.0.0.1:4555/api
SIAKAD_ORG_UNITS_PATH=/org-units
```

## 3. Build dan Jalankan Stack

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Tunggu sampai semua service sehat:

```bash
docker compose -f docker-compose.prod.yml --env-file .env ps
```

## 4. Seed Data Awal

```bash
docker compose -f docker-compose.prod.yml --env-file .env exec backend npm run prisma:seed
```

## 5. Cek Backend

```bash
curl https://api-staging-domain/health
```

Atau dari dalam container:

```bash
docker compose -f docker-compose.prod.yml --env-file .env exec backend \
  node -e "fetch('http://127.0.0.1:4000/health').then(async r=>{console.log(r.status); console.log(await r.text())})"
```

## 6. Jalankan UAT SIAKAD Database

```bash
docker compose -f docker-compose.prod.yml --env-file .env exec backend npm run uat:siakad:database
```

Output sukses harus berisi:

```json
{
  "success": true
}
```

Yang diverifikasi script:

- Backend sudah `APP_MODE=database`.
- Admin bisa login.
- SIAKAD check `online`.
- Preview SIAKAD tidak memiliki konflik.
- Commit SIAKAD berhasil.
- Unit hasil commit muncul di `GET /org-units`.
- Batch history sinkronisasi terbaca.

## 7. UAT Dengan SIAKAD Asli

Edit `.env`:

```env
SIAKAD_SYNC_ENABLED=true
SIAKAD_BASE_URL=https://siakad.kampus.ac.id/api
SIAKAD_AUTH_TYPE=bearer
SIAKAD_API_TOKEN=token-service-account
SIAKAD_ORG_UNITS_PATH=/org-units
```

Deploy ulang backend:

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build backend
```

Jalankan UAT tanpa mock internal:

```bash
docker compose -f docker-compose.prod.yml --env-file .env exec \
  -e UAT_START_MOCK_SIAKAD=false \
  backend npm run uat:siakad:database
```

Perintah di atas hanya menjalankan check dan preview. Commit data SIAKAD asli sengaja dilewati sampai operator menyetujui hasil preview.

Jika preview sudah disetujui dan konflik `0`, jalankan commit eksplisit:

```bash
docker compose -f docker-compose.prod.yml --env-file .env exec \
  -e UAT_START_MOCK_SIAKAD=false \
  -e UAT_ALLOW_COMMIT=true \
  backend npm run uat:siakad:database
```

## 8. Jika Gagal

Cek log backend:

```bash
docker compose -f docker-compose.prod.yml --env-file .env logs -f backend
```

Cek variabel SIAKAD yang terbaca:

```bash
docker compose -f docker-compose.prod.yml --env-file .env exec backend env | grep SIAKAD
```

Cek database:

```bash
docker compose -f docker-compose.prod.yml --env-file .env exec postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\dt"
```

## 9. Kriteria Lulus

Staging dianggap lulus untuk integrasi awal jika:

- Frontend staging bisa dibuka via HTTPS.
- Backend `/health` sukses.
- `npm run uat:siakad:database` sukses dengan mock internal.
- Preview SIAKAD asli tidak menghasilkan konflik kritis.
- Commit SIAKAD asli sudah disetujui operator dan tercatat di batch history.
