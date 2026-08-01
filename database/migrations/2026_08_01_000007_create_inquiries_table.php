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
        Schema::create('inquiries', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('client_id');
            $table->string('plot_id')->nullable();
            $table->string('full_name')->nullable();
            $table->string('contact_number')->nullable();
            $table->string('email')->nullable();
            $table->date('inquiry_date');
            $table->dateTime('requested_burial_date')->nullable();
            $table->string('deceased_name')->nullable();
            $table->text('message')->nullable();
            $table->enum('status', ['pending', 'contacted', 'approved', 'rejected', 'completed', 'closed'])->default('pending');
            $table->string('processed_by')->nullable();
            $table->dateTime('processed_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->foreign('client_id')->references('id')->on('clients')->cascadeOnDelete();
            $table->foreign('plot_id')->references('id')->on('plots')->nullOnDelete();
            $table->foreign('processed_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inquiries');
    }
};
