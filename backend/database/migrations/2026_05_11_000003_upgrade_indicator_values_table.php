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
        Schema::table('indicator_values', function (Blueprint $table) {
            $table->double('score')->nullable()->after('actual_value'); // Skor 0-4
            $table->double('weighted_score')->nullable()->after('score'); // Skor x Bobot
            $table->string('evidence_url')->nullable()->after('notes'); // Link ke bukti
            $table->timestamp('evaluated_at')->nullable()->after('evidence_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('indicator_values', function (Blueprint $table) {
            $table->dropColumn(['score', 'weighted_score', 'evidence_url', 'evaluated_at']);
        });
    }
};
