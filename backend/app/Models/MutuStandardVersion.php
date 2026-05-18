<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MutuStandardVersion extends Model
{
    use HasFactory;

    protected $fillable = [
        'mutu_standard_id',
        'version_number',
        'content',
        'status',
        'created_by',
    ];

    protected $casts = [
        'content' => 'array',
    ];

    public function standard()
    {
        return $this->belongsTo(MutuStandard::class, 'mutu_standard_id');
    }
}
