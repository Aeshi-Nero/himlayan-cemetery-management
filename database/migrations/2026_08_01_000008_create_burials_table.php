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
        Schema::create('burials', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('plot_id');
            $table->string('contract_id');
            $table->string('deceased_name');
            $table->date('date_of_birth')->nullable();
            $table->date('date_of_death')->nullable();
            $table->dateTime('burial_date');
            $table->enum('burial_status', ['scheduled', 'completed', 'cancelled'])->default('scheduled');
            $table->string('scheduled_by')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('plot_id')->references('id')->on('plots')->cascadeOnDelete();
            $table->foreign('contract_id')->references('id')->on('contracts')->cascadeOnDelete();
            $table->foreign('scheduled_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('burials');
    }
};
