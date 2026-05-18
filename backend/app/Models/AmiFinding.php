<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AmiFinding extends Model
{
    use HasFactory;

    protected $fillable = [
        'ami_audit_id',
        'finding_code',
        'description',
        'severity',
        'recommendation',
        'root_cause',
        'status',
    ];
}
