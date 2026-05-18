<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rtm_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rtm_meeting_id')->constrained()->cascadeOnDelete();
            $table->foreignId('org_unit_id')->nullable()->constrained('org_units')->nullOnDelete();
            $table->text('action_item');
            $table->text('owner_notes')->nullable();
            $table->date('due_date')->nullable();
            $table->enum('status', ['open', 'in_progress', 'done', 'overdue'])->default('open');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rtm_actions');
    }
};
