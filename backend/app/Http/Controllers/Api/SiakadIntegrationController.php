<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\IndicatorValue;
use App\Models\PerformanceIndicator;
use App\Models\OrgUnit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class SiakadIntegrationController extends Controller
{
    /**
     * Menerima data dari SIAKAD Custom
     */
    public function pushData(Request $request)
    {
        Log::info('SIAKAD Data Push Attempt', [
            'ip' => $request->ip(),
            'indicator' => $request->indicator_code,
            'prodi' => $request->prodi_code,
            'period' => $request->period,
            'value' => $request->value
        ]);

        // 1. Validasi Request
        $validator = Validator::make($request->all(), [
            'api_key' => 'required',
            'indicator_code' => 'required|exists:performance_indicators,code',
            'prodi_code' => 'required', // Bisa code SPMI atau code SIAKAD
            'period' => 'required', // Contoh: 2024-1
            'value' => 'required|numeric',
            'notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        // 2. Cek API Key (Sederhana dulu, bisa ditaruh di .env nanti)
        if ($request->api_key !== config('app.siakad_key', 'spmi-siakad-secret-123')) {
            return response()->json([
                'success' => false,
                'message' => 'API Key tidak valid'
            ], 401);
        }

        // 3. Cari Indikator & OrgUnit
        $indicator = PerformanceIndicator::where('code', $request->indicator_code)->first();
        // Cari unit organisasi (Prodi) - Bisa pakai siakad_code atau code biasa
        $orgUnit = OrgUnit::where('siakad_code', $request->prodi_code)
            ->orWhere('code', $request->prodi_code)
            ->first();

        if (!$orgUnit) {
            return response()->json(['success' => false, 'message' => 'Prodi tidak ditemukan'], 422);
        }

        // 4. Update atau Create data capaian
        $indicatorValue = IndicatorValue::updateOrCreate(
            [
                'performance_indicator_id' => $indicator->id,
                'org_unit_id' => $orgUnit->id,
                'period' => $request->period,
            ],
            [
                'actual_value' => $request->value,
                'notes' => $request->notes ?? 'Data otomatis dari SIAKAD',
                'status' => $request->value >= $indicator->target_value ? 'Target Tercapai' : 'Target Belum Tercapai'
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Data berhasil diterima dan diperbarui',
            'data' => $indicatorValue
        ]);
    }
}
