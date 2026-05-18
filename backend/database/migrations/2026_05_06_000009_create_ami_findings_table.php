<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ami_findings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ami_audit_id')->constrained()->cascadeOnDelete();
            $table->string('finding_code')->nullable();
            $table->text('description');
            $table->enum('severity', ['minor', 'major', 'observation'])->default('observation');
            $table->text('recommendation')->nullable();
            $table->text('root_cause')->nullable();
            $table->enum('status', ['open', 'in_progress', 'closed'])->default('open');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ami_findings');
    }
};
