# Accreditation UAT 50-Step Runbook

Dokumen ini dipakai untuk menjalankan UAT modul akreditasi end-to-end tanpa menambah scope fitur saat sesi validasi.

## Aturan Eksekusi

- Jalankan berurutan dari persiapan data sampai sign-off.
- Isi `Status` dengan `Pass`, `Pass dengan catatan`, atau `Fail`.
- Isi `Bukti` dengan URL screenshot, nama file export, ID record, atau catatan verifikasi.
- `Fail` pada step kritikal harus dibereskan sebelum pilot atau go-live.

## 50 Step UAT Akreditasi

| No | Area | Step | Ekspektasi | Status | Bukti |
|---|---|---|---|---|---|
| 1 | Persiapan | Login sebagai admin LPM | Dashboard terbuka dan session aktif | Pending |  |
| 2 | Persiapan | Login sebagai operator/prodi | Menu akreditasi terbuka sesuai role | Pending |  |
| 3 | Persiapan | Login sebagai auditor/reviewer | Akses baca/review tersedia | Pending |  |
| 4 | Persiapan | Cek summary akreditasi | Metrics periode, instrumen, kriteria tampil | Pending |  |
| 5 | Persiapan | Cek data seed instrumen | Instrumen BAN-PT/LAM tersedia | Pending |  |
| 6 | Periode | Buat periode akreditasi baru | Periode tersimpan status draft | Pending |  |
| 7 | Periode | Cek daftar periode | Periode baru muncul di daftar | Pending |  |
| 8 | Periode | Update status periode ke berjalan | Progress dan status berubah | Pending |  |
| 9 | Periode | Update status periode ke review | Assessment masuk fase review | Pending |  |
| 10 | Periode | Update status periode ke final | Catatan final tersimpan | Pending |  |
| 11 | Instrumen | Cek daftar kriteria | Kriteria mengikuti instrumen periode | Pending |  |
| 12 | Instrumen | Tambah kriteria uji | Kriteria tersimpan dengan kode unik | Pending |  |
| 13 | Instrumen | Coba tambah kriteria duplikat | API menolak duplikasi | Pending |  |
| 14 | Tim | Tambah anggota tim akreditasi | Nama, role, email, tanggung jawab tersimpan | Pending |  |
| 15 | Tim | Coba tambah email tim duplikat | API menolak duplikasi periode/email | Pending |  |
| 16 | Task | Buat task akreditasi | Task tersimpan dengan assignee dan deadline | Pending |  |
| 17 | Task | Cek task overdue | Task lewat deadline ditandai overdue | Pending |  |
| 18 | Task | Cek progress task | Progress tampil dalam range 0-100 | Pending |  |
| 19 | Milestone | Buat milestone persiapan | Milestone tersimpan dengan fase dan owner | Pending |  |
| 20 | Milestone | Buat milestone LKPS/LED | Timeline menampilkan fase yang benar | Pending |  |
| 21 | Milestone | Cek milestone overdue | Status readiness menjadi risk jika overdue | Pending |  |
| 22 | Risk | Buat risiko high | Score probability x impact benar | Pending |  |
| 23 | Risk | Update risiko menjadi mitigating | Score dan status diperbarui | Pending |  |
| 24 | Risk | Tutup risiko | `closed_at` dan `closed_by` terisi | Pending |  |
| 25 | Risk | Cek risk summary export | Open/high risk count sesuai data | Pending |  |
| 26 | LKPS | Buat entry LKPS | Section, label, value, unit tersimpan | Pending |  |
| 27 | LKPS | Coba entry LKPS duplikat | API menolak periode/section/label duplikat | Pending |  |
| 28 | LKPS | Cek relasi LKPS di evidence | Evidence bisa tertaut ke entry LKPS | Pending |  |
| 29 | LED | Buat draft LED | Version dimulai dari 1 | Pending |  |
| 30 | LED | Buat draft LED versi berikutnya | Version bertambah pada section/periode sama | Pending |  |
| 31 | LED | Cek status LED draft/reviewed | Coverage LED mengikuti status konten | Pending |  |
| 32 | Evidence | Upload bukti dengan file valid | File name/url tersimpan | Pending |  |
| 33 | Evidence | Input bukti dengan link repository | Link dapat diklik dari UI | Pending |  |
| 34 | Evidence | Coba bukti duplikat | API menolak periode/kriteria/judul duplikat | Pending |  |
| 35 | Evidence | Cek coverage bukti per kriteria | Valid/required/open sesuai data | Pending |  |
| 36 | Self Score | Input self-assessment | Score, target, gap, reviewer tersimpan | Pending |  |
| 37 | Self Score | Coba self-score duplikat | API menolak periode/kriteria duplikat | Pending |  |
| 38 | Self Score | Cek weighted score | Projection dan predicate tampil | Pending |  |
| 39 | Action Plan | Buat action plan dari gap | Criteria, source, owner, progress tersimpan | Pending |  |
| 40 | Action Plan | Bulk create action plan | `created_count` dan `skipped_count` benar | Pending |  |
| 41 | Action Plan | Update progress action plan via API | Progress 100 otomatis menjadi done | Pending |  |
| 42 | Review | Buat review LED | Entity dan reviewer tertaut | Pending |  |
| 43 | Review | Buat review evidence | Entity evidence tertaut | Pending |  |
| 44 | Review | Cek coverage review | Missing/open/approved sesuai data | Pending |  |
| 45 | Checklist | Buat checklist submit manual | Owner, verifier, status tersimpan | Pending |  |
| 46 | Checklist | Bulk create checklist dari issue | Duplikasi terbuka dilewati | Pending |  |
| 47 | Checklist | Verifikasi checklist via API | `verified_at` dan `verified_by` terisi | Pending |  |
| 48 | Export | Generate manifest paket | Export tersimpan dengan package summary | Pending |  |
| 49 | Export | Download manifest | JSON berisi periode, LKPS, LED, evidence, review, scores, plans, risks, checks | Pending |  |
| 50 | Sign-off | Review hasil UAT akreditasi | Semua fail kritikal punya owner dan target penyelesaian | Pending |  |

## Kriteria Lulus

- Step 1-10, 26-49 wajib `Pass` atau `Pass dengan catatan`.
- Tidak ada kebocoran akses antar role/unit.
- Export manifest dapat dipakai sebagai bukti paket UAT.
- Semua `Fail` memiliki owner, target tanggal, dan dampak yang jelas.

## Sign-Off Akreditasi

| Peran | Nama | Keputusan | Catatan | Tanggal |
|---|---|---|---|---|
| LPM/BPM |  |  |  |  |
| Operator Prodi |  |  |  |  |
| Reviewer/Auditor |  |  |  |  |
| Pimpinan |  |  |  |  |
