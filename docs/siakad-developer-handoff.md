# Handoff Integrasi SIAKAD untuk Developer Eksternal

Dokumen ini dipakai untuk koordinasi dengan developer SIAKAD. Targetnya sederhana: SPMI bisa membaca data akademik dari SIAKAD secara read-only, melakukan preview, lalu admin SPMI menyetujui commit ke database SPMI.

## Boundary Sistem

| Area | Pemilik | Catatan |
|---|---|---|
| API SIAKAD | Developer SIAKAD | Menyediakan endpoint, token, dan stabilitas response. |
| Connector SPMI | Tim SPMI | Mengambil data SIAKAD, validasi, preview, commit, dan audit trail. |
| Keputusan commit | Admin SPMI/LPM | Commit tidak otomatis untuk SIAKAD asli sebelum preview disetujui. |
| Data source of truth | SIAKAD | SPMI menyimpan snapshot agar modul mutu tetap berjalan saat API SIAKAD down. |

## Endpoint Minimum SIAKAD

### Health Check Opsional

```http
GET /health
Authorization: Bearer <token>
Accept: application/json
```

Response bebas selama HTTP `2xx` dan JSON valid. Contoh:

```json
{
  "status": "ok",
  "service": "siakad"
}
```

Jika endpoint health belum tersedia, SPMI dapat memakai endpoint org unit untuk check koneksi.

### Org Unit Wajib

```http
GET /org-units
Authorization: Bearer <token>
Accept: application/json
```

Response boleh array langsung atau object dengan `data`, `items`, `result`, atau `data.items`.

Contoh yang disarankan:

```json
{
  "data": [
    {
      "code": "FIKOM",
      "siakad_code": "FK01",
      "name": "Fakultas Ilmu Komputer",
      "type": "fakultas",
      "parent_code": null,
      "is_active": true
    },
    {
      "code": "SI",
      "siakad_code": "55201",
      "name": "Program Studi Sistem Informasi",
      "type": "prodi",
      "parent_code": "FIKOM",
      "is_active": true
    }
  ]
}
```

## Field Contract

| Field | Wajib | Deskripsi |
|---|---|---|
| `code` | Ya | Kode stabil untuk relasi di SPMI. Jika kosong, SPMI akan coba memakai kode SIAKAD. |
| `siakad_code` | Ya | Kode resmi di SIAKAD. |
| `name` | Ya | Nama unit, fakultas, atau program studi. |
| `type` | Ya | Disarankan `universitas`, `lpm`, `lembaga`, `fakultas`, `prodi`, atau `unit`. |
| `parent_code` | Tidak | Kode parent untuk membentuk struktur organisasi. |
| `is_active` | Tidak | Default `true`; nilai nonaktif tidak akan disinkron sebagai data aktif. |

SPMI juga menerima alias umum seperti `kode`, `kode_unit`, `kode_siakad`, `nama_unit`, `nama_prodi`, `jenis`, `level`, `parentCode`, dan `aktif`.

## Auth Yang Didukung

Bearer token:

```env
SIAKAD_AUTH_TYPE=bearer
SIAKAD_API_TOKEN=token-service-account
```

API key:

```env
SIAKAD_AUTH_TYPE=api-key
SIAKAD_API_KEY_HEADER=X-API-Key
SIAKAD_API_TOKEN=token-service-account
```

Jika tim SIAKAD memakai nama header lain, isi `SIAKAD_API_KEY_HEADER` sesuai kebutuhan.

## Env SPMI Untuk Koneksi Nyata

```env
SIAKAD_SYNC_ENABLED=true
SIAKAD_BASE_URL=https://siakad.kampus.ac.id/api
SIAKAD_AUTH_TYPE=bearer
SIAKAD_API_KEY_HEADER=X-API-Key
SIAKAD_API_TOKEN=token-service-account
SIAKAD_HEALTH_PATH=/health
SIAKAD_ORG_UNITS_PATH=/org-units
SIAKAD_TIMEOUT_MS=10000
SIAKAD_SYNC_MODE=manual
```

## Endpoint SPMI Untuk UAT Bersama

Semua endpoint ini butuh login admin SPMI.

```http
GET /integrations/siakad/check
POST /integrations/siakad/org-units/preview
POST /integrations/siakad/org-units/commit
GET /integrations/siakad/org-units/batches?limit=5
GET /org-units
```

Untuk SIAKAD asli, urutannya adalah check, preview, review konflik, lalu commit hanya setelah admin SPMI menyetujui.

## Acceptance Criteria

| Check | Lulus Jika |
|---|---|
| Koneksi | `GET /integrations/siakad/check` status `online`. |
| Format JSON | Response SIAKAD valid JSON dan bisa diekstrak oleh connector. |
| Data aktif | Preview memuat semua fakultas/prodi aktif yang dibutuhkan SPMI. |
| Parent | Semua `parent_code` ditemukan di payload atau master SPMI. |
| Duplikasi | Tidak ada duplicate `code` atau duplicate `siakad_code`. |
| Commit staging | Commit di staging sukses dan audit trail tercatat. |

## UAT Bersama

1. Tim SIAKAD memberikan base URL staging, token, dan daftar endpoint.
2. Tim SPMI mengisi env `SIAKAD_*` di staging.
3. Tim SPMI menjalankan check koneksi.
4. Tim SPMI menjalankan preview tanpa commit.
5. Kedua tim review jumlah unit, parent, dan konflik mapping.
6. Admin SPMI menyetujui commit staging.
7. Tim SPMI menjalankan UAT otomatis:

```bash
docker compose -f docker-compose.prod.yml --env-file .env exec \
  -e UAT_START_MOCK_SIAKAD=false \
  -e UAT_BASE_URL=https://api-spmi-staging.example.com \
  backend npm run uat:siakad:database
```

8. Commit ke data asli hanya dijalankan setelah preview disetujui:

```bash
docker compose -f docker-compose.prod.yml --env-file .env exec \
  -e UAT_START_MOCK_SIAKAD=false \
  -e UAT_ALLOW_COMMIT=true \
  -e UAT_BASE_URL=https://api-spmi-staging.example.com \
  backend npm run uat:siakad:database
```

## Risiko Yang Perlu Disepakati

- Perubahan kode unit di SIAKAD akan dianggap update mapping dan harus direview.
- Data SIAKAD nonaktif tidak masuk sebagai unit aktif.
- SPMI tidak menulis balik ke SIAKAD pada fase ini.
- Jika API SIAKAD down, modul SPMI tetap memakai snapshot terakhir.
- Jadwal sync otomatis belum diwajibkan; mode awal adalah manual preview dan manual commit.
