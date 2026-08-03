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
        Schema::create('plot_connections', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('cemetery_id')->nullable()->index();
            $table->string('from_plot_id');
            $table->string('to_plot_id');
            $table->timestamps();

            $table->foreign('from_plot_id')->references('id')->on('plots')->cascadeOnDelete();
            $table->foreign('to_plot_id')->references('id')->on('plots')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plot_connections');
    }
};
