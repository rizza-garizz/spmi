<?php

namespace App\Services;

use App\Models\IndicatorValue;
use App\Models\PerformanceIndicator;

class AccreditationScoringService
{
    /**
     * Hitung skor untuk satu nilai capaian indikator
     */
    public function calculateScore(IndicatorValue $value)
    {
        $indicator = $value->indicator;
        
        if (!$indicator) return;

        // Ambil target (bisa dari setting dinamis atau default)
        $target = $indicator->target_value;
        $actual = $value->actual_value;

        // Logic scoring dasar (Skala 0 - 4)
        // Kita bisa kembangkan rumus yang lebih kompleks per data_type nanti
        $score = 0;

        if ($target > 0) {
            $ratio = $actual / $target;
            
            if ($ratio >= 1.0) $score = 4.0;
            elseif ($ratio >= 0.8) $score = 3.0;
            elseif ($ratio >= 0.6) $score = 2.0;
            elseif ($ratio >= 0.4) $score = 1.0;
            else $score = 0;
        }

        // Hitung skor terbobot (jika ada bobot di indikator)
        $weightedScore = $score * ($indicator->weight ?? 0);

        // Update nilai
        $value->update([
            'score' => $score,
            'weighted_score' => $weightedScore,
            'evaluated_at' => now()
        ]);

        return $score;
    }

    /**
     * Hitung total skor satu kriteria untuk prodi tertentu
     */
    public function calculateCriteriaScore($criteriaId, $orgUnitId, $period)
    {
        return IndicatorValue::whereHas('indicator', function($q) use ($criteriaId) {
            $q->where('criteria_id', $criteriaId);
        })
        ->where('org_unit_id', $orgUnitId)
        ->where('period', $period)
        ->sum('weighted_score');
    }
}
