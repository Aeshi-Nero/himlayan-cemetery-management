<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\CemeteryMap;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class CemeteryMapController extends Controller
{
    private const CACHE_KEY = 'cemetery_maps.public';

    private const CACHE_TTL_SECONDS = 3600;

    public function show(): JsonResponse
    {
        $maps = Cache::remember(self::CACHE_KEY, self::CACHE_TTL_SECONDS, function () {
            return CemeteryMap::orderByDesc('created_at')->get()->toArray();
        });

        return response()->json(['success' => true, 'data' => $maps]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'boundary_data' => ['nullable', 'array'],
            'cemetery_id' => ['nullable', 'string'],
        ]);

        $cemeteryId = $data['cemetery_id'] ?? null;

        $previous = CemeteryMap::orderByDesc('created_at')->first();

        $map = $cemeteryId
            ? CemeteryMap::where('cemetery_id', $cemeteryId)
                ->orWhere('id', $cemeteryId)
                ->latest('created_at')
                ->first()
            : null;

        if ($map) {
            $map->update([
                'name' => $data['name'] ?? $map->name,
                'description' => $data['description'] ?? $map->description,
                'boundary_data' => $data['boundary_data'] ?? $map->boundary_data ?? [],
            ]);
        } else {
            $map = CemeteryMap::create([
                'id' => 'map-'.Str::uuid(),
                'cemetery_id' => $cemeteryId,
                'name' => $data['name'] ?? $previous?->name ?? 'Himlayan Memorial Park Master Boundary',
                'description' => $data['description'] ?? $previous?->description,
                'boundary_data' => $data['boundary_data'] ?? $previous?->boundary_data ?? [],
                'created_by' => $request->user()?->id,
            ]);
        }

        $map->refresh();

        Cache::forget(self::CACHE_KEY);

        ActivityLog::record('UPDATE_MAP', 'Map', 'Updated cemetery boundary map GeoJSON.', $request);

        return response()->json(['success' => true, 'data' => $map]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $data = $request->validate([
            'cemetery_id' => ['required', 'string'],
        ]);

        $deletedMaps = CemeteryMap::where('cemetery_id', $data['cemetery_id'])
            ->orWhere('id', $data['cemetery_id'])
            ->delete();

        \App\Models\PlotConnection::where('cemetery_id', $data['cemetery_id'])->delete();

        Cache::forget(self::CACHE_KEY);

        ActivityLog::record('DELETE_MAP', 'Map', 'Deleted cemetery identity '.$data['cemetery_id'].'.', $request);

        return response()->json(['success' => true, 'deleted' => $deletedMaps]);
    }
}
