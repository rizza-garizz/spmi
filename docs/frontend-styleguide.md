# Frontend Styleguide

SPMI Command Center memakai bahasa visual dashboard operasional untuk perguruan tinggi. UI harus terasa rapi, formal, padat informasi, dan cepat dipindai oleh LPM, auditor, prodi, pimpinan, unit kerja, dan operator.

## Prinsip

- Tampilkan fungsi utama sebagai layar pertama, bukan landing page.
- Prioritaskan scanning data: tabel, badge status, progress, filter, dan aksi jelas.
- Pakai pola Bootstrap/Envato yang sudah ada agar modul terasa konsisten.
- Hindari dekorasi visual yang tidak membantu pekerjaan pengguna.
- Pakai Bahasa Indonesia formal-operasional.

## Foundation

- Font utama: `Inter`.
- Layout utama: Bootstrap grid `row`, `col-*`, spacing utility, dan template Envato.
- Komponen dasar: `card`, `card-header`, `card-body`, `table`, `form-control`, `btn`, `badge`, `alert`, `progress`.
- Ikon: Line Awesome class `la la-*`.

## Warna

Token global ada di `frontend/app/globals.css`.

- Background aplikasi: `--bg`.
- Panel/card: `--panel`.
- Border: `--line`.
- Teks utama: `--text`.
- Teks sekunder: `--muted`.
- Primary/action: `--accent`.
- Warning: `--accent-2`.
- Success: `--success`.
- Danger/risk: `--danger`.

## Status

Gunakan helper `statusBadgeClassName()` dari `frontend/lib/status-style.ts` atau komponen `StatusBadge`.

- Success: `ready`, `valid`, `selesai`, `final`, `aktif`, `approved`, `generated`, `done`, `closed`, `resolved`, `low`, `verified`.
- Warning: `warning`, `berjalan`, `review`, `perlu_revisi`, `revision_required`, `in_review`, `needs_attention`, `todo`, `in_progress`, `blocked`, `mitigating`, `medium`, `pending`, `draft`, `planned`.
- Danger: status lain, termasuk kondisi risk/error/overdue/high.

## Page Pattern

Setiap halaman modul sebaiknya memakai urutan:

1. Page title dengan breadcrumb.
2. Alert error/success bila ada.
3. Metric/readiness cards.
4. Area kerja utama: tabel, form, review, atau kanban/list sesuai kebutuhan.
5. Export/download atau action final di bagian workflow yang relevan.

## Card

Pakai `SectionCard` untuk satu konteks kerja yang jelas.

```tsx
<SectionCard title="Judul Section">
  ...
</SectionCard>
```

Jangan menumpuk card di dalam card kecuali untuk item berulang yang memang perlu frame kecil.

## Metric Card

Gunakan `MetricCard` untuk angka ringkasan di bagian atas dashboard atau modul.

```tsx
<MetricCard
  label="Readiness"
  value="82%"
  description="Rata-rata kesiapan akreditasi aktif."
  status="ready"
/>
```

Jika metric tidak punya status, tampilkan label sebagai teks muted biasa.

## Table

Pakai tabel untuk data operasional yang perlu dibandingkan.

```tsx
<div className="table-responsive">
  <table className="table table-bordered table-responsive-sm">...</table>
</div>
```

Kolom status harus memakai badge. Kolom progress harus memakai progress bar atau angka persentase yang jelas.

## Form

Form harus pendek per konteks. Bila field banyak, kelompokkan dengan `form-row` dan `form-group`.

```tsx
<div className="form-group">
  <label>Nama Field</label>
  <input className="form-control" />
</div>
```

Aksi utama memakai `btn btn-primary`; aksi sekunder memakai `btn btn-outline-primary`; batal/reset memakai `btn btn-light`.

## Empty, Loading, Error

- Empty state: jelaskan data apa yang belum tersedia.
- Loading state: tampilkan teks pendek atau skeleton sederhana.
- Error state: pakai `alert alert-outline-danger`.
- Success state: pakai `alert alert-outline-success`.

## Copywriting

Gunakan kalimat langsung dan operasional.

- Baik: `Periode akreditasi berhasil dibuat.`
- Baik: `Data assessment belum tersedia.`
- Hindari: `Wujudkan masa depan mutu kampus Anda.`

## Refactor Guidance

Jika halaman mulai besar, ekstrak bagian yang berulang:

- `StatusBadge`
- `MetricCard`
- `SectionCard`
- `DataTable`
- `EmptyState`
- `ProgressCell`
- `FormActions`

Prioritasnya adalah menjaga konsistensi dan mengurangi logic visual yang tersebar di page component.
