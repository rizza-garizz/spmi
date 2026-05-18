<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SurveyResponse extends Model
{
    use HasFactory;

    protected $fillable = [
        'survey_id',
        'org_unit_id',
        'answers',
        'score',
    ];

    protected $casts = [
        'answers' => 'array',
        'score' => 'decimal:2',
    ];
}
