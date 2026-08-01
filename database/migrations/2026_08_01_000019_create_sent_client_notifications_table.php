<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sent_client_notifications', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('client_id');
            $table->string('type')->default('system');
            $table->enum('channel', ['database', 'mail'])->default('database');
            $table->string('subject');
            $table->text('body')->nullable();
            $table->string('reference_type')->nullable();
            $table->string('reference_id')->nullable();
            $table->enum('status', ['sent', 'failed'])->default('sent');
            $table->text('response')->nullable();
            $table->timestamps();

            $table->foreign('client_id')->references('id')->on('clients')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sent_client_notifications');
    }
};
