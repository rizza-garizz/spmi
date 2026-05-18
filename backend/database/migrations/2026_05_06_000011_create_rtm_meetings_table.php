<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rtm_meetings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ppepp_cycle_id')->constrained()->cascadeOnDelete();
            $table->date('meeting_date')->nullable();
            $table->string('title');
            $table->enum('status', ['draft', 'scheduled', 'done', 'archived'])->default('draft');
            $table->text('conclusion')->nullable();
            $table->foreignId('moderator_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rtm_meetings');
    }
};
