# UAT Go-Live Checklist SPMI

Dokumen ini dipakai untuk menjalankan UAT pilot sebelum sistem dibuka ke seluruh unit Universitas Junrejo Indah.

## Prinsip UAT

- UAT dijalankan menggunakan data pilot yang mewakili 1 fakultas, 2 prodi, 1 unit pendukung, LPM/BPM, auditor, dan pimpinan.
- Setiap skenario harus ditandai `Pass`, `Pass dengan catatan`, atau `Fail`.
- `Fail` pada skenario kritikal harus diselesaikan sebelum go-live.
- Perubahan fitur besar dibekukan selama UAT dan pilot, kecuali bug fix kritikal.

## Runbook Modul Khusus

- Akreditasi end-to-end: [Accreditation UAT 50-Step Runbook](./accreditation-uat-50-step-runbook.md)
- Template hasil UAT akreditasi: [Accreditation UAT Execution Report](./accreditation-uat-execution-report.md)
- Triage defect UAT akreditasi: [Accreditation UAT Defect Triage 40-Step Playbook](./accreditation-uat-defect-triage-40-step.md)

## Akun Role UAT

| Role | Fokus Pengujian | Status |
|---|---|---|
| LPM / BPM | Master standar, AMI, PPEPP, dashboard, reporting | Planned |
| Prodi | Upload dokumen, indikator, PPEPP, tindak lanjut scope prodi | Planned |
| Auditor | Jadwal audit, instrumen, temuan, laporan AMI | Planned |
| Unit Pendukung | Dokumen unit, RTL, tindak lanjut temuan | Planned |
| Pimpinan | Dashboard KPI, RTM, laporan, monitoring lintas unit | Planned |

## Skenario UAT LPM / BPM

| No | Skenario | Ekspektasi | Status |
|---|---|---|---|
| 1 | Login sebagai LPM/BPM | Dashboard terbuka sesuai hak akses | Pending |
| 2 | Membuat standar mutu baru | Nomor standar otomatis, versi awal tercatat | Pending |
| 3 | Edit standar mutu | Riwayat revisi bertambah | Pending |
| 4 | Nonaktifkan standar | Standar tidak tampil di daftar aktif | Pending |
| 5 | Buat siklus PPEPP | Siklus muncul dengan tahapan lengkap | Pending |
| 6 | Update tahapan PPEPP | Status, progress, dan timeline tercatat | Pending |
| 7 | Upload evidence PPEPP | Evidence muncul di tahap yang benar | Pending |
| 8 | Review dashboard KPI | KPI dan grafik terbaca jelas | Pending |
| 9 | Export dashboard | File export dapat dibuka | Pending |

## Skenario UAT Prodi

| No | Skenario | Ekspektasi | Status |
|---|---|---|---|
| 1 | Login sebagai Prodi | Data yang tampil hanya scope prodi terkait | Pending |
| 2 | Upload dokumen prodi | Metadata, file, dan versi tersimpan | Pending |
| 3 | Upload file duplikat | Sistem memberi validasi duplikat atau versi baru sesuai aturan | Pending |
| 4 | Preview dokumen | Preview terbuka jika format didukung | Pending |
| 5 | Download dokumen | Download berhasil dan aman sesuai hak akses | Pending |
| 6 | Input indikator mutu | Indikator tersimpan dan muncul di dashboard | Pending |
| 7 | Input capaian indikator | Status capaian terhitung | Pending |
| 8 | Lihat data prodi lain | Akses ditolak atau data tidak tampil | Pending |

## Skenario UAT Auditor

| No | Skenario | Ekspektasi | Status |
|---|---|---|---|
| 1 | Login sebagai Auditor | Menu AMI aktif sesuai role | Pending |
| 2 | Buat audit unit/prodi | Audit tercatat dengan unit dan tanggal benar | Pending |
| 3 | Update penugasan auditor | Auditor dan jadwal tersimpan | Pending |
| 4 | Isi instrumen audit | Skor dan catatan tersimpan | Pending |
| 5 | Tambah temuan Minor | Temuan muncul pada rekap | Pending |
| 6 | Tambah temuan Mayor | Temuan muncul pada rekap | Pending |
| 7 | Tambah Observasi | Temuan muncul pada rekap | Pending |
| 8 | Verifikasi tindak lanjut | Status verifikasi berubah | Pending |
| 9 | Generate laporan AMI | Laporan HTML/printable terbuka | Pending |

## Skenario UAT Unit Pendukung

| No | Skenario | Ekspektasi | Status |
|---|---|---|---|
| 1 | Login sebagai Unit | Data terbatas pada scope unit | Pending |
| 2 | Upload dokumen unit | Dokumen tersimpan dengan metadata unit | Pending |
| 3 | Lihat daftar RTL | Tugas tindak lanjut unit tampil | Pending |
| 4 | Update status RTL | Status, progress, dan catatan tersimpan | Pending |
| 5 | Upload bukti tindak lanjut | Bukti dapat ditelusuri | Pending |
| 6 | Akses data unit lain | Akses ditolak atau tidak tampil | Pending |

## Skenario UAT Pimpinan

| No | Skenario | Ekspektasi | Status |
|---|---|---|---|
| 1 | Login sebagai Pimpinan | Dashboard pimpinan terbuka | Pending |
| 2 | Filter dashboard fakultas/prodi/tahun | Data berubah sesuai filter | Pending |
| 3 | Baca KPI mutu | Status ketercapaian mudah dipahami | Pending |
| 4 | Lihat rekap AMI | Temuan dan tindak lanjut terbaca | Pending |
| 5 | Lihat RTM | Agenda dan keputusan tampil | Pending |
| 6 | Detail RTL dari RTM | Panel detail tindak lanjut terbuka | Pending |
| 7 | Export laporan | Export dapat dibuka dan dibaca | Pending |

## Kriteria Kelulusan UAT

- Functional pass rate minimal 95%.
- Tidak ada bug Critical.
- Bug Major maksimal 2 dan memiliki workaround tertulis.
- Semua role utama dapat menyelesaikan tugas harian tanpa bantuan developer.
- Dashboard pimpinan dapat dipakai untuk rapat monitoring.
- Dokumen upload/download lolos validasi akses.
- Approval dan row-level access tidak bocor antar prodi/unit.

## Template Sign-Off

| Perwakilan | Nama | Role | Keputusan | Tanggal | Tanda Tangan |
|---|---|---|---|---|---|
| LPM/BPM |  |  |  |  |  |
| Prodi |  |  |  |  |  |
| Auditor |  |  |  |  |  |
| Unit Pendukung |  |  |  |  |  |
| Pimpinan |  |  |  |  |  |
