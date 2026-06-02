# Simulasi Proses SPMI Dengan Data Dummy

Dokumen ini dipakai untuk simulasi end-to-end proses SPMI tanpa mengubah struktur database, routing, API, hak akses, atau workflow yang sudah ada.

## Tujuan Simulasi

- Memastikan alur PPEPP berjalan dari penetapan sampai peningkatan.
- Memastikan setiap role memakai menu sesuai hak akses.
- Memastikan HRIS menjadi sumber data SDM, jabatan, kompetensi, dan dokumen pendukung mutu.
- Memastikan dashboard, audit trail, notifikasi, laporan, AMI, RTL, dan RTM terisi dari aktivitas proses.
- Menyediakan data dummy yang konsisten untuk demo, UAT, dan validasi bisnis.

## Akun Dummy

Password semua akun: `Password123!`

| Role | Email | Nama Dummy | Fokus Simulasi |
|---|---|---|---|
| Super Admin | `admin@spmi.local` | Admin LPM | Setup sistem, semua menu, audit trail |
| LPM | `lpm@spmi.local` | LPM Mutu | Standar, PPEPP, AMI, dashboard |
| Auditor | `auditor@spmi.local` | Auditor Internal | AMI, temuan, verifikasi RTL |
| Dekan | `dekan@spmi.local` | Dekan Fakultas | RTM, monitoring lintas unit |
| Kaprodi | `kaprodi@spmi.local` | Ketua Program Studi | Indikator, capaian, RTL prodi |
| Unit Kerja | `unit@spmi.local` | Operator Unit Kerja | Dokumen unit, evidence, tindak lanjut |
| Operator | `operator@spmi.local` | Operator SPMI | Input operasional, dokumen, capaian |

## Data Dummy Utama

| Entitas | ID/Kode | Nama | Keterangan |
|---|---|---|---|
| Institusi | `DEFAULT` | Universitas Junrejo Indah | Institusi simulasi |
| Unit | `LPM` | Lembaga Penjaminan Mutu | Pengelola mutu |
| Fakultas | `FE` | Fakultas Ekonomi | Unit pimpinan |
| Prodi | `TI` | Program Studi Teknik Informatika | Unit audit dan PPEPP |
| Pegawai HRIS | `EMP-001` | Dr. Budi Santoso | Dosen tetap Prodi TI |
| Pegawai HRIS | `EMP-002` | Siti Aminah, M.Kom. | Kaprodi TI |
| Jabatan HRIS | `POS-001` | Ketua Program Studi TI | Jabatan aktif untuk pemetaan kewenangan |
| Kompetensi HRIS | `CMP-001` | Sertifikasi Auditor Mutu Internal | Kompetensi pendukung AMI |
| Dokumen HRIS | `DOC-HR-001` | SK Jabatan Kaprodi TI | Dokumen SDM pendukung SPMI |
| Standar | `std-visi-misi` | Standar Visi, Misi, Tujuan, dan Strategi | Standar tata kelola |
| Standar | `std-pembelajaran` | Standar Proses Pembelajaran | Standar akademik |
| AMI | `ami-seed-2026` | AMI Semester Genap 2026 | Audit prodi |
| Temuan | `finding-seed-2026` | Dokumen RPS belum lengkap | Temuan sedang |
| PPEPP | `ppepp-seed-penetapan` | Penetapan indikator mutu institusi | Fase P1 selesai |
| PPEPP | `ppepp-seed-evaluasi` | Evaluasi pelaksanaan pembelajaran | Fase E berjalan |

## Alur Proses Simulasi

### 1. Login Dan Validasi Hak Akses

| Langkah | Aktor | Menu | Data Dummy | Expected Result |
|---|---|---|---|---|
| 1 | Super Admin | Login | `admin@spmi.local` | Dashboard terbuka, seluruh menu admin terlihat |
| 2 | LPM | Login | `lpm@spmi.local` | Menu mutu, PPEPP, AMI, dashboard terlihat |
| 3 | Auditor | Login | `auditor@spmi.local` | Menu AMI dan laporan audit terlihat |
| 4 | Kaprodi | Login | `kaprodi@spmi.local` | Menu indikator, dokumen, PPEPP, RTL terlihat |
| 5 | Unit Kerja | Login | `unit@spmi.local` | Data terbatas pada scope unit |

Output yang dicek:

