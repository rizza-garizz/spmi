<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AmiFinding;
use App\Models\MutuStandard;
use App\Models\RtmAction;
use App\Models\SpmiDocument;
use Illuminate\Http\JsonResponse;
use App\Support\SharedCatalog;

class DashboardController extends Controller
{
    public function summary(): JsonResponse
    {
        return response()->json([
            'metrics' => [
                ['label' => 'Standar aktif', 'value' => MutuStandard::query()->where('status', 'active')->count()],
                ['label' => 'Dokumen aktif', 'value' => SpmiDocument::query()->where('status', 'approved')->count()],
                ['label' => 'Indikator IKU/IKT', 'value' => \App\Models\PerformanceIndicator::count()],
                ['label' => 'Temuan audit', 'value' => AmiFinding::query()->count()],
            ],
            'performance' => \App\Models\PerformanceIndicator::with(['values' => function($q) {
                $q->latest()->limit(5); // Ambil 5 data terakhir buat grafik
            }])->get()->map(function($item) {
                $latest = $item->values->first();
                return [
                    'code' => $item->code,
                    'name' => $item->name,
                    'target' => $item->target_value,
                    'actual' => $latest ? $latest->actual_value : 0,
                    'unit' => $item->unit,
                    'status' => $latest ? $latest->status : 'No Data',
                    'history' => $item->values->reverse()->map(fn($v) => [
                        'period' => $v->period,
                        'value' => $v->actual_value
                    ])->values()
                ];
            }),
            'modules' => SharedCatalog::dashboardModules(),
        ]);
    }
}
