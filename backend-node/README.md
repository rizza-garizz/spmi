# SPMI Command Center Backend

`backend-node/` adalah backend resmi untuk repo ini. Stack yang dipakai:

- Node.js 20
- Express
- PostgreSQL
- Prisma ORM
- JWT auth
- Multer upload
- Swagger UI di `/docs`

## Runtime Mode

Backend mendukung dua mode:

### `APP_MODE=local_mock`

Mode ini dipakai untuk demo cepat tanpa PostgreSQL. Data diambil dari snapshot katalog frontend dan local seed auth.

Cocok untuk:

- demo UI
- pairing cepat
- validasi route frontend
- pengembangan tanpa database

### `APP_MODE=database`

Mode ini dipakai untuk backend penuh dengan PostgreSQL + Prisma.

Cocok untuk:

- integrasi data nyata
- pengujian Prisma
- persiapan deployment

## Menjalankan Mode Local Mock

1. Salin env:

```bash
cp .env.example .env
```

2. Pastikan env minimal:

```bash
APP_MODE=local_mock
PORT=4000
APP_URL=http://localhost:4000
JWT_SECRET=super-secret-change-me
JWT_EXPIRES_IN=1d
UPLOAD_DIR=uploads
```

3. Install dan jalankan:

```bash
npm install
npm run dev
```

4. Cek endpoint:

- API: `http://localhost:4000`
- Swagger: `http://localhost:4000/docs`
- System status: `http://localhost:4000/system/status`

## Menjalankan Mode Database

1. Jalankan PostgreSQL lokal atau pakai compose:

```bash
docker compose -f ../docker-compose.backend-node.yml up -d postgres
```

2. Ubah env:

```bash
APP_MODE=database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/spmi_command_center?schema=public
```

3. Setup Prisma:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
```

4. Jalankan server:

```bash
npm run dev
```

## Seed Login

### Local mock

- `admin@spmi.local` / `Password123!`
- `lpm@spmi.local` / `Password123!`
- `auditor@spmi.local` / `Password123!`
- `unit@spmi.local` / `Password123!`

### Database seed

- `admin.lpm@spmi.local` / `Admin123!`
- `auditor@spmi.local` / `Auditor123!`
- `unit@spmi.local` / `Unit123!`

## Endpoint Inti

- `GET /health`
- `GET /system/status`
- `POST /auth/login`
- `GET /auth/me`
- `GET /dashboard/summary`
- `GET /catalog`
- `GET/POST /standards`
- `PUT/DELETE /standards/:id`
- `GET /standards/:id/revisions`
- `GET/POST /documents`
- `POST /documents/:id/versions`
- `GET /documents/versions/:versionId`
- `GET /documents/versions/:versionId/download`
- `GET /documents/versions/:versionId/preview`
- `GET/POST /ppepp/cycles`
- `PATCH /ppepp/cycles/:id/stages/:stage`
- `POST /ppepp/cycles/:id/stages/:stage/evidence`
- `GET/POST /ami/audits`
- `POST /ami/audits/:id/findings`
- `PATCH /ami/audits/:id/assignment`
- `PATCH /ami/audits/:id/instruments/:instrumentId`
- `PATCH /ami/audits/:id/findings/:findingId/follow-up`
- `PATCH /ami/audits/:id/findings/:findingId/verification`
- `GET /ami/audits/:id/summary`
- `GET/POST /rtm/meetings`
- `GET/POST /indicators`
- `POST /indicators/:id/values`

## Automated Smoke Test

Backend menyediakan smoke test minimal:

```bash
npm test
```

Yang dicek:

- `/health`
- `/system/status`
- local login
- `/dashboard/summary`

## Catatan

- Respons backend diarahkan ke format `{ success, data, message }`.
- `local_mock` adalah jalur resmi untuk demo lokal tanpa DB.
- `database` adalah jalur resmi untuk integrasi PostgreSQL + Prisma.
- Folder Laravel di root repo bukan backend utama.
