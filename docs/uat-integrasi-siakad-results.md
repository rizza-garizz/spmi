# Hasil UAT Awal SPMI dan Integrasi SIAKAD

Tanggal uji: 2026-06-09

## Lingkungan Uji

- Frontend lokal: `http://localhost:3001`
- Backend lokal: `http://localhost:4000`
- Mode backend utama: `APP_MODE=local_mock`
- SIAKAD utama: mock katalog lokal karena `SIAKAD_SYNC_ENABLED=false`
- Uji connector online: mock SIAKAD API sementara di `http://127.0.0.1:4555/api`

## Ringkasan

Status: layak lanjut ke staging database.

Catatan utama:

- Sistem SPMI berjalan lokal tanpa database.
- Frontend route utama berhasil dirender.
- Backend endpoint inti berhasil diakses dengan token admin.
- Role access berjalan: role non-admin ditolak untuk aksi admin.
- Preview integrasi SIAKAD berjalan dalam mode mock dan mode connector online.
- Commit sinkronisasi SIAKAD sengaja belum diuji penuh karena membutuhkan `APP_MODE=database` dan PostgreSQL.

## Hasil Uji Backend

| Skenario | Hasil |
| --- | --- |
| `GET /health` | Pass, `200` |
| `GET /system/status` | Pass, mode `local_mock` |
| Login `admin@spmi.local` | Pass |
| `GET /auth/me` | Pass |
| `GET /dashboard/summary` | Pass |
| `GET /catalog` | Pass |
| `GET /standards` | Pass |
| `GET /documents` | Pass |
| `GET /ppepp/cycles` | Pass |
| `GET /ami/audits` | Pass |
| `GET /rtm/meetings` | Pass |
| `GET /org-units` | Pass |

## Hasil Uji Frontend

Semua route utama berikut berhasil `200` setelah cache dev `.next` dibersihkan dan frontend direstart:

- `/`
- `/login`
- `/dashboard`
- `/standards`
- `/documents`
- `/ppepp`
- `/ami`
- `/rtm`
- `/organization`
- `/integrations`

Catatan:

- Sempat ditemukan error dev cache: `Cannot find module './8294.js'`.
- Perbaikan: hapus `frontend/.next`, restart `npm run dev`.
- Production build sebelumnya sudah berhasil.

## Hasil Uji Role dan Validasi

| Skenario | Hasil |
| --- | --- |
| Auditor membaca standar | Pass, `200` |
| Auditor membuat standar | Pass, ditolak `403` |
| Admin membuat standar | Pass, `201` |
| Duplicate standar judul+kategori | Pass, ditolak `409` |
| Admin membuat siklus PPEPP | Pass, `201` |

Catatan:

- Pada mode lokal, kode standar dibuat otomatis, sehingga validasi duplicate yang benar adalah judul+kategori, bukan kode input.

## Hasil Audit HRIS

Hak akses HRIS:

- Diizinkan: `super_admin`, `admin_lpm`, `dekan`, `wakil_dekan`.
- Ditolak: role operasional seperti `unit_kerja` untuk endpoint HRIS admin.

Hasil uji API HRIS:

| Skenario | Hasil |
| --- | --- |
| Admin membaca ringkasan HRIS | Pass, `200` |
| Dekan membaca daftar pegawai | Pass, `200` |
| Unit kerja membaca HRIS | Pass, ditolak `403` |
| Admin membuat pegawai | Pass, `201` |
| Duplicate pegawai dengan NIP/NIDN/email sama | Pass, ditolak `409` |
| Admin membaca profil pegawai | Pass, `200` |
| Admin update pegawai | Pass, `200` |
| Admin membuat jabatan | Pass, `201` |
| Admin membuat kompetensi | Pass, `201` |
| Admin membuat dokumen HRIS | Pass, `201` |
| Cleanup data HRIS uji | Pass, semua `200` |

Hasil uji frontend HRIS:

Semua route berikut berhasil `200`:

