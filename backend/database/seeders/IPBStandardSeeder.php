<?php

namespace Database\Seeders;

use App\Models\MutuStandard;
use App\Models\PerformanceIndicator;
use Illuminate\Database\Seeder;

class IPBStandardSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Buat Standar Utama ala IPB (Disesuaikan dengan Enum Database)
        $standards = [
            [
                'code' => 'STD-IPB-01',
                'title' => 'Standar Kualitas Lulusan IPB',
                'category' => 'pendidikan',
                'description' => 'Standar yang menjamin kompetensi lulusan siap kerja dan berdaya saing global.',
                'status' => 'active',
            ],
            [
                'code' => 'STD-IPB-02',
                'title' => 'Standar Sumber Daya Manusia (Dosen)',
                'category' => 'tambahan', // SDM masuk kategori tambahan sementara
                'description' => 'Standar kualifikasi dan rekognisi dosen tingkat internasional.',
                'status' => 'active',
            ],
            [
                'code' => 'STD-IPB-03',
                'title' => 'Standar Internasionalisasi & Akreditasi',
                'category' => 'tambahan', // Kerjasama masuk kategori tambahan
                'description' => 'Target capaian akreditasi internasional prodi dan mobilitas mahasiswa.',
                'status' => 'active',
            ],
            [
                'code' => 'STD-IPB-04',
                'title' => 'Standar Hilirisasi Riset & Inovasi',
                'category' => 'penelitian',
                'description' => 'Standar pemanfaatan hasil riset oleh industri dan masyarakat.',
                'status' => 'active',
            ]
        ];

        foreach ($standards as $sData) {
            $standard = MutuStandard::updateOrCreate(['code' => $sData['code']], $sData);

            // 2. Tambahkan Indikator (IKU) untuk masing-masing standar
            if ($sData['code'] === 'STD-IPB-01') {
                $this->createIndicator($standard->id, 'IKU-IPB-1.1', 'Lulusan Mendapat Pekerjaan Layak', 80, '%', 'api_siakad');
                $this->createIndicator($standard->id, 'IKU-IPB-1.2', 'Mahasiswa Berkegiatan di Luar Kampus', 20, '%', 'api_siakad');
            }

            if ($sData['code'] === 'STD-IPB-02') {
                $this->createIndicator($standard->id, 'IKU-IPB-3.1', 'Dosen Berkegiatan di Luar Kampus', 40, '%', 'manual');
                $this->createIndicator($standard->id, 'IKU-IPB-4.1', 'Dosen Berkualifikasi S3', 50, '%', 'manual');
            }

            if ($sData['code'] === 'STD-IPB-03') {
                $this->createIndicator($standard->id, 'IKU-IPB-8.1', 'Prodi Terakreditasi Internasional', 30, '%', 'manual');
            }

            if ($sData['code'] === 'STD-IPB-04') {
                $this->createIndicator($standard->id, 'IKU-IPB-5.1', 'Hasil Riset Digunakan Masyarakat/Industri', 15, 'Judul', 'manual');
            }
        }
    }

    private function createIndicator($standardId, $code, $name, $target, $unit, $source)
    {
        PerformanceIndicator::updateOrCreate(
            ['code' => $code],
            [
                'mutu_standard_id' => $standardId,
                'name' => $name,
                'target_value' => $target,
                'unit' => $unit,
                'source_type' => $source,
            ]
        );
    }
}
