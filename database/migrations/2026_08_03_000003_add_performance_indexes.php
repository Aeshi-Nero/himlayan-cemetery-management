<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add indexes for the queries that run on every read-heavy endpoint.
     */
    public function up(): void
    {
        // Activity log pruning sorts by created_at on every write.
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->index('created_at');
        });

        // syncReservedToOccupied() scans status='reserved' with a burial_date cut-off.
        Schema::table('plots', function (Blueprint $table) {
            $table->index(['status', 'burial_date']);
        });

        // Audit listing orders by created_at.
        Schema::table('inquiries', function (Blueprint $table) {
            $table->index('created_at');
            $table->index('client_id');
            $table->index('plot_id');
        });

        Schema::table('contracts', function (Blueprint $table) {
            $table->index('created_at');
            $table->index('client_id');
            $table->index('plot_id');
        });

        Schema::table('burials', function (Blueprint $table) {
            $table->index('created_at');
            $table->index('plot_id');
            $table->index('contract_id');
            $table->index('burial_status');
            $table->index('burial_date');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->index('created_at');
            $table->index('contract_id');
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->index('created_at');
        });

        Schema::table('cemetery_maps', function (Blueprint $table) {
            $table->index('created_at');
        });

        // Pathfinding graph edges are joined by node ids on every walk.
        Schema::table('path_edges', function (Blueprint $table) {
            $table->index('from_node_id');
            $table->index('to_node_id');
        });

        // User notification inbox queries by user_id + created_at.
        Schema::table('notifications', function (Blueprint $table) {
            $table->index(['user_id', 'is_read', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
        });

        Schema::table('plots', function (Blueprint $table) {
            $table->dropIndex(['status', 'burial_date']);
        });

        Schema::table('inquiries', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
            $table->dropIndex(['client_id']);
            $table->dropIndex(['plot_id']);
        });

        Schema::table('contracts', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
            $table->dropIndex(['client_id']);
            $table->dropIndex(['plot_id']);
        });

        Schema::table('burials', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
            $table->dropIndex(['plot_id']);
            $table->dropIndex(['contract_id']);
            $table->dropIndex(['burial_status']);
            $table->dropIndex(['burial_date']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
            $table->dropIndex(['contract_id']);
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
        });

        Schema::table('cemetery_maps', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
        });

        Schema::table('path_edges', function (Blueprint $table) {
            $table->dropIndex(['from_node_id']);
            $table->dropIndex(['to_node_id']);
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'is_read', 'created_at']);
        });
    }
};
