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
        Schema::create('target_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ppepp_cycle_id')->constrained('ppepp_cycles')->cascadeOnDelete();
            $table->foreignId('performance_indicator_id')->constrained('performance_indicators')->cascadeOnDelete();
            $table->foreignId('org_unit_id')->nullable()->constrained('org_units')->cascadeOnDelete();
            $table->double('target_value');
            $table->double('baseline_value')->nullable();
            $table->timestamps();

            $table->unique(['ppepp_cycle_id', 'performance_indicator_id', 'org_unit_id'], 'unique_target_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('target_settings');
    }
};
