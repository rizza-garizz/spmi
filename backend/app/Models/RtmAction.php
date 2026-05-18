<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RtmAction extends Model
{
    use HasFactory;

    protected $fillable = [
        'rtm_meeting_id',
        'org_unit_id',
        'action_item',
        'owner_notes',
        'due_date',
        'status',
    ];

    protected $casts = [
        'due_date' => 'date',
    ];
}
