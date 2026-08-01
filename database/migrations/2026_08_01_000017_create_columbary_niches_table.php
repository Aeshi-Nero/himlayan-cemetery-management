<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('columbary_niches', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('niche_number')->index();
            $table->string('section')->nullable();
            $table->string('row')->nullable();
            $table->string('tier')->nullable();
            $table->enum('status', ['available', 'reserved', 'occupied'])->default('available');
            $table->decimal('price', 12, 2)->default(0);
            $table->decimal('map_x', 10, 7)->nullable();
            $table->decimal('map_y', 10, 7)->nullable();
            $table->string('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('columbary_niches');
    }
};
