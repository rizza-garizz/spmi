<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ImplementationReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'ppepp_cycle_id',
        'org_unit_id',
        'mutu_standard_id',
        'summary',
        'status',
        'submitted_by',
    ];
}
