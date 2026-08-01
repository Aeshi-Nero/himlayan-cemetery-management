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
        Schema::create('contracts', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('contract_number')->nullable()->index();
            $table->string('client_id');
            $table->string('plot_id');
            $table->date('contract_date');
            $table->enum('contract_type', ['new', 'renewal'])->default('new');
            $table->date('commencement_date')->nullable();
            $table->date('expiration_date')->nullable();
            $table->decimal('total_amount', 12, 2);
            $table->enum('payment_type', ['cash', 'installment'])->default('cash');
            $table->enum('status', ['active', 'completed', 'cancelled'])->default('active');
            $table->string('prepared_by')->nullable();
            $table->dateTime('approved_by_superadmin_at')->nullable();
            $table->string('death_certificate_number')->nullable();
            $table->decimal('amount_paid', 12, 2)->default(0);
            $table->decimal('balance_remaining', 12, 2)->default(0);
            $table->timestamps();

            $table->foreign('client_id')->references('id')->on('clients')->cascadeOnDelete();
            $table->foreign('plot_id')->references('id')->on('plots')->cascadeOnDelete();
            $table->foreign('prepared_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};