- Aktivitas `login` masuk audit trail.
- Sidebar hanya menampilkan parent menu yang sesuai role.
- Child menu muncul lewat workspace atau mega menu, bukan nested panjang.

### 2. Master Data HRIS

| Langkah | Aktor | Menu | Data Dummy | Expected Result |
|---|---|---|---|---|
| 1 | Super Admin | Master Data & Sumber Data > HRIS | Ringkasan SDM | KPI dosen, tendik, kompetensi, dan dokumen SDM tampil |
| 2 | Dekan | HRIS > Master SDM | Dr. Budi Santoso | Data pegawai aktif terlihat sesuai kewenangan |
| 3 | Dekan | HRIS > Jabatan | Ketua Program Studi TI | Jabatan aktif terhubung ke unit/prodi |
| 4 | LPM | HRIS > Kompetensi | Sertifikasi Auditor Mutu Internal | Kompetensi SDM terbaca untuk kebutuhan AMI |
| 5 | LPM | HRIS > Dokumen SDM | SK Jabatan Kaprodi TI | Dokumen SDM menjadi evidence pendukung SPMI |
| 6 | LPM | HRIS > Koneksi SPMI | HRIS ke standar SDM dan akreditasi | Mapping SDM bisa dipakai untuk report mutu |

Output yang dicek:

- Data HRIS tidak kosong dan tampil dari sumber data sistem.
- Jabatan HRIS menjadi referensi kewenangan Dekan, Kaprodi, Unit, dan pimpinan.
- Kompetensi auditor dan dokumen SDM bisa ditelusuri ke AMI, standar SDM, dan akreditasi.
- Aktivitas tambah/edit/hapus data HRIS tercatat di audit trail.

### 3. Penetapan Standar

| Langkah | Aktor | Menu | Data Dummy | Expected Result |
|---|---|---|---|---|
| 1 | LPM | Penetapan Standar > Standar Mutu | Standar Proses Pembelajaran | Standar tampil sebagai data aktif |
| 2 | LPM | Dokumen SPMI | Manual Mutu Pembelajaran 2026 | Dokumen terhubung ke standar |
| 3 | LPM | Sasaran Mutu | Target ketercapaian CPL 85% | Sasaran tersimpan sebagai indikator target |

Output yang dicek:

- Data standar berasal dari database atau store operasional sistem.
- Aktivitas tambah/edit standar tercatat.
- Dashboard menambah jumlah standar aktif.

### 4. Pelaksanaan Dan Capaian

| Langkah | Aktor | Menu | Data Dummy | Expected Result |
|---|---|---|---|---|
| 1 | Kaprodi | Pelaksanaan & Capaian > Indikator | IKU CPL Lulusan | Indikator aktif untuk Prodi TI |
| 2 | Operator | Capaian | Capaian 82 dari target 85 | Status capaian terbaca belum memenuhi |
| 3 | Unit Kerja | Dokumen SPMI | Evidence RPS dan berita acara | Evidence tersimpan dan bisa ditelusuri |

Output yang dicek:

- Counter indikator dan capaian dashboard berubah.
- Aktivitas tambah data dan edit capaian tercatat.
- Dokumen evidence tampil di modul terkait.

### 5. Evaluasi AMI

| Langkah | Aktor | Menu | Data Dummy | Expected Result |
|---|---|---|---|---|
| 1 | LPM | Evaluasi > Audit Mutu Internal | AMI Semester Genap 2026 | Audit terjadwal untuk Prodi TI |
| 2 | Auditor | AMI | Instrumen pembelajaran | Auditor dapat mengisi instrumen |
| 3 | Auditor | Temuan AMI | Dokumen RPS belum lengkap | Temuan masuk daftar AMI |
| 4 | Auditor | Approval/Reject temuan | Status temuan diverifikasi | Status berubah dan tercatat |

Output yang dicek:

- Aktivitas `approval` atau `reject` tercatat.
- Temuan muncul di dashboard dan laporan AMI.
- Notifikasi tindak lanjut muncul untuk Kaprodi/Unit.

### 6. Pengendalian RTL

| Langkah | Aktor | Menu | Data Dummy | Expected Result |
|---|---|---|---|---|
| 1 | Kaprodi | Pengendalian > RTL | Revisi RPS oleh tim kurikulum | RTL dibuat dari temuan |
| 2 | Unit Kerja | Monitoring RTL | Progress 50% | Progress tersimpan |
| 3 | Auditor | Verifikasi RTL | Bukti revisi RPS | Auditor dapat memverifikasi bukti |

