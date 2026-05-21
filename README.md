# SPMI Command Center

## Go-Live Documents

- [UAT Go-Live Checklist](docs/uat-go-live-checklist.md)
- [Production Operations Runbook](docs/production-operations-runbook.md)

SPMI Command Center adalah dashboard Sistem Penjaminan Mutu Internal untuk perguruan tinggi. Repo ini memakai:

- Frontend resmi: `frontend/` dengan Next.js 15
- Backend resmi: `backend-node/` dengan Express + Prisma
- Database resmi untuk mode penuh: PostgreSQL

Catatan penting:

- Folder `backend/` berbasis Laravel saat ini dianggap legacy dan bukan jalur backend utama.
- Untuk pengembangan cepat tersedia mode `local_mock` di `backend-node` agar UI dan API bisa didemokan tanpa database.

## Arsitektur Saat Ini

- Frontend: `http://localhost:3001`
- Backend API: `http://localhost:4000`
- Swagger: `http://localhost:4000/docs`
- System status: `http://localhost:4000/system/status`

## Cara Menjalankan

### Opsi A - Demo Cepat Tanpa Database

1. Jalankan backend-node dalam mode lokal:

```bash
cd backend-node
cp .env.example .env
npm install
npm run dev
```

2. Pastikan `.env` memakai:

```bash
APP_MODE=local_mock
PORT=4000
APP_URL=http://localhost:4000
```

3. Jalankan frontend:

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev -- --hostname 0.0.0.0 --port 3001
```

4. Isi `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:4000
```

### Opsi B - Mode Database Penuh

1. Jalankan PostgreSQL lokal atau Docker Compose:

```bash
docker compose -f docker-compose.backend-node.yml up -d postgres
```

2. Ubah backend ke mode database:

```bash
APP_MODE=database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/spmi_command_center?schema=public
```

3. Jalankan setup Prisma:

```bash
cd backend-node
npm install
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

## Seed Login Demo

Untuk mode `local_mock`:

- `admin@spmi.local` / `Password123!`
- `lpm@spmi.local` / `Password123!`
- `auditor@spmi.local` / `Password123!`
- `unit@spmi.local` / `Password123!`

Untuk mode `database`, lihat juga seed di `backend-node/prisma/seed.js`.

## Endpoint Utama

- `GET /health`
- `GET /system/status`
- `POST /auth/login`
- `GET /auth/me`
- `GET /dashboard/summary`
- `GET/POST /standards`
- `GET/POST /documents`
- `GET/POST /ppepp/cycles`
- `GET/POST /ami/audits`
- `GET/POST /rtm/meetings`
- `GET/POST /indicators`

## File Penting

- Checklist finishing: [BACKEND_FINISHING_CHECKLIST.md](./BACKEND_FINISHING_CHECKLIST.md)
- Dokumentasi backend: [backend-node/README.md](./backend-node/README.md)
- Compose backend-node: [docker-compose.backend-node.yml](./docker-compose.backend-node.yml)
