<?php

namespace Database\Seeders;

use App\Models\MutuStandard;
use App\Models\PerformanceIndicator;
use Illuminate\Database\Seeder;

class IndicatorSeeder extends Seeder
{
    public function run(): void
    {
        $standard = MutuStandard::first();
        
        if (!$standard) {
            return;
        }

        $indicators = [
            [
                'mutu_standard_id' => $standard->id,
                'code' => 'IKU-1.1',
                'name' => 'Rata-rata IPK Lulusan',
                'description' => 'Target pencapaian rata-rata IPK lulusan tiap semester',
                'target_value' => 3.25,
                'unit' => 'IPK',
                'source_type' => 'api_siakad'
            ],
            [
                'mutu_standard_id' => $standard->id,
                'code' => 'IKU-1.2',
                'name' => 'Persentase Lulusan Tepat Waktu',
                'description' => 'Persentase mahasiswa yang lulus dalam 8 semester',
                'target_value' => 80,
                'unit' => '%',
                'source_type' => 'api_siakad'
            ]
        ];

        foreach ($indicators as $indicator) {
            PerformanceIndicator::updateOrCreate(
                ['code' => $indicator['code']],
                $indicator
            );
        }
    }
}
