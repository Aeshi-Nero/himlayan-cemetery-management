<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MapUsageController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'count' => (int) Setting::get('map_usage_count', 0),
        ]);
    }

    public function increment(Request $request): JsonResponse
    {
        $count = (int) Setting::get('map_usage_count', 0) + 1;

        Setting::set('map_usage_count', $count);

        ActivityLog::record('MAP_USAGE', 'Map', "Worldwide map usage counter incremented to {$count}", $request);

        return response()->json(['success' => true, 'count' => $count]);
    }
}
