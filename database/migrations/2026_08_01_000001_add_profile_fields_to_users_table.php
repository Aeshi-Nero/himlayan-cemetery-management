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
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['super_admin', 'rcc', 'engineer', 'staff'])
                ->default('staff')
                ->after('email');
            $table->boolean('is_active')->default(true)->after('role');
            $table->string('department')->nullable()->after('is_active');
            $table->string('phone')->nullable()->after('department');
            $table->string('address')->nullable()->after('phone');
            $table->string('avatar')->nullable()->after('address');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'is_active', 'department', 'phone', 'address', 'avatar']);
        });
    }
};
