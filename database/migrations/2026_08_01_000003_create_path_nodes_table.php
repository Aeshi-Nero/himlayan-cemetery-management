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
        Schema::create('path_nodes', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->decimal('lat', 10, 7);
            $table->decimal('lng', 10, 7);
            $table->string('node_label')->nullable();
            $table->boolean('is_accessible')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('path_nodes');
    }
};
