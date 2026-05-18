<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mutu_standard_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mutu_standard_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('version_number');
            $table->jsonb('content');
            $table->enum('status', ['draft', 'approved', 'archived'])->default('draft');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['mutu_standard_id', 'version_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mutu_standard_versions');
    }
};
