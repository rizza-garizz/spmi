<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ppepp_cycles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedSmallInteger('academic_year_start');
            $table->unsignedSmallInteger('academic_year_end');
            $table->enum('period', ['semester', 'annual', 'semester_ganjil', 'semester_genap', 'yearly'])->default('yearly');
            $table->enum('status', ['planned', 'running', 'closed'])->default('planned');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ppepp_cycles');
    }
};
