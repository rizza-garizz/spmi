<?php

namespace Database\Seeders;

use App\Models\Criteria;
use App\Models\PerformanceIndicator;
use Illuminate\Database\Seeder;

class LegacyDataMappingSeeder extends Seeder
{
    public function run(): void
    {
        // Cari kriteria yang sudah dibuat di BanPtCriteriaSeeder
        $kriteria9 = Criteria::where('code', 'C9')->first(); // Luaran dan Capaian
        $kriteria3 = Criteria::where('code', 'C3')->first(); // Mahasiswa
        $kriteria6 = Criteria::where('code', 'C6')->first(); // Pendidikan

        if (!$kriteria9) {
            $this->command->error('Kriteria BAN-PT belum di-seed! Jalankan BanPtCriteriaSeeder dulu.');
            return;
        }

        // Contoh pemetaan indikator lama ke kriteria baru
        // Kita gunakan LIKE karena kode mungkin bervariasi
        
        // Indikator terkait Lulusan -> Kriteria 9
        PerformanceIndicator::where('code', 'LIKE', 'IKU-1.1%') // IPK
            ->orWhere('name', 'LIKE', '%Lulusan%')
            ->update([
                'criteria_id' => $kriteria9->id,
                'weight' => 5, // Bobot contoh
                'data_type' => 'numeric'
            ]);

        PerformanceIndicator::where('code', 'LIKE', 'IKU-1.2%') // Tepat Waktu
            ->update([
                'criteria_id' => $kriteria9->id,
                'weight' => 10,
                'data_type' => 'percentage'
            ]);

        // Indikator terkait Mahasiswa -> Kriteria 3
        PerformanceIndicator::where('name', 'LIKE', '%Mahasiswa Baru%')
            ->orWhere('name', 'LIKE', '%Pendaftar%')
            ->update([
                'criteria_id' => $kriteria3->id,
                'weight' => 5,
                'data_type' => 'count'
            ]);

        // Sisanya kita set ke kriteria default atau biarkan null untuk diisi manual oleh admin
        $this->command->info('Mapping data lama selesai.');
    }
}
