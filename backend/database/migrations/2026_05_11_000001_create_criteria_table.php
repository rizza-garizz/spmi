<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('criteria', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mutu_standard_id')->constrained('mutu_standards')->cascadeOnDelete();
            $table->string('code')->index(); // Misal: C1, C2
            $table->string('name');
            $table->text('description')->nullable();
            $table->double('weight')->default(0); // Bobot kriteria dalam instrumen
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('criteria');
    }
};
