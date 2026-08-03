<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cemetery_maps', function (Blueprint $table) {
            $table->string('cemetery_id')->nullable()->after('id');
            $table->index('cemetery_id');
        });
    }

    public function down(): void
    {
        Schema::table('cemetery_maps', function (Blueprint $table) {
            $table->dropIndex(['cemetery_id']);
            $table->dropColumn('cemetery_id');
        });
    }
};
