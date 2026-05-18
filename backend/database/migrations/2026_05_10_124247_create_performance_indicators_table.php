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
        Schema::create('performance_indicators', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mutu_standard_id')->constrained()->cascadeOnDelete();
            $table->string('code')->unique(); // Misal: IKU-1.1
            $table->string('name');
            $table->text('description')->nullable();
            $table->double('target_value')->default(0);
            $table->string('unit')->default('%'); // %, Orang, Ratio, dsb
            $table->enum('source_type', ['manual', 'api_siakad', 'api_other'])->default('manual');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('performance_indicators');
    }
};