Output yang dicek:

- RTL punya PIC, deadline, status, dan progress.
- Aktivitas edit data dan approval tercatat.
- Dashboard menampilkan RTL berjalan dan overdue jika lewat tenggat.

### 7. RTM Dan Peningkatan

| Langkah | Aktor | Menu | Data Dummy | Expected Result |
|---|---|---|---|---|
| 1 | Dekan | Peningkatan > RTM | RTM Evaluasi AMI 2026 | Rapat tinjauan tercatat |
| 2 | LPM | Program Peningkatan | Template evaluasi RPS terpadu | Program peningkatan dibuat |
| 3 | Kaprodi | Action Plan | Finalisasi RPS semua mata kuliah | Action plan terhubung ke RTL |

Output yang dicek:

- Keputusan RTM tampil di laporan.
- Program peningkatan menjadi tindak lanjut PPEPP.
- Status peningkatan tampil di dashboard.

### 8. Pelaporan Dan Dashboard

| Langkah | Aktor | Menu | Data Dummy | Expected Result |
|---|---|---|---|---|
| 1 | LPM | Pelaporan > Dashboard | Semua data dummy | KPI, counter, grafik tidak kosong |
| 2 | Dekan | PPEPP | Tahun 2026 | Alur PPEPP terlihat per fase |
| 3 | Super Admin | Audit Trail | Aktivitas simulasi | Login, logout, CRUD, approval, reject tercatat |
| 4 | LPM | Akreditasi/Analitik | Rekap mutu 2026 | Report dapat dibaca untuk rapat |

Output yang dicek:

- Dashboard tidak memakai hardcode atau dummy kosong.
- Data muncul dari hasil aktivitas simulasi.
- Laporan punya sumber data jelas.

## Skenario Dummy End-to-End

| No | Proses | Input Dummy | Aktor | Status Target |
|---|---|---|---|---|
| 1 | Cek HRIS | Ringkasan SDM, jabatan, kompetensi, dokumen | Super Admin | PASS |
| 2 | Tambah/update data SDM | Dr. Budi Santoso | Dekan | PASS |
| 3 | Tambah/update jabatan | Ketua Program Studi TI | Dekan | PASS |
| 4 | Tambah/update kompetensi | Sertifikasi Auditor Mutu Internal | LPM | PASS |
| 5 | Buat standar mutu | Standar Proses Pembelajaran | LPM | PASS |
| 6 | Upload dokumen standar | Manual Mutu Pembelajaran 2026 | LPM | PASS |
| 7 | Buat indikator | Ketercapaian CPL Lulusan | Kaprodi | PASS |
| 8 | Input capaian | 82% dari target 85% | Operator | PASS |
| 9 | Buat siklus PPEPP | Evaluasi pembelajaran 2026 | LPM | PASS |
| 10 | Jadwalkan AMI | AMI Prodi TI Semester Genap | LPM | PASS |
| 11 | Input temuan | RPS belum lengkap | Auditor | PASS |
| 12 | Buat RTL | Revisi RPS oleh tim kurikulum | Kaprodi | PASS |
| 13 | Verifikasi RTL | Bukti revisi RPS | Auditor | PASS |
| 14 | Buat RTM | RTM hasil AMI | Dekan | PASS |
| 15 | Buat program peningkatan | Template evaluasi RPS terpadu | LPM | PASS |
| 16 | Cek dashboard dan audit trail | Rekap seluruh aktivitas | Super Admin | PASS |

## Payload Dummy Tambahan

### Pegawai HRIS

```json
{
  "name": "Dr. Budi Santoso",
  "employeeNumber": "EMP-001",
  "nidn": "0715068601",
  "email": "budi.santoso@uji.ac.id",
  "type": "Dosen Tetap",
  "unit": "Program Studi Teknik Informatika",
  "status": "Aktif"
}
```

### Jabatan HRIS

```json
{
  "title": "Ketua Program Studi TI",
  "unit": "Program Studi Teknik Informatika",
  "holder": "Siti Aminah, M.Kom.",
  "period": "2026-2030",
  "status": "Aktif"
}
```

### Kompetensi HRIS

