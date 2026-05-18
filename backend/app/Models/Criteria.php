<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Criteria extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'mutu_standard_id',
        'code',
        'name',
        'description',
        'weight'
    ];

    public function standard()
    {
        return $this->belongsTo(MutuStandard::class, 'mutu_standard_id');
    }

    public function indicators()
    {
        return $this->hasMany(PerformanceIndicator::class, 'criteria_id');
    }
}
