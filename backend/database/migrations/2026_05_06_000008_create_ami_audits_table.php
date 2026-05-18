<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ami_audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ppepp_cycle_id')->constrained()->cascadeOnDelete();
            $table->foreignId('org_unit_id')->constrained('org_units')->cascadeOnDelete();
            $table->date('audit_date')->nullable();
            $table->enum('status', ['draft', 'in_review', 'approved', 'closed'])->default('draft');
            $table->decimal('score', 5, 2)->nullable();
            $table->text('finding_summary')->nullable();
            $table->foreignId('lead_auditor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ami_audits');
    }
};
