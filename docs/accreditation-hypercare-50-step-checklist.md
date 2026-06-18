# Accreditation Hypercare 50-Step Checklist

Checklist ini dipakai setelah [Accreditation Go-Live 50-Step Checklist](./accreditation-go-live-50-step-checklist.md) selesai dan modul akreditasi mulai dipakai pada pilot/production. Fokusnya monitoring, support, stabilisasi, dan handover ke operasi harian.

## Prinsip Hypercare

- Hypercare berjalan minimal 5 hari kerja setelah go-live pilot.
- Issue produksi dicatat sebagai incident, defect, atau backlog.
- Perubahan kode selama hypercare hanya untuk bug fix dan stabilisasi.
- Setiap hari hypercare ditutup dengan ringkasan status.

## 50 Step Hypercare Akreditasi

| No | Area | Step | Output | Status |
|---|---|---|---|---|
| 1 | Kickoff | Konfirmasi tanggal mulai hypercare | Jadwal hypercare disepakati | Pending |
| 2 | Kickoff | Tetapkan PIC harian LPM | PIC tercatat | Pending |
| 3 | Kickoff | Tetapkan PIC teknis | PIC backend/frontend/devops tercatat | Pending |
| 4 | Kickoff | Tetapkan kanal support | Grup/tiket/email aktif | Pending |
| 5 | Kickoff | Bagikan escalation path | Kontak eskalasi tersedia | Pending |
| 6 | Monitoring | Cek API health pagi hari | Health status ok | Pending |
| 7 | Monitoring | Cek frontend availability | Halaman akreditasi terbuka | Pending |
| 8 | Monitoring | Cek login role LPM | Login sukses | Pending |
| 9 | Monitoring | Cek login operator/prodi | Login sukses | Pending |
| 10 | Monitoring | Cek login reviewer/auditor | Login sukses | Pending |
| 11 | Monitoring | Cek error backend | Tidak ada Critical error | Pending |
| 12 | Monitoring | Cek error frontend | Tidak ada blocking error | Pending |
| 13 | Monitoring | Cek storage upload | Upload path tersedia | Pending |
| 14 | Monitoring | Cek export manifest | Export/download berjalan | Pending |
| 15 | Monitoring | Cek backup terjadwal | Backup terbaru tersedia | Pending |
| 16 | Usage | Pantau pembuatan periode | Periode pilot tidak duplikat | Pending |
| 17 | Usage | Pantau input LKPS | Entry valid dan lengkap | Pending |
| 18 | Usage | Pantau input LED | Draft tersimpan | Pending |
| 19 | Usage | Pantau upload evidence | File/link tersimpan | Pending |
| 20 | Usage | Pantau self-score | Score/gap konsisten | Pending |
| 21 | Usage | Pantau action plan | Gap punya tindak lanjut | Pending |
| 22 | Usage | Pantau risk register | Risk punya mitigasi | Pending |
| 23 | Usage | Pantau review internal | Review tertaut ke entity | Pending |
| 24 | Usage | Pantau checklist submit | Checklist sesuai issue | Pending |
| 25 | Usage | Pantau export package | Summary sesuai data | Pending |
| 26 | Support | Catat issue masuk | Semua issue punya ID | Pending |
| 27 | Support | Klasifikasi issue | Incident/defect/backlog jelas | Pending |
| 28 | Support | Tetapkan severity issue | Critical/Major/Minor/Backlog | Pending |
| 29 | Support | Assign owner issue | Owner tercatat | Pending |
| 30 | Support | Tetapkan target response | SLA response jelas | Pending |
| 31 | Support | Beri workaround jika ada | User dapat lanjut bekerja | Pending |
| 32 | Support | Update status issue harian | Status terkini tercatat | Pending |
| 33 | Support | Tutup issue yang selesai | Evidence closure tersedia | Pending |
| 34 | Regression | Ulang smoke setelah fix | Smoke pass | Pending |
| 35 | Regression | Cek area terdampak fix | Tidak ada regresi | Pending |
| 36 | Data Quality | Review data pilot harian | Data anomali tercatat | Pending |
| 37 | Data Quality | Cek duplikasi data | Duplikasi dicegah/ditangani | Pending |
| 38 | Data Quality | Cek relasi evidence | LKPS/LED/evidence tertaut | Pending |
| 39 | Data Quality | Cek readiness package | Risk/warning masuk laporan | Pending |
| 40 | Data Quality | Cek manifest terbaru | Manifest lengkap dan konsisten | Pending |
| 41 | Communication | Kirim ringkasan harian | Stakeholder menerima update | Pending |
| 42 | Communication | Catat keputusan harian | Decision log terisi | Pending |
| 43 | Communication | Eskalasi blocker | Blocker punya owner senior | Pending |
| 44 | Communication | Konfirmasi user pain point | Masukan user tercatat | Pending |
| 45 | Communication | Pisahkan enhancement | Enhancement masuk backlog | Pending |
| 46 | Closure | Review issue open akhir hypercare | Open issue punya rencana | Pending |
| 47 | Closure | Review KPI hypercare | Error, issue, SLA tercatat | Pending |
| 48 | Closure | Handover ke operasi | Runbook dan owner operasi siap | Pending |
| 49 | Closure | Dapatkan sign-off LPM | LPM menyetujui stabilisasi | Pending |
| 50 | Closure | Tutup periode hypercare | Laporan akhir tersimpan | Pending |

## Daily Hypercare Log

| Tanggal | Health | Issue Baru | Issue Closed | Critical Open | Catatan |
|---|---|---:|---:|---:|---|
|  | Pending | 0 | 0 | 0 |  |

## Issue Log

| ID | Tanggal | Tipe | Severity | Ringkasan | Owner | Status | Evidence |
|---|---|---|---|---|---|---|---|
| ACC-HYP-001 |  | Incident / Defect / Backlog |  |  |  | Open |  |

## Handover Operasi

| Item | Owner Operasi | Status | Catatan |
|---|---|---|---|
| Monitoring API/frontend |  | Pending |  |
| Backup dan restore |  | Pending |  |
| Support role/user |  | Pending |  |
| Export manifest |  | Pending |  |
| Defect/backlog tracker |  | Pending |  |

## Exit Criteria

- Tidak ada Critical incident terbuka.
- Major incident memiliki workaround dan target fix.
- Upload evidence dan export manifest berjalan stabil.
- User pilot dapat menyelesaikan workflow utama tanpa bantuan developer.
- Handover operasi disetujui LPM/BPM dan PIC teknis.
