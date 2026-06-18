# Contoh `curl` API SPMI Command Center

## Login

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin.lpm@spmi.local",
    "password": "Admin123!"
  }'
```

## Dashboard Summary

```bash
curl http://localhost:4000/dashboard/summary
```

## List Standar

```bash
curl "http://localhost:4000/standar?page=1&limit=10&search=akademik"
```

## Buat Standar

```bash
curl -X POST http://localhost:4000/standar \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Standar Penelitian",
    "description": "Standar mutu penelitian dosen dan mahasiswa.",
    "category": "Tridharma",
    "status": "aktif"
  }'
```

## Upload Dokumen

```bash
curl -X POST http://localhost:4000/dokumen \
  -H "Authorization: Bearer <TOKEN>" \
  -F "title=Manual Mutu" \
  -F "description=Dokumen kebijakan mutu institusi" \
  -F "standard_id=<STANDARD_ID>" \
  -F "unit_kerja_id=<UNIT_KERJA_ID>" \
  -F "file=@./ManualMutu.pdf"
```

## Buat PPEPP

```bash
curl -X POST http://localhost:4000/ppepp \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "standar_id": "<STANDARD_ID>",
    "unit_kerja_id": "<UNIT_KERJA_ID>",
    "fase": "P2",
    "isi": "Pelaksanaan standar mutu pembelajaran.",
    "status": "berjalan",
    "tahun": 2026
  }'
```

## Buat AMI

```bash
curl -X POST http://localhost:4000/ami \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AMI Prodi 2026",
    "jadwal": "2026-06-20T09:00:00.000Z",
    "auditor_id": "<AUDITOR_ID>",
    "auditee_id": "<UNIT_KERJA_ID>",
    "status": "terjadwal",
    "catatan": "Audit rutin internal."
  }'
```

## Tambah Temuan AMI

```bash
curl -X POST http://localhost:4000/ami/<AMI_ID>/temuan \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Dokumen evaluasi belum lengkap",
    "deskripsi": "Sebagian dokumen evaluasi belum terarsip.",
    "severity": "sedang",
    "kategori": "Arsip",
    "rencana_tindak_lanjut": "Menetapkan PIC arsip dokumen evaluasi.",
    "status_rtl": "berjalan",
    "tenggat": "2026-07-15T00:00:00.000Z"
  }'
```

## Buat RTM

```bash
curl -X POST http://localhost:4000/rtm \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "tanggal": "2026-07-05T08:00:00.000Z",
    "peserta": ["Ketua LPM", "Wakil Rektor", "Dekan"],
    "agenda": "Rapat tinjauan hasil audit",
    "hasil_keputusan": "RTL wajib selesai sebelum awal semester baru.",
    "status": "berjalan"
  }'
```

## Bulk Rencana Perbaikan Akreditasi

```bash
curl -X POST http://localhost:4000/accreditation/action-plans/bulk \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "period_id": "AKR-PER-001",
        "criteria_code": "K1",
        "title": "Tutup gap K1",
        "source": "self_score",
        "owner": "admin-akreditasi@spmi.local",
        "priority": "high",
        "status": "todo",
        "action": "Lengkapi bukti, narasi LED, dan tindak lanjut K1.",
        "expected_output": "Gap K1 terpenuhi sebelum submit."
      }
    ]
  }'
```

Response mengembalikan `created_count` dan `skipped_count`; item dengan rencana terbuka yang sama akan dilewati.

## Update Progress Rencana Perbaikan Akreditasi

```bash
curl -X PATCH http://localhost:4000/accreditation/action-plans/AKR-ACT-001 \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "progress": 75,
    "notes": "Bukti utama sudah masuk, tinggal review akhir."
  }'
```

Jika `progress` dikirim `100`, status otomatis menjadi `done`.

## Bulk Checklist Submit Akreditasi

```bash
curl -X POST http://localhost:4000/accreditation/submission-checks/bulk \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "period_id": "AKR-PER-001",
        "category": "LED",
        "title": "Lengkapi LED K1",
        "owner": "admin-akreditasi@spmi.local",
        "verifier": "reviewer@spmi.local",
        "status": "pending",
        "notes": "Narasi LED K1 belum siap submit."
      }
    ]
  }'
```

Response mengembalikan `created_count` dan `skipped_count`; checklist terbuka dengan kategori dan judul yang sama akan dilewati.

## Verifikasi Checklist Submit Akreditasi

```bash
curl -X PATCH http://localhost:4000/accreditation/submission-checks/AKR-CHK-001 \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "verified",
    "notes": "Checklist sudah lengkap dan siap masuk paket submit."
  }'
```

Status `verified`, `approved`, atau `done` akan mengisi `verified_at` dan `verified_by`.

## Generate dan Unduh Paket Akreditasi

```bash
curl -X POST http://localhost:4000/accreditation/exports \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "period_id": "AKR-PER-001",
    "type": "package_manifest"
  }'

curl http://localhost:4000/accreditation/exports/AKR-EXP-001/download \
  -H "Authorization: Bearer <TOKEN>"
```

Manifest berisi `lkps_entries`, `led_contents`, `evidence`, `reviews`, `self_scores`, `action_plans`, `submission_checks`, dan `follow_up_summary`.

## Buat Survei

```bash
curl -X POST http://localhost:4000/survei \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Survei Kepuasan Dosen",
    "description": "Survei proses akademik semester genap.",
    "questions": [
      {
        "id": "q1",
        "label": "Bagaimana kualitas layanan akademik?",
        "type": "radio",
        "options": ["Sangat Baik", "Baik", "Cukup", "Kurang"],
        "required": true
      }
    ],
    "status": "aktif",
    "start_date": "2026-05-12T00:00:00.000Z",
    "end_date": "2026-05-31T23:59:59.000Z"
  }'
```

## Jawab Survei

```bash
curl -X POST http://localhost:4000/survei/<SURVEI_ID>/jawaban \
  -H "Content-Type: application/json" \
  -d '{
    "respondent_name": "Siti",
    "respondent_email": "siti@example.com",
    "answers": {
      "q1": "Baik"
    }
  }'
```

## Sync Integrasi

```bash
curl -X POST http://localhost:4000/integrasi/sync \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "service": "pddikti"
  }'
```
