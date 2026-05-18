<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SpmiDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'title',
        'type',
        'mutu_standard_id',
        'org_unit_id',
        'status',
        'current_version',
        'current_version_id',
        'owner_id',
        'published_at',
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    public function standard()
    {
        return $this->belongsTo(MutuStandard::class, 'mutu_standard_id');
    }

    public function unit()
    {
        return $this->belongsTo(OrgUnit::class, 'org_unit_id');
    }

    public function versions()
    {
        return $this->hasMany(SpmiDocumentVersion::class);
    }
}
