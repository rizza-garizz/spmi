# Backend Finishing Checklist

Dokumen ini adalah checklist eksekusi untuk menyelesaikan backend project `spmi-main` sampai stabil, mudah dijalankan, dan minim pertanyaan lanjutan.

## Goal

- Menetapkan satu backend resmi
- Menyamakan kontrak API dengan frontend
- Menyediakan mode demo lokal dan mode database yang jelas
- Menyederhanakan setup lokal
- Menutup gap auth, route, write path, dan dokumentasi

## Definition of Done

- [x] Hanya ada satu backend resmi yang dijelaskan di dokumentasi
- [x] Login lokal berjalan dengan akun seed
- [x] Semua halaman utama frontend dapat dibuka tanpa error fatal
- [x] Semua form utama dapat submit pada mode lokal
- [x] Backend memiliki mode `local_mock` dan `database`
- [x] Setup PostgreSQL untuk mode database terdokumentasi jelas
- [x] Swagger sinkron dengan route yang benar-benar aktif
- [x] Ada endpoint status sistem
- [x] Ada test dasar untuk route penting

## Phase 1 - Finalisasi Arsitektur

### 1. Tetapkan backend resmi

- [x] Putuskan bahwa `backend-node` adalah backend utama
- [x] Nyatakan folder `backend/` Laravel sebagai legacy atau nonaktif
- [x] Hapus ambiguitas arsitektur dari dokumentasi utama

File terkait:

- `README.md`
- `docker-compose.yml`

Output:

- Dokumentasi tidak lagi memunculkan pertanyaan "pakai backend yang mana?"

### 2. Tambahkan mode backend eksplisit

- [x] Tambah env `APP_MODE=local_mock`
- [x] Tambah opsi `APP_MODE=database`
- [x] Export `appMode` dari config env
- [x] Gunakan `appMode` untuk menentukan strategi data dan auth

File terkait:

- `backend-node/.env.example`
- `backend-node/src/config/env.js`

Output:

- Fallback lokal bukan perilaku kebetulan

## Phase 2 - Stabilkan Data Layer

### 3. Jadikan satu sumber data mock

- [x] Pastikan semua data mock terpusat di `catalogStore`
- [x] Pastikan entity berikut tersedia:
- [x] `standards`
- [x] `documents`
- [x] `ppeppCycles`
- [x] `audits`
- [x] `meetings`
- [x] `indicators`
- [x] `orgUnits`
- [x] Tambahkan helper create untuk entity yang dipakai form

File terkait:

- `backend-node/src/services/catalogStore.js`

Output:

- Semua route demo lokal membaca data dari satu tempat

### 4. Rapikan local auth

- [x] Pastikan seed user dibaca dari satu service
- [x] Pastikan token local memiliki penanda mode
- [x] Pastikan middleware auth tidak memanggil Prisma saat token local
- [x] Pastikan `/auth/me` berjalan pada mode local
- [x] Pastikan logout local tidak gagal karena database

File terkait:

- `backend-node/src/services/localAuth.js`
- `backend-node/src/controllers/authController.js`
- `backend-node/src/middlewares/auth.js`

Output:

- Login demo lokal stabil dan bisa dipakai untuk uji role

## Phase 3 - Samakan API Dengan Frontend

### 5. Finalkan route publik yang dipakai frontend

- [x] Pastikan route ini aktif:
- [x] `GET /health`
- [x] `POST /auth/login`
- [x] `GET /auth/me`
- [x] `GET /dashboard/summary`
- [x] `GET/POST /standards`
- [x] `GET/POST /documents`
- [x] `GET /documents/versions/:versionId`
- [x] `GET/POST /ppepp/cycles`
- [x] `GET/POST /ami/audits`
- [x] `POST /ami/audits/:id/findings`
- [x] `GET/POST /rtm/meetings`
- [x] `GET/POST /indicators`
- [x] `POST /indicators/:id/values`
- [x] `GET /org-units`
- [x] `GET /integrations`
- [x] `GET /imports`
- [x] `GET /surveys`
- [ ] Tentukan nasib route alias lama:
- [ ] pertahankan sementara untuk kompatibilitas, atau
- [ ] hapus setelah frontend migrasi penuh

