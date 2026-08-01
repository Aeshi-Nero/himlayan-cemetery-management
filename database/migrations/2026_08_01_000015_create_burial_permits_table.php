<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('burial_permits', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('contract_id');
            $table->string('permit_number')->nullable()->index();
            $table->string('deceased_name');
            $table->date('date_of_birth')->nullable();
            $table->date('date_of_death');
            $table->string('death_certificate_number')->nullable();
            $table->decimal('burial_permit_fee', 12, 2)->default(0);
            $table->enum('status', ['issued', 'used', 'cancelled'])->default('issued');
            $table->string('issued_by')->nullable();
            $table->dateTime('issued_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('contract_id')->references('id')->on('contracts')->cascadeOnDelete();
            $table->foreign('issued_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('burial_permits');
    }
};
