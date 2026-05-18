<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DataImport extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'title',
        'file_path',
        'file_name',
        'meta',
        'status',
        'uploaded_by',
    ];

    protected $casts = [
        'meta' => 'array',
    ];
}
