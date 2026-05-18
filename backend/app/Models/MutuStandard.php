<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MutuStandard extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'title',
        'category',
        'description',
        'status',
        'published_at',
        'published_by',
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    public function versions()
    {
        return $this->hasMany(MutuStandardVersion::class);
    }

    public function publisher()
    {
        return $this->belongsTo(User::class, 'published_by');
    }

    public function indicators()
    {
        return $this->hasMany(PerformanceIndicator::class);
    }
}
