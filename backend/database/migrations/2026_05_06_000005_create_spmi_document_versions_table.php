<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('spmi_document_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('spmi_document_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('version_number');
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->jsonb('meta')->nullable();
            $table->enum('status', ['draft', 'approved', 'archived'])->default('draft');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['spmi_document_id', 'version_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spmi_document_versions');
    }
};
