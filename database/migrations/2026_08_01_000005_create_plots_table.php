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
        Schema::create('plots', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('plot_number');
            $table->string('section', 5);
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lng', 10, 7)->nullable();
            $table->enum('lot_type', ['single', 'family', 'apartment', 'path', 'border', 'entrance'])->default('single');
            $table->unsignedInteger('capacity')->default(1);
            $table->unsignedInteger('current_occupants')->default(0);
            $table->enum('status', ['available', 'reserved', 'occupied', 'full'])->default('available');
            $table->decimal('price', 12, 2)->nullable();
            $table->string('nearest_path_node_id')->nullable();
            $table->text('notes')->nullable();
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->unsignedInteger('rotation')->nullable();
            $table->string('color')->nullable();
            $table->string('cemetery_id')->nullable();
            $table->json('deceased_names')->nullable();
            $table->dateTime('burial_date')->nullable();
            $table->string('burial_time')->nullable();
            $table->string('inquirer_name')->nullable();
            $table->string('deceased_name')->nullable();
            $table->timestamps();

            $table->index(['section', 'status']);
            $table->index('plot_number');
            $table->foreign('nearest_path_node_id')->references('id')->on('path_nodes')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plots');
    }
};
