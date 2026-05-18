<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SpmiDocumentVersion extends Model
{
    use HasFactory;

    protected $fillable = [
        'spmi_document_id',
        'version_number',
        'file_path',
        'file_name',
        'mime_type',
        'file_size',
        'meta',
        'status',
        'created_by',
    ];

    protected $casts = [
        'meta' => 'array',
    ];

    public function document()
    {
        return $this->belongsTo(SpmiDocument::class, 'spmi_document_id');
    }
}
