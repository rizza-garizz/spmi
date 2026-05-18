<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('spmi_documents', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('title');
            $table->enum('type', [
                'kebijakan',
                'pedoman',
                'standar',
                'tata_cara',
                'panduan_ami',
                'laporan_ami',
                'laporan_rtm',
                'laporan_rtl',
                'survei',
                'lkpt',
                'lkps',
                'sop',
                'bukti'
            ]);
            $table->foreignId('mutu_standard_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('org_unit_id')->nullable()->constrained('org_units')->nullOnDelete();
            $table->enum('status', ['draft', 'review', 'approved', 'archived'])->default('draft');
            $table->string('current_version')->default('1.0');
            $table->unsignedBigInteger('current_version_id')->nullable();
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spmi_documents');
    }
};
