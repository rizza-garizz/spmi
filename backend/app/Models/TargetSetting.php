<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TargetSetting extends Model
{
    protected $fillable = [
        'ppepp_cycle_id',
        'performance_indicator_id',
        'org_unit_id',
        'target_value',
        'baseline_value'
    ];

    public function cycle()
    {
        return $this->belongsTo(PpeppCycle::class, 'ppepp_cycle_id');
    }

    public function indicator()
    {
        return $this->belongsTo(PerformanceIndicator::class, 'performance_indicator_id');
    }

    public function orgUnit()
    {
        return $this->belongsTo(OrgUnit::class);
    }
}