```json
{
  "employee": "Dr. Budi Santoso",
  "category": "Sertifikasi",
  "name": "Sertifikasi Auditor Mutu Internal",
  "year": 2026,
  "status": "Tervalidasi"
}
```

### Dokumen HRIS

```json
{
  "employee": "Siti Aminah, M.Kom.",
  "type": "SK Jabatan",
  "title": "SK Jabatan Kaprodi TI 2026-2030",
  "status": "Aktif"
}
```

### Standar Mutu

```json
{
  "title": "Standar Proses Pembelajaran Simulasi",
  "description": "Standar mutu proses pembelajaran untuk simulasi PPEPP 2026.",
  "category": "Akademik",
  "status": "aktif"
}
```

### Indikator

```json
{
  "name": "Ketercapaian CPL Lulusan",
  "category": "IKU",
  "target": 85,
  "unit": "%",
  "year": 2026,
  "status": "aktif"
}
```

### Capaian Indikator

```json
{
  "value": 82,
  "period": "Semester Genap 2026",
  "notes": "Capaian masih di bawah target dan perlu RTL."
}
```

### PPEPP

```json
{
  "standar_id": "std-pembelajaran",
  "unit_kerja_id": "TI",
  "fase": "E",
  "isi": "Evaluasi pelaksanaan standar proses pembelajaran semester genap.",
  "status": "berjalan",
  "tahun": 2026
}
```

### Temuan AMI

```json
{
  "title": "Dokumen RPS belum lengkap",
  "deskripsi": "Sebagian RPS belum diperbarui sesuai CPL terbaru.",
  "severity": "sedang",
  "kategori": "Dokumen Akademik",
  "rencana_tindak_lanjut": "Melakukan revisi RPS oleh tim kurikulum.",
  "status_rtl": "berjalan",
  "tenggat": "2026-07-01T00:00:00.000Z"
}
```

### RTM

```json
{
  "tanggal": "2026-07-10T09:00:00.000Z",
  "peserta": ["Ketua LPM", "Dekan FE", "Kaprodi TI", "Auditor Internal"],
  "agenda": "Review hasil AMI dan evaluasi PPEPP pembelajaran",
  "hasil_keputusan": "Seluruh RPS wajib direvisi dan diverifikasi sebelum awal semester berikutnya.",
  "status": "selesai"
}
```

## Checklist PASS Simulasi

| Area | Kriteria PASS |
|---|---|
| Hak akses | Setiap role hanya melihat menu sesuai kewenangan |
| HRIS | Data SDM, jabatan, kompetensi, dokumen, dan koneksi SPMI tampil |
| CRUD | Tambah, edit, hapus data tercatat dan muncul di modul |
| PPEPP | Fase P1, P2, E, P3, P4 dapat dilacak |
| AMI | Audit, instrumen, temuan, dan verifikasi berjalan |
| RTL | Tindak lanjut punya PIC, status, deadline, dan bukti |
| RTM | Keputusan rapat menjadi program/action plan |
| Dashboard | KPI, grafik, counter, statistik tidak kosong |
| Audit Trail | Login, logout, tambah, edit, hapus, approval, reject tercatat |
| Notifikasi | User terkait menerima informasi tindak lanjut |
| Report | Rekap AMI, PPEPP, dashboard, dan akreditasi dapat dibaca |

## Urutan Demo 15 Menit

1. Login sebagai `lpm@spmi.local`, buka Dashboard dan Standar Mutu.
2. Buka Master Data & Sumber Data > HRIS, cek ringkasan SDM, jabatan, kompetensi, dan dokumen SDM.
3. Buat atau cek standar pembelajaran.
4. Buka PPEPP, cek fase evaluasi berjalan.
5. Login sebagai `auditor@spmi.local`, buka AMI, tambah temuan RPS.
6. Login sebagai `kaprodi@spmi.local`, buka RTL, update progress tindak lanjut.
7. Login sebagai `dekan@spmi.local`, buka RTM, buat keputusan rapat.
8. Login sebagai `admin@spmi.local`, cek Dashboard, Audit Trail, dan Notifikasi.

## Catatan Aman Untuk Simulasi

- Gunakan data dengan label `Simulasi` atau tahun `2026`.
- Jangan pakai data pribadi nyata.
- Jangan upload dokumen rahasia; gunakan file contoh.
- Jika simulasi dilakukan di database produksi, tandai semua record sebagai data latihan supaya mudah dibedakan.
