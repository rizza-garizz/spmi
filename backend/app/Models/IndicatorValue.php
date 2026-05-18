<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IndicatorValue extends Model
{
    protected $fillable = [
        'performance_indicator_id',
        'org_unit_id',
        'period',
        'actual_value',
        'score',
        'weighted_score',
        'status',
        'notes',
        'evidence_url',
        'evaluated_at'
    ];

    public function indicator()
    {
        return $this->belongsTo(PerformanceIndicator::class, 'performance_indicator_id');
    }

    public function orgUnit()
    {
        return $this->belongsTo(OrgUnit::class);
    }
}
