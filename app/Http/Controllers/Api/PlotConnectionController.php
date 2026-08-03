<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\PlotConnection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PlotConnectionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = PlotConnection::query();

        if ($cemeteryId = $request->query('cemetery_id')) {
            $query->where('cemetery_id', $cemeteryId);
        }

        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    public function sync(Request $request): JsonResponse
    {
        $data = $request->validate([
            'cemetery_id' => ['nullable', 'string'],
            'connections' => ['required', 'array'],
            'connections.*.fromId' => ['required', 'string'],
            'connections.*.toId' => ['required', 'string'],
        ]);

        $cemeteryId = $data['cemetery_id'] ?? 'default-himlayan';

        PlotConnection::where('cemetery_id', $cemeteryId)->delete();

        $created = [];

        foreach ($data['connections'] as $conn) {
            if ($conn['fromId'] === $conn['toId']) {
                continue;
            }

            $created[] = PlotConnection::create([
                'id' => 'pc-'.Str::uuid(),
                'cemetery_id' => $cemeteryId,
                'from_plot_id' => $conn['fromId'],
                'to_plot_id' => $conn['toId'],
            ]);
        }

        ActivityLog::record('SYNC_PLOT_CONNECTIONS', 'Plots', "Synced ".count($created)." connections for cemetery {$cemeteryId}", $request);

        return response()->json(['success' => true, 'data' => $created]);
    }
}
