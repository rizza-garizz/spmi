<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RtmMeeting extends Model
{
    use HasFactory;

    protected $fillable = [
        'ppepp_cycle_id',
        'meeting_date',
        'title',
        'status',
        'conclusion',
        'moderator_id',
    ];

    protected $casts = [
        'meeting_date' => 'date',
    ];
}