- `/hris`
- `/hris/master-sdm`
- `/hris/master-sdm/pegawai`
- `/hris/master-sdm/dosen`
- `/hris/master-sdm/tendik`
- `/hris/jabatan`
- `/hris/jabatan/struktural`
- `/hris/kompetensi`
- `/hris/kompetensi/sertifikasi`
- `/hris/kompetensi/pelatihan`
- `/hris/dokumen`
- `/hris/dokumen/sk-jabatan`
- `/hris/dokumen/sertifikat`
- `/hris/dokumen/upload`
- `/hris/integrasi-spmi`
- `/hris/integrasi-spmi/standar-sdm`
- `/hris/integrasi-spmi/ami-akreditasi`

## Hasil Uji SIAKAD Mock Lokal

| Endpoint | Hasil |
| --- | --- |
| `GET /integrations/siakad/check` | Pass, status `mock` |
| `POST /integrations/siakad/org-units/preview` | Pass |
| Preview summary | `incoming: 3`, `update: 3`, `conflict: 0` |
| `POST /integrations/siakad/org-units/commit` | Pass sebagai guard, ditolak `409` karena butuh database |

## Hasil Uji Connector SIAKAD Online

Mock SIAKAD API sementara mengembalikan 3 data:

- 2 unit aktif
- 1 unit nonaktif

Hasil:

| Skenario | Hasil |
| --- | --- |
| `GET /integrations/siakad/check` | Pass, status `online` |
| Sample count dari API | `3` |
| `POST /integrations/siakad/org-units/preview` | Pass |
| Preview summary | `incoming: 2`, `create: 2`, `conflict: 0` |
| Filter data nonaktif | Pass, data nonaktif tidak masuk preview |

## Hasil Uji Conflict Detection

Payload dengan kode duplikat dan parent tidak valid menghasilkan:

- `incoming: 2`
- `create: 2`
- `conflict: 2`

Status: pass.

## Batasan Uji Saat Ini

Belum diuji:

- Commit sinkronisasi SIAKAD ke database.
- Persistensi batch staging `SiakadSyncBatch`.
- Prisma migrate/seed pada PostgreSQL staging.
- Traefik/HTTPS production runtime.

Alasan:

- Docker belum tersedia di mesin lokal ini.
- PostgreSQL staging belum berjalan.

## Rekomendasi Tahap Berikutnya

1. Jalankan PostgreSQL melalui Docker Compose di VPS/staging.
2. Set backend ke `APP_MODE=database`.
3. Jalankan `npx prisma migrate deploy`.
4. Jalankan `npm run prisma:seed`.
5. Ulang uji:
   - SIAKAD check
   - SIAKAD preview
   - conflict resolution
   - SIAKAD commit
   - cek `GET /org-units`
   - cek audit trail dan batch history
6. Setelah staging hijau, baru lanjut UAT dengan token SIAKAD asli.

## Script UAT Database

Script otomatis untuk tahap staging sudah tersedia:

```bash
cd backend-node
npm run uat:siakad:database
```

Default script:

- Menguji backend di `http://127.0.0.1:4000`.
- Login dengan `admin@spmi.local`.
- Memastikan backend sudah `APP_MODE=database`.
- Menjalankan SIAKAD check, preview, commit, cek org unit, dan cek batch history.
- Membuka mock SIAKAD API sementara di port `4555`.
- Untuk mode mock internal, backend yang sedang diuji harus sudah distart dengan `SIAKAD_BASE_URL=http://127.0.0.1:4555/api`.

Contoh menjalankan backend staging lokal dengan mock SIAKAD internal:

```bash
APP_MODE=database \
SIAKAD_SYNC_ENABLED=true \
SIAKAD_BASE_URL=http://127.0.0.1:4555/api \
SIAKAD_ORG_UNITS_PATH=/org-units \
npm start
```

Jika backend staging memakai URL/akun lain:

```bash
UAT_BASE_URL=https://api.spmi.example.com \
UAT_ADMIN_EMAIL=admin@spmi.local \
UAT_ADMIN_PASSWORD='Password123!' \
npm run uat:siakad:database
```

Jika ingin memakai SIAKAD asli, matikan mock internal dan pastikan backend `.env` sudah menunjuk ke API SIAKAD asli:

```bash
UAT_START_MOCK_SIAKAD=false npm run uat:siakad:database
```

Mode SIAKAD asli default-nya preview-only. Commit data asli hanya berjalan jika flag berikut ditambahkan:

```bash
UAT_START_MOCK_SIAKAD=false UAT_ALLOW_COMMIT=true npm run uat:siakad:database
```
