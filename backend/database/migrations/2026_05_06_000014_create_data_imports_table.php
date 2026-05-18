<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('data_imports', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['lkpt', 'lkps', 'kkm', 'survey', 'other']);
            $table->string('title');
            $table->string('file_path');
            $table->string('file_name')->nullable();
            $table->jsonb('meta')->nullable();
            $table->enum('status', ['queued', 'processed', 'failed'])->default('queued');
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('data_imports');
    }
};
