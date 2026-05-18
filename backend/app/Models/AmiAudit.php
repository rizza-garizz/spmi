<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AmiAudit extends Model
{
    use HasFactory;

    protected $fillable = [
        'ppepp_cycle_id',
        'org_unit_id',
        'audit_date',
        'status',
        'score',
        'finding_summary',
        'lead_auditor_id',
    ];

    protected $casts = [
        'audit_date' => 'date',
        'score' => 'decimal:2',
    ];
}
