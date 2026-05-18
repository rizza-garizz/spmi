# Payload Contoh

## Standar

```json
{
  "title": "Standar Pengabdian kepada Masyarakat",
  "description": "Standar mutu kegiatan pengabdian.",
  "category": "Tridharma",
  "status": "aktif"
}
```

## PPEPP

```json
{
  "standar_id": "std-pembelajaran",
  "unit_kerja_id": "unit-ti",
  "fase": "P3",
  "isi": "Pengendalian atas ketidaksesuaian pelaksanaan standar.",
  "status": "berjalan",
  "tahun": 2026
}
```

## Temuan AMI

```json
{
  "title": "Instrumen evaluasi belum seragam",
  "deskripsi": "Format evaluasi proses pembelajaran berbeda antar mata kuliah.",
  "severity": "sedang",
  "kategori": "Evaluasi",
  "rencana_tindak_lanjut": "Menyusun template evaluasi tunggal di tingkat prodi.",
  "status_rtl": "berjalan",
  "tenggat": "2026-07-20T00:00:00.000Z"
}
```

## RTM

```json
{
  "tanggal": "2026-07-10T09:00:00.000Z",
  "peserta": ["Ketua LPM", "Dekan FT", "Kaprodi TI"],
  "agenda": "Review hasil AMI dan evaluasi PPEPP",
  "hasil_keputusan": "Monitoring RTL dilakukan mingguan sampai seluruh temuan tertutup.",
  "status": "selesai"
}
```

## Survei

```json
{
  "title": "Survei Kepuasan Layanan Perpustakaan",
  "description": "Survei untuk mahasiswa aktif.",
  "questions": [
    {
      "id": "q1",
      "label": "Apakah koleksi buku memadai?",
      "type": "radio",
      "options": ["Ya", "Tidak"],
      "required": true
    },
    {
      "id": "q2",
      "label": "Saran perbaikan",
      "type": "textarea",
      "required": false
    }
  ],
  "status": "aktif",
  "start_date": "2026-05-15T00:00:00.000Z",
  "end_date": "2026-05-30T23:59:59.000Z"
}
```
