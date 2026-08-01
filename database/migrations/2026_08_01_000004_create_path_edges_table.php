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
        Schema::create('path_edges', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('from_node_id');
            $table->string('to_node_id');
            $table->unsignedInteger('distance_weight')->default(0);
            $table->string('pathway_name')->nullable();
            $table->timestamps();

            $table->foreign('from_node_id')->references('id')->on('path_nodes')->cascadeOnDelete();
            $table->foreign('to_node_id')->references('id')->on('path_nodes')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('path_edges');
    }
};
