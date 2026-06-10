# Kontrak Integrasi API SIAKAD

Dokumen ini menjelaskan kebutuhan minimum agar SPMI Command Center bisa langsung dikoneksikan ke API SIAKAD tanpa mengubah arsitektur aplikasi.

## Prinsip Integrasi

SIAKAD menjadi sumber kebenaran untuk data akademik. SPMI menyimpan snapshot tersinkron agar modul mutu tetap berjalan walau API SIAKAD sedang tidak tersedia.

Alur data:

```text
SIAKAD API -> SIAKAD Connector -> Preview/Validasi -> OrgUnit SPMI -> Modul SPMI
```

## Environment Backend

Tambahkan konfigurasi berikut di `backend-node/.env`.

```env
SIAKAD_SYNC_ENABLED=true
SIAKAD_BASE_URL=https://siakad.kampus.ac.id/api
SIAKAD_AUTH_TYPE=bearer
SIAKAD_API_TOKEN=isi-token-service-account
SIAKAD_ORG_UNITS_PATH=/org-units
SIAKAD_TIMEOUT_MS=10000
SIAKAD_SYNC_MODE=manual
```

`SIAKAD_AUTH_TYPE` mendukung:

- `bearer`: header `Authorization: Bearer <token>`
- `api-key`: header `X-API-Key: <token>`

## Endpoint Minimum Dari SIAKAD

### Daftar Unit/Fakultas/Prodi

SPMI membutuhkan endpoint read-only untuk mengambil struktur organisasi akademik.

```http
GET /org-units
Authorization: Bearer <token>
Accept: application/json
```

Response boleh berupa array langsung atau object dengan `data`, `items`, `result`, atau `data.items`.

Contoh response yang direkomendasikan:

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

## Field Yang Dipakai SPMI

| Field | Wajib | Keterangan |
| --- | --- | --- |
| `code` | Ya | Kode internal yang stabil untuk relasi modul SPMI. Jika tidak ada, SPMI memakai `siakad_code`. |
| `siakad_code` | Ya | Kode resmi dari SIAKAD. |
| `name` | Ya | Nama fakultas, prodi, lembaga, atau unit. |
| `type` | Ya | Nilai yang disarankan: `universitas`, `lpm`, `lembaga`, `fakultas`, `prodi`, `unit`. |
| `parent_code` | Tidak | Kode parent untuk membentuk pohon organisasi. |
| `is_active` | Tidak | Jika `false`, data dianggap nonaktif. Default `true`. |

Connector juga menerima alias field umum:

- `kode`, `kode_unit`, `internal_code`
- `kode_siakad`, `kodeSIAKAD`, `siakadCode`
- `nama`, `nama_unit`, `nama_prodi`, `nama_fakultas`
- `jenis`, `level`, `tipe`
- `parentCode`, `kode_parent`, `parent`
- `active`, `aktif`, `status`

## Endpoint SPMI Yang Sudah Siap

Endpoint ini berada di backend SPMI.

```http
GET /integrations/siakad/check
GET /integrations/siakad/org-units/batches
POST /integrations/siakad/org-units/preview
POST /integrations/siakad/org-units/commit
GET /org-units
POST /org-units
PUT /org-units/:id
DELETE /org-units/:id
```

Semua endpoint memerlukan token login SPMI. Endpoint write/sync hanya untuk `super_admin` dan `admin_lpm`.

## Mode Preview

`POST /integrations/siakad/org-units/preview` mengambil data dari connector SIAKAD lalu membandingkan dengan master `OrgUnit`.

Output utama:

- `create`: data baru dari SIAKAD
- `update`: data berubah
- `deactivate`: data SIAKAD hilang/nonaktif
- `skip`: tidak ada perubahan
- `conflict`: data perlu diselesaikan sebelum commit

Preview juga menyimpan batch staging saat `APP_MODE=database` dan database aktif. Batch dapat dibaca melalui:

```http
GET /integrations/siakad/org-units/batches?limit=5
```

## Staging dan Conflict Detection

SPMI menyimpan hasil preview ke:

- `SiakadSyncBatch`: metadata batch, sumber data, status, ringkasan, jumlah konflik.
- `SiakadOrgUnitStaging`: baris staging per unit, action, status, payload incoming, data current, dan catatan konflik.

Jenis konflik awal yang dideteksi:

- `missing_code`: kode unit kosong.
- `missing_name`: nama unit kosong.
- `duplicate_code`: kode unit duplikat dalam payload SIAKAD.
- `duplicate_siakad_code`: kode SIAKAD duplikat.
- `missing_parent`: parent tidak ditemukan.
- `manual_mapping_mismatch`: unit manual sudah punya mapping SIAKAD berbeda.

## Mode Commit

`POST /integrations/siakad/org-units/commit` menerapkan hasil sinkronisasi ke tabel `OrgUnit`.

Commit hanya boleh dijalankan ketika:

- `APP_MODE=database`
- database aktif
- token role admin valid
- hasil preview sudah diperiksa admin
- tidak ada konflik pada batch preview

Setiap commit dicatat ke audit trail.

## Saat API SIAKAD Belum Tersedia

Jika `SIAKAD_SYNC_ENABLED=false`, connector memakai mock dari katalog lokal. Ini sengaja agar UI, preview, dan flow approval bisa diuji sebelum kredensial API asli tersedia.

Status `GET /integrations/siakad/check` akan menampilkan:

```json
{
  "status": "mock",
  "configured": false,
  "message": "SIAKAD_SYNC_ENABLED=false"
}
```

## Checklist Go-Live Integrasi

- API SIAKAD tersedia dari server backend SPMI.
- Token service account sudah dibuat dan disimpan di `.env`.
- IP backend SPMI sudah di-whitelist jika diperlukan.
- Endpoint org unit mengembalikan semua fakultas/prodi aktif.
- Preview sync menghasilkan data tanpa konflik parent.
- Commit sync diuji di staging database.
- Audit trail sync aktif.
- Jadwal sync manual/terjadwal disepakati dengan operator SIAKAD.
