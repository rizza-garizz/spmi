# Audit Akses dan Tata Kelola SPMI

Tanggal audit: 2026-05-20

## Ringkasan

Sistem sudah memiliki role-based menu dan route guard dasar. Struktur role yang sudah berjalan adalah:

- Admin / LPM: `admin_lpm`
- Fakultas: `dekan`, `wakil_dekan`
- Prodi: `kaprodi`, `sekprodi`
- Unit pendukung: `unit_kerja`
- Auditor: `auditor`
- Pimpinan: saat ini direpresentasikan oleh `dekan` dan `wakil_dekan`

Catatan penting: role `Admin` terpisah dari `LPM / BPM` belum dipisah secara teknis. Saat ini keduanya masih digabung sebagai `admin_lpm`.

## Status Pemeriksaan

| Area | Status | Catatan |
| --- | --- | --- |
| Role pengguna sesuai struktur perguruan tinggi | Sebagian aman | Role inti sudah ada, tetapi Admin sistem dan LPM/BPM masih satu role. |
| Hak akses menu sesuai kewenangan | Aman untuk tahap sekarang | Sidebar dan route frontend membaca `moduleRegistry`; backend juga punya `requireRole`. |
| Scope fakultas/prodi/unit pada user | Diperkuat | Seed user lokal sekarang membawa `orgUnit` dan `roleAssignments.scopeOrgUnit`. |
| Data antar prodi/unit tidak dapat diakses sembarangan | Aman untuk compat API | Endpoint lokal/compat untuk dokumen, PPEPP, indikator, AMI, dan RTL sudah memakai `org_unit_code` scope filtering. |
| Approval workflow sesuai hierarki | Aman untuk compat API | Endpoint approval generic sudah menjalankan alur Unit/Sekprodi -> Kaprodi -> Fakultas -> LPM. |

## Matriks Kewenangan Target

| Role Kampus | Role Teknis | Cakupan Ideal |
| --- | --- | --- |
| Admin Sistem | belum dipisah | Konfigurasi sistem, user, integrasi, audit teknis. |
| LPM / BPM | `admin_lpm` | Standar mutu, AMI, validasi akhir, laporan institusi. |
| Fakultas | `dekan`, `wakil_dekan` | Data fakultas dan seluruh prodi di bawah fakultas. |
| Prodi | `kaprodi`, `sekprodi` | Data program studi masing-masing. |
| Unit pendukung | `unit_kerja` | Data unit kerja masing-masing. |
| Auditor | `auditor` | AMI, temuan, rekomendasi, dan dokumen audit yang ditugaskan. |
| Pimpinan | `dekan`, `wakil_dekan` untuk tahap ini | Monitoring, review, dan approval sesuai level pimpinan. |

## Approval Target

Alur ideal:

1. `draft`: Unit kerja / Sekprodi membuat data.
2. `review_prodi`: Kaprodi memeriksa data prodi.
3. `review_fakultas`: Dekan/Wakil Dekan memeriksa data lintas prodi fakultas.
4. `review_lpm`: LPM/BPM melakukan validasi mutu akhir.
5. `approved`: Data terkunci sebagai data resmi.

Policy sudah dibuat di `backend-node/src/services/accessPolicy.js` dan endpoint awal tersedia di:

`PATCH /governance/:entity/:id/approval`

Entitas yang didukung pada tahap ini:

- `documents`
- `ppepp`
- `indicators`
- `ami`
- `rtl`

## Gap Yang Masih Perlu Dikerjakan

1. Pisahkan role `admin` dan `lpm_bpm` bila kampus ingin Admin IT tidak otomatis punya kewenangan mutu.
2. Bawa row-level access control ini ke controller database/Prisma penuh, bukan hanya endpoint compat/local.
3. Tambahkan field approval permanen di schema database untuk dokumen, PPEPP, indikator, AMI, dan RTL.
4. Tambahkan isolasi scope untuk HRIS bila data SDM nantinya dibuka ke fakultas/prodi.
5. Tambahkan test multi-prodi tambahan: Kaprodi Prodi A tidak boleh melihat/mengubah data Prodi B ketika data Prodi B sudah ada.

## Kesimpulan

Fondasi akses menu sudah rapi. Endpoint compat/local sudah menerapkan row-level access control dan approval workflow hierarkis. Yang belum cukup untuk produksi penuh adalah migrasi enforcement yang sama ke controller database/Prisma dan schema approval permanen.
