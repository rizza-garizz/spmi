<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\IndicatorValue;
use App\Models\PerformanceIndicator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IndicatorController extends Controller
{
    /**
     * Daftar semua indikator beserta capaian terakhirnya
     */
    public function index(): JsonResponse
    {
        $indicators = PerformanceIndicator::with(['standard:id,code,title', 'values' => function ($q) {
            $q->orderByDesc('created_at');
        }])->get()->map(function ($item) {
            $latestValue = $item->values->first();
            return [
                'id' => $item->id,
                'code' => $item->code,
                'name' => $item->name,
                'description' => $item->description,
                'target_value' => $item->target_value,
                'unit' => $item->unit,
                'source_type' => $item->source_type,
                'standard' => $item->standard ? [
                    'id' => $item->standard->id,
                    'code' => $item->standard->code,
                    'title' => $item->standard->title,
                ] : null,
                'latest_value' => $latestValue ? [
                    'actual_value' => $latestValue->actual_value,
                    'period' => $latestValue->period,
                    'status' => $latestValue->status,
                    'notes' => $latestValue->notes,
                ] : null,
                'history' => $item->values->take(5)->map(fn($v) => [
                    'actual_value' => $v->actual_value,
                    'period' => $v->period,
                    'status' => $v->status,
                    'created_at' => $v->created_at->toDateTimeString(),
                ]),
            ];
        });

        return response()->json(['data' => $indicators]);
    }

    /**
     * Tambah indikator baru
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'mutu_standard_id' => 'required|exists:mutu_standards,id',
            'code' => 'required|unique:performance_indicators,code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'target_value' => 'required|numeric|min:0',
            'unit' => 'required|string|max:50',
            'source_type' => 'required|in:manual,api_siakad,api_other',
        ]);

        $indicator = PerformanceIndicator::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Indikator berhasil ditambahkan',
            'data' => $indicator,
        ], 201);
    }

    /**
     * Input capaian baru untuk indikator tertentu
     */
    public function addValue(Request $request, PerformanceIndicator $indicator): JsonResponse
    {
        $validated = $request->validate([
            'org_unit_id' => 'nullable|exists:org_units,id',
            'period' => 'required|string|max:20',
            'actual_value' => 'required|numeric',
            'notes' => 'nullable|string',
        ]);

        $status = $validated['actual_value'] >= $indicator->target_value
            ? 'Target Tercapai'
            : 'Target Belum Tercapai';

        $value = IndicatorValue::updateOrCreate(
            [
                'performance_indicator_id' => $indicator->id,
                'org_unit_id' => $validated['org_unit_id'] ?? null,
                'period' => $validated['period'],
            ],
            [
                'actual_value' => $validated['actual_value'],
                'status' => $status,
                'notes' => $validated['notes'] ?? null,
                'evidence_url' => $request->evidence_url, // Support bukti baru
            ]
        );

        // HITUNG SKOR OTOMATIS (UPGRADE)
        $scoringService = new \App\Services\AccreditationScoringService();
        $scoringService->calculateScore($value);

        return response()->json([
            'success' => true,
            'message' => 'Capaian berhasil disimpan dan skor telah dihitung otomatis',
            'data' => $value->fresh(['indicator']),
        ]);
    }

    /**
     * Hapus indikator
     */
    public function destroy(PerformanceIndicator $indicator): JsonResponse
    {
        $indicator->delete();

        return response()->json([
            'success' => true,
            'message' => 'Indikator berhasil dihapus',
        ]);
    }
}
