<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add the 'entrance' lot_type so engineer entrance nodes can be persisted.
     */
    public function up(): void
    {
        // SQLite stores enum as a CHECK constraint; rebuild the table via change().
        Schema::table('plots', function (Blueprint $table) {
            $table->enum('lot_type', ['single', 'family', 'apartment', 'path', 'border', 'entrance'])->default('single')->change();
        });
    }

    public function down(): void
    {
        Schema::table('plots', function (Blueprint $table) {
            $table->enum('lot_type', ['single', 'family', 'apartment', 'path', 'border'])->default('single')->change();
        });
    }
};
