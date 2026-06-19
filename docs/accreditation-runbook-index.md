# Accreditation Runbook Index

Dokumen ini menjadi pintu masuk untuk seluruh runbook akreditasi. Gunakan urutan di bawah agar UAT, triage, go-live, hypercare, dan scale-up berjalan konsisten.

## Urutan Dokumen

| Urutan | Dokumen | Dipakai Saat | Output |
|---:|---|---|---|
| 1 | [Accreditation UAT 50-Step Runbook](./accreditation-uat-50-step-runbook.md) | Menjalankan UAT end-to-end modul akreditasi | Status 50 step UAT |
| 2 | [Accreditation UAT Execution Report](./accreditation-uat-execution-report.md) | Mencatat hasil UAT, evidence, defect, dan go/no-go | Laporan UAT dan defect register |
| 3 | [Accreditation UAT Defect Triage 40-Step Playbook](./accreditation-uat-defect-triage-40-step.md) | Memprioritaskan dan memverifikasi defect UAT | Defect closure dan keputusan release |
| 4 | [Accreditation Go-Live 50-Step Checklist](./accreditation-go-live-50-step-checklist.md) | Menyiapkan pilot/production rollout | Go-live sign-off |
| 5 | [Accreditation Hypercare 50-Step Checklist](./accreditation-hypercare-50-step-checklist.md) | Monitoring dan stabilisasi setelah go-live | Hypercare closure dan handover operasi |
| 6 | [Accreditation Scale-Up 100-Step Roadmap](./accreditation-scale-up-100-step-roadmap.md) | Memperluas adopsi ke batch prodi/unit berikutnya | Scale-up tracker dan KPI |
| 7 | [Accreditation Routine Operations 50-Step Checklist](./accreditation-routine-operations-50-step-checklist.md) | Menjalankan kontrol bulanan setelah scale-up | Laporan operasi rutin |

## Role Pengguna

| Role | Dokumen Utama | Fokus |
|---|---|---|
| LPM/BPM | UAT runbook, execution report, go-live checklist | Keputusan, sign-off, readiness paket |
| Operator Prodi | UAT runbook, scale-up roadmap | LKPS, LED, evidence, self-score |
| Reviewer/Auditor | UAT runbook, defect triage | Review, checklist, verifikasi defect |
| Pimpinan | Execution report, go-live checklist, scale-up roadmap | Go/no-go, KPI, monitoring lintas unit |
| Tim Teknis | Defect triage, go-live checklist, hypercare checklist | Fix, deploy, health check, support |

## Decision Gates

| Gate | Syarat Minimum | Lanjut Ke |
|---|---|---|
| UAT Ready | Data pilot dan akun role tersedia | UAT 50-step |
| UAT Complete | Execution report terisi | Defect triage |
| Release Candidate | Critical defect = 0 | Go-live checklist |
| Go-Live Complete | Health check, smoke, export manifest pass | Hypercare |
| Hypercare Complete | Tidak ada Critical incident terbuka | Scale-up |
| Scale-Up Complete | Batch target selesai dan handover operasi diterima | Operasi rutin |
| Monthly Operations Complete | Manifest, backup, audit akses, dan issue review selesai | Siklus operasi bulan berikutnya |

## Artefak Wajib

| Artefak | Sumber | Disimpan Oleh |
|---|---|---|
| Screenshot UAT | UAT runbook | Koordinator UAT |
| Export manifest | Go-live/hypercare | LPM/BPM |
| Defect register | Execution report | Reviewer dan tim teknis |
| Evidence fix | Defect triage | Owner defect |
| Daily hypercare log | Hypercare checklist | PIC support |
| Batch tracker | Scale-up roadmap | Koordinator scale-up |
| Laporan operasi bulanan | Routine operations checklist | LPM/BPM |

## Aturan Ringkas

- Jangan menambah scope fitur saat UAT, triage, atau go-live.
- Enhancement dicatat sebagai backlog.
- Defect Critical harus selesai sebelum go-live.
- Setiap keputusan go/no-go harus punya evidence.
- Setiap batch scale-up harus punya owner dan exit criteria.
