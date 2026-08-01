<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->string('pre_need_plan_id')->nullable()->after('plot_id');
            $table->string('columbary_niche_id')->nullable()->after('pre_need_plan_id');
            $table->enum('ordinance_period', ['pre_2002', '2002_2013', '2013_present'])->nullable()->after('payment_type');
            $table->enum('lot_type', ['individual', 'family'])->nullable()->after('ordinance_period');
            $table->decimal('lot_area', 10, 2)->nullable()->after('lot_type');
            $table->string('dimension')->nullable()->after('lot_area');
            $table->string('af_51_number')->nullable()->after('death_certificate_number');
            $table->date('af_51_date')->nullable()->after('af_51_number');
            $table->dateTime('approved_by_treasurer_at')->nullable()->after('af_51_date');
            $table->dateTime('approved_by_mayor_at')->nullable()->after('approved_by_treasurer_at');

            $table->foreign('pre_need_plan_id')->references('id')->on('pre_need_plans')->nullOnDelete();
            $table->foreign('columbary_niche_id')->references('id')->on('columbary_niches')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropForeign(['pre_need_plan_id']);
            $table->dropForeign(['columbary_niche_id']);
            $table->dropColumn([
                'pre_need_plan_id',
                'columbary_niche_id',
                'ordinance_period',
                'lot_type',
                'lot_area',
                'dimension',
                'af_51_number',
                'af_51_date',
                'approved_by_treasurer_at',
                'approved_by_mayor_at',
            ]);
        });
    }
};
