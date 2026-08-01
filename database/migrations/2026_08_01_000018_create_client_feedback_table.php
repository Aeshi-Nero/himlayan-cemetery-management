<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_feedback', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('client_id');
            $table->string('contract_id')->nullable();
            $table->unsignedTinyInteger('rating')->default(5);
            $table->text('comments')->nullable();
            $table->enum('status', ['pending', 'submitted'])->default('submitted');
            $table->dateTime('submitted_at')->nullable();
            $table->timestamps();

            $table->foreign('client_id')->references('id')->on('clients')->cascadeOnDelete();
            $table->foreign('contract_id')->references('id')->on('contracts')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_feedback');
    }
};
