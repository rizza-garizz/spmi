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
        Schema::table('performance_indicators', function (Blueprint $table) {
            $table->foreignId('criteria_id')->nullable()->after('mutu_standard_id')->constrained('criteria')->nullOnDelete();
            $table->double('weight')->default(0)->after('unit'); // Bobot indikator
            $table->string('data_type')->default('numeric')->after('weight'); // numeric, percentage, ratio
            $table->text('formula')->nullable()->after('data_type'); // Rumus perhitungan jika ada
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('performance_indicators', function (Blueprint $table) {
            $table->dropForeign(['criteria_id']);
            $table->dropColumn(['criteria_id', 'weight', 'data_type', 'formula']);
        });
    }
};
