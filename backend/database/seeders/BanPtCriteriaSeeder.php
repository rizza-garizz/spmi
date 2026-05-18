<?php

namespace Database\Seeders;

use App\Models\MutuStandard;
use App\Models\Criteria;
use Illuminate\Database\Seeder;

class BanPtCriteriaSeeder extends Seeder
{
    public function run(): void
    {
        // Cari atau buat standar induk untuk BAN-PT
        $standard = MutuStandard::firstOrCreate(
            ['code' => 'STD-BANPT-9K'],
            [
                'title' => 'Instrumen Akreditasi 9 Kriteria (BAN-PT)',
                'category' => 'akreditasi',
                'description' => 'Standar Akreditasi Program Studi Berdasarkan Instrumen 9 Kriteria',
                'status' => 'active'
            ]
        );

        $criteria = [
            ['code' => 'C1', 'name' => 'Visi, Misi, Tujuan, dan Strategi', 'weight' => 5],
            ['code' => 'C2', 'name' => 'Tata Pamong, Tata Kelola, dan Kerjasama', 'weight' => 15],
            ['code' => 'C3', 'name' => 'Mahasiswa', 'weight' => 10],
            ['code' => 'C4', 'name' => 'Sumber Daya Manusia', 'weight' => 20],
            ['code' => 'C5', 'name' => 'Keuangan, Sarana, dan Prasarana', 'weight' => 10],
            ['code' => 'C6', 'name' => 'Pendidikan', 'weight' => 20],
            ['code' => 'C7', 'name' => 'Penelitian', 'weight' => 10],
            ['code' => 'C8', 'name' => 'Pengabdian kepada Masyarakat', 'weight' => 5],
            ['code' => 'C9', 'name' => 'Luaran dan Capaian Tridharma', 'weight' => 5],
        ];

        foreach ($criteria as $item) {
            Criteria::updateOrCreate(
                [
                    'mutu_standard_id' => $standard->id,
                    'code' => $item['code']
                ],
                $item
            );
        }
    }
}
