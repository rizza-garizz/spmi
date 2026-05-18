<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PerformanceIndicator extends Model
{
    protected $fillable = [
        'mutu_standard_id',
        'criteria_id',
        'code',
        'name',
        'description',
        'target_value',
        'unit',
        'weight',
        'data_type',
        'formula',
        'source_type'
    ];

    public function standard()
    {
        return $this->belongsTo(MutuStandard::class, 'mutu_standard_id');
    }

    public function criteria()
    {
        return $this->belongsTo(Criteria::class);
    }

    public function values()
    {
        return $this->hasMany(IndicatorValue::class);
    }

    public function targetSettings()
    {
        return $this->hasMany(TargetSetting::class);
    }
}
