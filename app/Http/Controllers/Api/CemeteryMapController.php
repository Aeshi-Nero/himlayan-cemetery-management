<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\CemeteryMap;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CemeteryMapController extends Controller
{
    public function show(): JsonResponse
    {
        $map = CemeteryMap::orderByDesc('created_at')->first();

        return response()->json(['success' => true, 'data' => $map]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'boundary_data' => ['nullable', 'array'],
        ]);

        $previous = CemeteryMap::orderByDesc('created_at')->first();

        $map = CemeteryMap::create([
            'id' => 'map-'.Str::uuid(),
            'name' => $data['name'] ?? $previous?->name ?? 'Himlayan Memorial Park Master Boundary',
            'description' => $data['description'] ?? $previous?->description,
            'boundary_data' => $data['boundary_data'] ?? $previous?->boundary_data ?? [],
            'created_by' => $request->user()?->id,
        ]);

        ActivityLog::record('UPDATE_MAP', 'Map', 'Updated Himlayan Cemetery boundary map GeoJSON.', $request);

        return response()->json(['success' => true, 'data' => $map]);
    }
}
