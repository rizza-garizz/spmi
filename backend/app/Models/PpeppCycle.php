<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PpeppCycle extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'academic_year_start',
        'academic_year_end',
        'period',
        'status',
    ];
}
