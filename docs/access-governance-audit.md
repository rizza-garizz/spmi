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
| Data antar prodi/unit tidak dapat diakses sembarangan | Belum aman penuh | Backend belum menerapkan row-level scope filtering secara konsisten pada semua endpoint. |
| Approval workflow sesuai hierarki | Belum aman penuh | Policy chain sudah didefinisikan, tetapi belum menjadi workflow transaksional di data utama. |

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

Policy awal sudah dibuat di `backend-node/src/services/accessPolicy.js`.

## Gap Yang Masih Perlu Dikerjakan

1. Pisahkan role `admin` dan `lpm_bpm` bila kampus ingin Admin IT tidak otomatis punya kewenangan mutu.
2. Tambahkan `scopeOrgUnitId` pada query list dan detail untuk dokumen, PPEPP, indikator, AMI, RTM, RTL, dan HRIS.
3. Tambahkan tabel/field approval status di entitas utama.
4. Semua endpoint update/delete harus memeriksa apakah user berada pada scope yang benar.
5. Tambahkan test negatif: Kaprodi Prodi A tidak boleh melihat/mengubah data Prodi B.

## Kesimpulan

Fondasi akses menu sudah rapi. Fondasi scope user sudah mulai aman. Yang belum cukup untuk produksi multi-prodi adalah row-level access control dan approval workflow transaksional.
