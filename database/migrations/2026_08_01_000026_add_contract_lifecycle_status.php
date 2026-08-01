<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->enum('status', [
                'draft',
                'permit_issued',
                'rental_computed',
                'paid',
                'pending_approval',
                'approved',
                'released',
                'active',
                'completed',
                'cancelled',
            ])->default('draft')->change();
        });

        $this->backfillStatuses();
    }

    /**
     * Infer a lifecycle status for legacy records so no existing
     * contract becomes invalid after the column change.
     */
    private function backfillStatuses(): void
    {
        DB::table('contracts')
            ->orderBy('id')
            ->select([
                'id',
                'status',
                'approved_by_treasurer_at',
                'approved_by_mayor_at',
                'lot_type',
                'ordinance_period',
                'total_amount',
            ])
            ->chunkById(200, function ($contracts) {
                foreach ($contracts as $contract) {
                    if (in_array($contract->status, ['draft', 'permit_issued', 'rental_computed', 'paid', 'pending_approval', 'approved', 'released'])) {
                        continue;
                    }

                    if ($contract->status === 'completed') {
                        DB::table('contracts')->where('id', $contract->id)->update(['status' => 'released']);
                        continue;
                    }

                    if ($contract->status === 'cancelled') {
                        continue;
                    }

                    $newStatus = $this->inferActiveStatus($contract);

                    if ($newStatus !== $contract->status) {
                        DB::table('contracts')->where('id', $contract->id)->update(['status' => $newStatus]);
                    }
                }
            });
    }

    private function inferActiveStatus(object $contract): string
    {
        if ($contract->approved_by_mayor_at) {
            return 'approved';
        }

        if ($contract->approved_by_treasurer_at) {
            return 'pending_approval';
        }

        if (DB::table('payments')->where('contract_id', $contract->id)->exists()) {
            return 'paid';
        }

        if (DB::table('burial_permits')->where('contract_id', $contract->id)->exists()) {
            return 'permit_issued';
        }

        if ($contract->lot_type && $contract->ordinance_period && $contract->total_amount) {
            return 'rental_computed';
        }

        return 'draft';
    }

    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->enum('status', ['active', 'completed', 'cancelled'])->default('active')->change();
        });
    }
};
