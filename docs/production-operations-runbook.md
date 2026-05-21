# Production Operations Runbook SPMI

Runbook ini dipakai untuk finalisasi backup database, storage dokumen, monitoring server, dan freeze perubahan besar sampai pilot selesai.

## Go-Live Guardrail

| Area | Keputusan Operasional |
|---|---|
| Change freeze | Berlaku sejak H-3 pilot sampai H+14 pilot selesai |
| Perubahan yang boleh masuk | Bug Critical, security fix, data correction yang disetujui PIC |
| Perubahan yang ditunda | Redesign UI, perubahan workflow besar, perubahan struktur role, perubahan skema database besar |
| Persetujuan emergency change | Product owner kampus, LPM/BPM, tech lead |
| Window deployment | Di luar jam kerja kampus atau window yang disepakati |

## Backup Database

### Target Minimal

- Backup harian otomatis.
- Retensi harian 14 hari.
- Retensi mingguan 8 minggu.
- Retensi bulanan 12 bulan.
- Backup dienkripsi.
- Restore test minimal 1 kali sebelum go-live.

### Checklist

| Item | Status |
|---|---|
| Database production ditetapkan | Pending |
| User backup read-only dibuat | Pending |
| Lokasi backup primer disiapkan | Pending |
| Lokasi backup sekunder/offsite disiapkan | Pending |
| Enkripsi backup aktif | Pending |
| Restore test berhasil | Pending |
| Jadwal backup terdokumentasi | Pending |
| PIC backup ditetapkan | Pending |

### Contoh Jadwal

- Full backup: setiap hari pukul 01.00 WIB.
- Integrity check: setiap hari pukul 02.00 WIB.
- Restore drill: setiap Jumat minggu pertama.

## Storage Dokumen

### Target Minimal

- File dokumen tidak bergantung pada folder lokal aplikasi untuk production.
- Gunakan object storage seperti S3 compatible storage atau MinIO.
- Metadata dokumen tetap berada di database.
- File memiliki validasi ukuran, MIME type, dan akses berbasis token/role.
- Versi dokumen tidak saling menimpa.

### Checklist

| Item | Status |
|---|---|
| Bucket production dibuat | Pending |
| Bucket staging dibuat | Pending |
| Policy private aktif | Pending |
| Upload size limit ditetapkan | Pending |
| MIME allowlist ditetapkan | Pending |
| Lifecycle retention disepakati | Pending |
| Backup object storage aktif | Pending |
| Test preview/download berhasil | Pending |

## Monitoring Server

### Metrik Minimum

- Uptime frontend.
- Uptime backend API.
- Response time p95.
- Error rate 4xx/5xx.
- CPU, RAM, disk usage.
- Database connection health.
- Upload failure rate.
- Login failure rate.
- Integration failure count.

### Alert Minimum

| Kondisi | Severity | Target Respons |
|---|---|---|
| API down > 2 menit | Critical | 15 menit |
| Error 5xx > 5% selama 5 menit | Major | 30 menit |
| Disk usage > 80% | Major | 1 jam |
| Disk usage > 90% | Critical | 15 menit |
| Backup gagal | Major | 1 jam |
| Login failure spike | Major | 30 menit |
| Upload failure spike | Major | 30 menit |
| Integration sync gagal 3x | Minor/Major | 1 hari / 1 jam |

## Pilot Freeze Procedure

### Sebelum Freeze

1. Pastikan semua perubahan sudah di-commit.
2. Tag release candidate.
3. Jalankan backend test.
4. Jalankan frontend production build.
5. Review UAT checklist.
6. Catat known issue dan workaround.
7. Umumkan freeze ke tim developer dan manajemen kampus.

### Selama Freeze

- Semua issue masuk ke pilot issue log.
- Bug diklasifikasikan: Critical, Major, Minor, Improvement.
- Hanya Critical dan Major blocker yang boleh hotfix.
- Hotfix wajib memiliki catatan perubahan, penguji, dan approver.

### Setelah Pilot

1. Review issue log.
2. Prioritaskan backlog stabilisasi.
3. Jadwalkan minor release.
4. Evaluasi readiness integrasi production.
5. Putuskan rollout ke fakultas/prodi berikutnya.

## Pilot Issue Log

| ID | Tanggal | Role | Modul | Severity | Deskripsi | Dampak | Workaround | PIC | Status |
|---|---|---|---|---|---|---|---|---|---|
| PILOT-001 |  |  |  |  |  |  |  |  | Open |

## Release Sign-Off

| Area | PIC | Status | Catatan |
|---|---|---|---|
| Functional UAT | LPM/BPM | Pending |  |
| Security | Tech Lead | Pending |  |
| Database Backup | DBA/DevOps | Pending |  |
| Document Storage | DevOps | Pending |  |
| Monitoring | DevOps | Pending |  |
| User Training | Manajemen Kampus | Pending |  |
| Pilot Freeze | Product Owner | Pending |  |

