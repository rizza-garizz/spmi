# Accreditation UAT Execution Report

Gunakan dokumen ini saat menjalankan [Accreditation UAT 50-Step Runbook](./accreditation-uat-50-step-runbook.md). Satu file ini menjadi bukti hasil sesi UAT, daftar defect, dan dasar keputusan go/no-go.

Setelah defect terkumpul, gunakan [Accreditation UAT Defect Triage 40-Step Playbook](./accreditation-uat-defect-triage-40-step.md) untuk menentukan prioritas, owner, verifikasi fix, dan keputusan release.

## Identitas Sesi

| Item | Nilai |
|---|---|
| Tanggal UAT |  |
| Environment | Staging / Local / Production Pilot |
| Frontend URL |  |
| API URL |  |
| Commit/Tag |  |
| Periode Akreditasi Uji |  |
| Unit/Prodi Uji |  |
| Koordinator UAT |  |

## Peserta

| Nama | Role | Unit | Fokus Validasi | Hadir |
|---|---|---|---|---|
|  | LPM/BPM |  | Periode, instrumen, export, sign-off |  |
|  | Operator Prodi |  | LKPS, LED, evidence, self-score |  |
|  | Reviewer/Auditor |  | Review, checklist, action plan |  |
|  | Pimpinan |  | Dashboard, readiness, paket final |  |

## Ringkasan Hasil

| Metrik | Jumlah |
|---|---:|
| Total step | 50 |
| Pass | 0 |
| Pass dengan catatan | 0 |
| Fail | 0 |
| Blocked | 0 |
| Defect Critical | 0 |
| Defect Major | 0 |
| Defect Minor | 0 |

## Rekap Per Area

| Area | Step | Pass | Catatan | Fail | Status Area |
|---|---:|---:|---:|---:|---|
| Persiapan | 5 | 0 | 0 | 0 | Pending |
| Periode | 5 | 0 | 0 | 0 | Pending |
| Instrumen | 3 | 0 | 0 | 0 | Pending |
| Tim | 2 | 0 | 0 | 0 | Pending |
| Task | 3 | 0 | 0 | 0 | Pending |
| Milestone | 3 | 0 | 0 | 0 | Pending |
| Risk | 4 | 0 | 0 | 0 | Pending |
| LKPS | 3 | 0 | 0 | 0 | Pending |
| LED | 3 | 0 | 0 | 0 | Pending |
| Evidence | 4 | 0 | 0 | 0 | Pending |
| Self Score | 3 | 0 | 0 | 0 | Pending |
| Action Plan | 3 | 0 | 0 | 0 | Pending |
| Review | 3 | 0 | 0 | 0 | Pending |
| Checklist | 3 | 0 | 0 | 0 | Pending |
| Export | 2 | 0 | 0 | 0 | Pending |
| Sign-off | 1 | 0 | 0 | 0 | Pending |

## Evidence Log

| Step | Bukti | Tipe | Lokasi/ID | Catatan |
|---:|---|---|---|---|
| 1 |  | Screenshot |  |  |
| 6 |  | Record ID |  |  |
| 32 |  | File upload |  |  |
| 48 |  | Export ID |  |  |
| 49 |  | Manifest JSON |  |  |

## Defect Register

| ID | Step | Severity | Judul | Dampak | Owner | Target Fix | Status |
|---|---:|---|---|---|---|---|---|
| ACC-UAT-001 |  | Critical / Major / Minor |  |  |  |  | Open |

## Catatan Keputusan

| Topik | Keputusan | Owner | Deadline |
|---|---|---|---|
| Data pilot |  |  |  |
| Role access |  |  |  |
| Export paket |  |  |  |
| Defect blocking |  |  |  |

## Go/No-Go

| Kriteria | Hasil | Catatan |
|---|---|---|
| Functional pass rate minimal 95% | Pending |  |
| Tidak ada Critical defect terbuka | Pending |  |
| Major defect memiliki workaround | Pending |  |
| Export manifest dapat dipakai | Pending |  |
| Role access tidak bocor | Pending |  |
| Perwakilan role menyetujui | Pending |  |

Keputusan akhir:

```text
GO / GO DENGAN CATATAN / NO-GO
```

## Sign-Off

| Nama | Role | Keputusan | Catatan | Tanggal |
|---|---|---|---|---|
|  | LPM/BPM |  |  |  |
|  | Operator Prodi |  |  |  |
|  | Reviewer/Auditor |  |  |  |
|  | Pimpinan |  |  |  |
