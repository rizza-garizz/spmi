# Accreditation UAT Defect Triage 40-Step Playbook

Dokumen ini dipakai setelah sesi [Accreditation UAT Execution Report](./accreditation-uat-execution-report.md) terisi. Tujuannya memastikan defect UAT akreditasi diprioritaskan, diperbaiki, diverifikasi, dan diputuskan dengan rapi tanpa memperluas scope fitur.

Jika triage selesai dan keputusan minimal `GO DENGAN CATATAN`, lanjutkan ke [Accreditation Go-Live 50-Step Checklist](./accreditation-go-live-50-step-checklist.md).

## Prinsip Triage

- Triage hanya membahas defect, data setup, dan klarifikasi acceptance criteria.
- Enhancement baru dicatat sebagai backlog, bukan blocking UAT.
- Critical defect harus punya owner dan target fix sebelum sesi triage ditutup.
- Setiap fix wajib diverifikasi ulang pada step UAT terkait.

## Severity

| Severity | Definisi | Contoh |
|---|---|---|
| Critical | Menghambat go-live atau menyebabkan kebocoran akses/data | Role prodi bisa melihat data prodi lain; export manifest gagal total |
| Major | Fitur utama terganggu tetapi ada workaround terbatas | Bulk checklist gagal sebagian tanpa pesan jelas |
| Minor | Tidak menghambat flow utama | Label kurang jelas, format tanggal kurang konsisten |
| Backlog | Permintaan improvement di luar acceptance UAT | Tambah filter baru, tambah chart baru |

## 40 Step Triage

| No | Fase | Step | Output | Status |
|---|---|---|---|---|
| 1 | Intake | Kumpulkan semua defect dari execution report | Daftar defect lengkap | Pending |
| 2 | Intake | Cocokkan defect dengan nomor step UAT | Defect punya referensi step | Pending |
| 3 | Intake | Pastikan bukti defect tersedia | Screenshot, payload, response, atau record ID | Pending |
| 4 | Intake | Pisahkan defect dari enhancement | Backlog enhancement terpisah | Pending |
| 5 | Intake | Gabungkan duplikasi defect | Satu defect canonical | Pending |
| 6 | Severity | Klasifikasi Critical | Critical list jelas | Pending |
| 7 | Severity | Klasifikasi Major | Major list jelas | Pending |
| 8 | Severity | Klasifikasi Minor | Minor list jelas | Pending |
| 9 | Severity | Tandai Backlog | Backlog tidak menghambat UAT | Pending |
| 10 | Severity | Validasi severity dengan LPM/reviewer | Severity disetujui | Pending |
| 11 | Ownership | Assign owner teknis | Setiap defect punya owner | Pending |
| 12 | Ownership | Assign owner data/process | Defect data/proses punya PIC | Pending |
| 13 | Ownership | Tetapkan target fix | Target tanggal per defect | Pending |
| 14 | Ownership | Tetapkan reviewer verifikasi | Verifier per defect | Pending |
| 15 | Ownership | Catat dependency eksternal | SIAKAD/repository/role dependency tercatat | Pending |
| 16 | Analysis | Reproduce Critical defect | Langkah reproduce jelas | Pending |
| 17 | Analysis | Reproduce Major defect | Langkah reproduce jelas | Pending |
| 18 | Analysis | Cek log API/backend | Error log tercatat | Pending |
| 19 | Analysis | Cek payload dan response | Request/response tercatat | Pending |
| 20 | Analysis | Cek data seed/staging | Data issue dibedakan dari bug kode | Pending |
| 21 | Fix Plan | Tentukan fix scope | Scope fix sempit dan jelas | Pending |
| 22 | Fix Plan | Tentukan test yang perlu ditambah | Test plan per fix | Pending |
| 23 | Fix Plan | Tentukan risiko regresi | Area regresi diketahui | Pending |
| 24 | Fix Plan | Tentukan rollback plan | Rollback/mitigasi tersedia | Pending |
| 25 | Fix Plan | Setujui fix window | Jadwal fix disepakati | Pending |
| 26 | Verification | Deploy fix ke staging | Commit/tag fix tersedia | Pending |
| 27 | Verification | Jalankan smoke backend | Test backend pass | Pending |
| 28 | Verification | Jalankan build frontend | Build frontend pass | Pending |
| 29 | Verification | Ulang step UAT terkait | Step berubah Pass/Catatan | Pending |
| 30 | Verification | Ulang regression area sekitar | Tidak ada regresi utama | Pending |
| 31 | Evidence | Update execution report | Defect status terbaru tercatat | Pending |
| 32 | Evidence | Lampirkan bukti fix | Screenshot/log/export baru | Pending |
| 33 | Evidence | Catat workaround jika ada | Workaround valid dan disetujui | Pending |
| 34 | Evidence | Update decision notes | Keputusan per defect tercatat | Pending |
| 35 | Release | Hitung ulang pass rate | Pass rate final tersedia | Pending |
| 36 | Release | Review Critical open | Critical harus 0 untuk GO | Pending |
| 37 | Release | Review Major open | Major punya workaround/target | Pending |
| 38 | Release | Review Backlog | Backlog masuk daftar pasca UAT | Pending |
| 39 | Release | Putuskan GO/NO-GO | Keputusan final tercatat | Pending |
| 40 | Release | Sign-off hasil triage | LPM/reviewer/pimpinan sign-off | Pending |

## Defect Triage Board

| ID | Step UAT | Severity | Status | Owner | Verifier | Target | Evidence |
|---|---:|---|---|---|---|---|---|
| ACC-UAT-001 |  |  | Open |  |  |  |  |

## Backlog Enhancement

| ID | Usulan | Dampak | Prioritas | Catatan |
|---|---|---|---|---|
| ACC-BLG-001 |  |  | Low / Medium / High |  |

## Closure Checklist

- Semua Critical tertutup.
- Semua Major tertutup atau punya workaround tertulis.
- Execution report sudah diperbarui.
- Evidence fix tersimpan.
- Regression smoke selesai.
- Keputusan GO/NO-GO ditandatangani.
