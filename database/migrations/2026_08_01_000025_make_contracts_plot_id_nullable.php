<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropForeign(['plot_id']);
            $table->string('plot_id')->nullable()->change();
            $table->foreign('plot_id')->references('id')->on('plots')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropForeign(['plot_id']);
            $table->string('plot_id')->nullable(false)->change();
            $table->foreign('plot_id')->references('id')->on('plots')->cascadeOnDelete();
        });
    }
};
