<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Burial;
use App\Models\Contract;
use App\Models\Inquiry;
use App\Models\Payment;
use App\Models\Plot;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function show(): JsonResponse
    {
        Plot::syncReservedToOccupied();

        $totalPlots = Plot::count();
        $availablePlots = Plot::where('status', 'available')->count();
        $reservedPlots = Plot::where('status', 'reserved')->count();
        $occupiedPlots = Plot::whereIn('status', ['occupied', 'full'])->count();
        $totalRevenue = (float) Payment::sum('amount');

        $occupancyRate = $totalPlots > 0
            ? (int) round((($reservedPlots + $occupiedPlots) / $totalPlots) * 100)
            : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'totalPlots' => $totalPlots,
                'availablePlots' => $availablePlots,
                'reservedPlots' => $reservedPlots,
                'occupiedPlots' => $occupiedPlots,
                'occupancyRate' => $occupancyRate,
                'totalRevenue' => $totalRevenue,
                'pendingInquiries' => Inquiry::where('status', 'pending')->count(),
                'activeContracts' => Contract::whereNotIn('status', ['draft', 'cancelled'])->count(),
                'completedBurials' => Burial::where('burial_status', 'completed')->count(),
                'scheduledBurials' => Burial::where('burial_status', 'scheduled')->count(),
                'recentActivity' => ActivityLog::orderByDesc('created_at')->limit(10)->get(),
            ],
        ]);
    }
}