File terkait:

- `backend-node/src/routes/index.js`
- `backend-node/src/controllers/compatController.js`

Output:

- Frontend dan backend memakai bahasa route yang sama

### 6. Samakan bentuk response

- [x] Pilih satu format response sukses:
- [x] `{ success: true, data, message }`
- [x] Pilih satu format response gagal:
- [x] `{ success: false, data: null, message }`
- [x] Pastikan controller compat mengikuti format ini
- [ ] Identifikasi endpoint yang masih mengirim object langsung
- [ ] Jadwalkan penghapusan fallback parsing di frontend setelah backend konsisten

File terkait:

- `backend-node/src/utils/apiResponse.js`
- `backend-node/src/controllers/compatController.js`
- `backend-node/src/controllers/authController.js`

Output:

- Frontend tidak lagi butuh banyak parsing defensif

### 7. Samakan validator dengan payload UI

- [x] Audit payload dari semua form aktif
- [x] Cocokkan field berikut:
- [x] login
- [x] standard create
- [x] document upload
- [x] PPEPP cycle create
- [x] AMI audit create
- [x] AMI finding create
- [x] RTM meeting create
- [x] indicator create
- [x] indicator value create
- [x] Jika field frontend dan backend berbeda, normalisasi di backend dulu

File terkait:

- `backend-node/src/validators/index.js`
- `backend-node/src/controllers/compatController.js`

Output:

- Submit form tidak gagal hanya karena mismatch nama field

## Phase 4 - Rapikan Frontend Integration

### 8. Pusatkan pembacaan session frontend

- [x] Jadikan `spmi-session-client.ts` sebagai sumber utama session
- [x] Migrasikan komponen yang masih baca `spmi_token` langsung
- [x] Pastikan topbar, login, dan logout memakai jalur yang sama
- [x] Bersihkan key lokal lama secara konsisten saat logout

File terkait:

- `frontend/lib/spmi-session-client.ts`
- `frontend/components/auth/login-form.tsx`
- `frontend/components/layout/topbar-session.tsx`
- komponen lain yang masih baca `localStorage` langsung

Output:

- Session frontend konsisten di semua halaman

### 9. Tutup gap write path form utama

- [x] Form tambah standar menerima respons backend final
- [x] Form upload dokumen menerima respons backend final
- [x] Form PPEPP menerima respons backend final
- [x] Form AMI menerima respons backend final
- [x] Form RTM menerima respons backend final
- [x] Form indikator menerima respons backend final
- [x] Form input capaian indikator menerima respons backend final
- [x] Tampilkan pesan sukses dan gagal yang jelas

File terkait:

- `frontend/components/isian/standards/create-standard-form.tsx`
- `frontend/components/isian/documents/create-document-form.tsx`
- `frontend/components/isian/ppepp/create-ppepp-cycle-form.tsx`
- `frontend/components/isian/ami/create-ami-audit-form.tsx`
- `frontend/components/isian/rtm/create-rtm-meeting-form.tsx`
- `frontend/modules/indicators/indicators-page.tsx`

Output:

- Demo lokal terasa utuh, bukan read-only

## Phase 5 - Siapkan Mode Database Penuh

### 10. Finalkan Prisma schema dan seed

- [ ] Pastikan schema mencakup kebutuhan halaman frontend aktif
- [ ] Pastikan seed mengisi:
- [ ] user
- [ ] org units
- [ ] standards
- [ ] documents
- [ ] audits
- [ ] findings
- [ ] RTM meetings
- [ ] indicators
- [ ] indicator values
- [ ] system settings
- [ ] Pastikan login seed database terdokumentasi

File terkait:

- `backend-node/prisma/schema.prisma`
- `backend-node/prisma/seed.js`

Output:

- Mode database dapat dipakai tanpa setup manual tambahan

### 11. Buat alur setup database yang jelas

- [x] Dokumentasikan urutan:
- [x] `npm install`
- [x] `npx prisma generate`
- [x] `npx prisma migrate dev` atau `npx prisma migrate deploy`
- [x] `npm run prisma:seed`
- [x] `npm run dev`
- [x] Dokumentasikan nilai `DATABASE_URL`
- [x] Dokumentasikan port database

