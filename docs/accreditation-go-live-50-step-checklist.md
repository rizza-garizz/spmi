# Accreditation Go-Live 50-Step Checklist

Checklist ini dipakai setelah [Accreditation UAT Defect Triage 40-Step Playbook](./accreditation-uat-defect-triage-40-step.md) selesai dan keputusan UAT minimal `GO DENGAN CATATAN`. Tujuannya memastikan modul akreditasi siap dipakai pada pilot atau production rollout.

## Prinsip Go-Live

- Tidak ada Critical defect terbuka.
- Major defect yang tersisa wajib punya workaround tertulis dan owner.
- Data pilot harus sudah disetujui LPM/BPM.
- Rollback dan backup harus tersedia sebelum deploy.
- Setelah go-live, perubahan fitur baru masuk backlog, bukan hotfix.

## 50 Step Go-Live Akreditasi

| No | Area | Step | Output | Status |
|---|---|---|---|---|
| 1 | Keputusan | Konfirmasi hasil UAT akhir | Execution report berstatus GO/GO dengan catatan | Pending |
| 2 | Keputusan | Konfirmasi semua Critical defect tertutup | Critical open = 0 | Pending |
| 3 | Keputusan | Review Major defect tersisa | Workaround dan owner tersedia | Pending |
| 4 | Keputusan | Review backlog enhancement | Tidak menghambat go-live | Pending |
| 5 | Keputusan | Dapatkan persetujuan LPM/BPM | Sign-off tertulis | Pending |
| 6 | Data | Tetapkan periode akreditasi pilot | ID periode final tercatat | Pending |
| 7 | Data | Tetapkan unit/prodi pilot | Unit pilot disetujui | Pending |
| 8 | Data | Validasi instrumen dan kriteria | Instrumen final sesuai BAN-PT/LAM | Pending |
| 9 | Data | Validasi data LKPS awal | LKPS baseline siap | Pending |
| 10 | Data | Validasi draft LED awal | Draft LED siap review | Pending |
| 11 | Data | Validasi bukti fisik | Evidence valid dan tertaut | Pending |
| 12 | Data | Validasi self-assessment | Score/gap final untuk pilot | Pending |
| 13 | Data | Validasi action plan | Gap punya rencana tindak lanjut | Pending |
| 14 | Data | Validasi risk register | Risk open punya mitigasi | Pending |
| 15 | Data | Validasi checklist submit | Checklist final siap dipakai | Pending |
| 16 | Access | Review role admin LPM | Hak akses sesuai | Pending |
| 17 | Access | Review role operator/prodi | Hak akses sesuai scope | Pending |
| 18 | Access | Review role auditor/reviewer | Hak review sesuai | Pending |
| 19 | Access | Review role pimpinan | Hak monitoring sesuai | Pending |
| 20 | Access | Uji negative access | Tidak ada kebocoran data | Pending |
| 21 | Environment | Verifikasi domain frontend | URL final aktif | Pending |
| 22 | Environment | Verifikasi domain API | Health endpoint aktif | Pending |
| 23 | Environment | Verifikasi env JWT/session | Secret dan timeout sesuai | Pending |
| 24 | Environment | Verifikasi storage upload | Upload evidence tersedia | Pending |
| 25 | Environment | Verifikasi backup path | Backup tersimpan dan dapat diakses | Pending |
| 26 | Deploy | Ambil backup sebelum deploy | Backup DB/uploads tersedia | Pending |
| 27 | Deploy | Catat commit/tag release | Release ref final tercatat | Pending |
| 28 | Deploy | Jalankan preflight staging/prod | Preflight pass | Pending |
| 29 | Deploy | Deploy release akreditasi | Deploy selesai tanpa error | Pending |
| 30 | Deploy | Jalankan health check | API/frontend sehat | Pending |
| 31 | Verification | Jalankan backend smoke test | Test pass | Pending |
| 32 | Verification | Jalankan frontend build artifact check | Artifact valid | Pending |
| 33 | Verification | Login semua role pilot | Semua role bisa masuk | Pending |
| 34 | Verification | Buka halaman akreditasi | Summary dan tabel tampil | Pending |
| 35 | Verification | Cek periode pilot | Periode tampil benar | Pending |
| 36 | Verification | Cek LKPS/LED/evidence | Data pilot tampil benar | Pending |
| 37 | Verification | Cek scoring/readiness | Nilai dan status sesuai | Pending |
| 38 | Verification | Generate manifest pilot | Export berhasil | Pending |
| 39 | Verification | Download manifest pilot | JSON terbuka dan lengkap | Pending |
| 40 | Verification | Simpan bukti smoke go-live | Screenshot/log/export tersimpan | Pending |
| 41 | Communication | Umumkan jadwal pilot | Tim pilot menerima info | Pending |
| 42 | Communication | Kirim panduan role LPM | LPM menerima link docs | Pending |
| 43 | Communication | Kirim panduan role operator | Operator menerima link docs | Pending |
| 44 | Communication | Kirim panduan role reviewer | Reviewer menerima link docs | Pending |
| 45 | Communication | Tetapkan kanal support | Grup/chat/tiket aktif | Pending |
| 46 | Monitoring | Pantau error 24 jam pertama | Error kritikal = 0 | Pending |
| 47 | Monitoring | Pantau upload/export | Upload/export berjalan | Pending |
| 48 | Monitoring | Catat issue pilot | Issue masuk defect/backlog | Pending |
| 49 | Closure | Review hasil pilot awal | Keputusan lanjut/hold jelas | Pending |
| 50 | Closure | Sign-off go-live akreditasi | LPM/BPM dan pimpinan menyetujui | Pending |

## Evidence Wajib

| Evidence | Lokasi/ID | Owner | Status |
|---|---|---|---|
| Backup sebelum deploy |  |  | Pending |
| Commit/tag release |  |  | Pending |
| Health check API |  |  | Pending |
| Screenshot halaman akreditasi |  |  | Pending |
| Export manifest pilot |  |  | Pending |
| Sign-off LPM/BPM |  |  | Pending |

## Rollback Criteria

Rollback atau hold release dilakukan jika salah satu kondisi berikut terjadi:

- Login role utama gagal.
- API health check gagal setelah deploy.
- Upload evidence tidak berjalan.
- Export manifest gagal dibuat atau gagal diunduh.
- Ada kebocoran akses antar unit/prodi.
- Data pilot rusak atau hilang setelah deploy.

## Sign-Off Go-Live

| Nama | Role | Keputusan | Catatan | Tanggal |
|---|---|---|---|---|
|  | LPM/BPM |  |  |  |
|  | Operator Prodi |  |  |  |
|  | Reviewer/Auditor |  |  |  |
|  | Pimpinan |  |  |  |