File terkait:

- `backend-node/README.md`
- `README.md`
- `backend-node/.env.example`

Output:

- Orang baru bisa menjalankan mode database tanpa tanya manual

### 12. Tambahkan Docker Compose khusus backend-node

- [ ] Buat file compose baru yang fokus ke `backend-node + postgres`
- [ ] Hindari mencampur dengan stack Laravel lama
- [ ] Tentukan port final:
- [ ] frontend `3001`
- [ ] backend `4000`
- [ ] postgres `5432` atau `5433`
- [ ] Tambahkan command awal yang mudah dipakai

File baru yang disarankan:

- `docker-compose.backend-node.yml`

Output:

- Menjalankan environment penuh cukup dengan satu compose file

## Phase 6 - Monitoring, Docs, dan QA

### 13. Tambahkan endpoint status sistem

- [x] Tambah endpoint `GET /system/status`
- [x] Tampilkan:
- [x] `app_mode`
- [x] `database_connected`
- [x] `seed_mode_active`
- [x] `api_version`
- [x] `uptime`
- [x] `timestamp`

File terkait:

- `backend-node/src/controllers/systemController.js`
- `backend-node/src/routes/index.js`

Output:

- Diagnosis backend jadi cepat

### 14. Sinkronkan Swagger

- [x] Hapus endpoint yang tidak lagi dipakai
- [x] Tambahkan route compat/final yang benar
- [x] Tambahkan contoh request login
- [x] Tambahkan contoh create standard
- [x] Tambahkan contoh create PPEPP cycle
- [x] Tambahkan contoh create RTM meeting
- [x] Tambahkan catatan mode `local_mock` dan `database`

File terkait:

- `backend-node/src/config/openapi.js`

Output:

- Swagger bisa dijadikan referensi tanpa menyesatkan

### 15. Tambahkan automated test minimal

- [x] Test `GET /health`
- [x] Test login local
- [x] Test `GET /dashboard/summary`
- [ ] Test `GET /standards`
- [x] Test `POST /ppepp/cycles`
- [x] Test `POST /ami/audits`
- [x] Test `POST /rtm/meetings`
- [x] Test `POST /indicators/:id/values`

Folder yang disarankan:

- `backend-node/tests/`

Output:

- Perubahan backend tidak perlu dicek manual terus

## Phase 7 - Cleanup Final

### 16. Hapus sisa legacy dan ambigu

- [ ] Cari semua referensi route lama
- [ ] Cari semua referensi port lama
- [ ] Cari semua pembacaan token lama
- [ ] Cari semua fallback sementara yang sudah tidak dibutuhkan
- [ ] Hapus komentar sementara dan dead code

Command audit yang disarankan:

```bash
rg -n "localhost:8001|spmi_token|spmi_user|/standar|/dokumen|backend/" frontend backend-node README.md
```

Output:

- Repo lebih bersih dan mudah dipahami

## Prioritas Eksekusi

Kerjakan dengan urutan ini:

1. Finalkan backend resmi dan dokumentasi
2. Tambahkan `APP_MODE`
3. Rapikan auth lokal
4. Rapikan route dan response contract
5. Bereskan form write utama
6. Siapkan mode database penuh
7. Buat endpoint status sistem
8. Sinkronkan Swagger
9. Tambahkan test dasar
10. Cleanup legacy

## Status Saat Ini

Sudah ada pondasi awal:

- [x] Frontend lokal berjalan di `http://localhost:3001`
- [x] Backend lokal berjalan di `http://localhost:4000`
- [x] Mode compat route dasar sudah tersedia
- [x] Fallback data lokal sudah dibuat
- [x] Local auth seed sudah mulai didukung
- [x] Beberapa form write utama sudah disesuaikan ke response compat

Masih perlu dituntaskan:

- [ ] `APP_MODE` resmi
- [x] mode database penuh
- [ ] Swagger final
- [ ] endpoint status sistem
- [ ] test otomatis
- [ ] pembersihan legacy total
