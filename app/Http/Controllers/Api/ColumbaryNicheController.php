<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\ColumbaryNiche;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ColumbaryNicheController extends Controller
{
    public function index(): JsonResponse
    {
        $niches = ColumbaryNiche::withCount('contracts')
            ->orderBy('section')
            ->orderBy('row')
            ->orderBy('tier')
            ->get();

        return response()->json(['success' => true, 'data' => $niches]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'niche_number' => ['required', 'string', 'max:50', 'unique:columbary_niches,niche_number'],
            'section' => ['nullable', 'string', 'max:100'],
            'row' => ['nullable', 'string', 'max:50'],
            'tier' => ['nullable', 'string', 'max:20'],
            'status' => ['nullable', 'string', 'in:available,reserved,occupied'],
            'price' => ['required', 'numeric', 'min:0'],
            'map_x' => ['nullable', 'numeric'],
            'map_y' => ['nullable', 'numeric'],
            'notes' => ['nullable', 'string'],
        ]);

        $data['id'] = 'niche-'.Str::uuid();
        $data['status'] = $data['status'] ?? 'available';

        $niche = ColumbaryNiche::create($data);

        ActivityLog::record('CREATE_NICHE', 'Columbary Niches', "Created columbary niche {$niche->niche_number}", $request);

        return response()->json(['success' => true, 'data' => $niche]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $niche = ColumbaryNiche::find($id);

        if (! $niche) {
            return response()->json(['success' => false, 'error' => 'Niche not found'], 404);
        }

        $data = $request->validate([
            'niche_number' => ['required', 'string', 'max:50', 'unique:columbary_niches,niche_number,'.$niche->id],
            'section' => ['nullable', 'string', 'max:100'],
            'row' => ['nullable', 'string', 'max:50'],
            'tier' => ['nullable', 'string', 'max:20'],
            'status' => ['nullable', 'string', 'in:available,reserved,occupied'],
            'price' => ['required', 'numeric', 'min:0'],
            'map_x' => ['nullable', 'numeric'],
            'map_y' => ['nullable', 'numeric'],
            'notes' => ['nullable', 'string'],
        ]);

        $niche->update($data);

        ActivityLog::record('UPDATE_NICHE', 'Columbary Niches', "Updated columbary niche {$niche->niche_number}", $request);

        return response()->json(['success' => true, 'data' => $niche]);
    }

    public function updatePosition(Request $request, string $id): JsonResponse
    {
        $niche = ColumbaryNiche::find($id);

        if (! $niche) {
            return response()->json(['success' => false, 'error' => 'Niche not found'], 404);
        }

        $data = $request->validate([
            'map_x' => ['required', 'numeric'],
            'map_y' => ['required', 'numeric'],
        ]);

        $niche->update(['map_x' => $data['map_x'], 'map_y' => $data['map_y']]);

        return response()->json(['success' => true, 'data' => $niche]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $niche = ColumbaryNiche::find($id);

        if (! $niche) {
            return response()->json(['success' => false, 'error' => 'Niche not found'], 404);
        }

        if ($niche->contracts()->exists()) {
            return response()->json(['success' => false, 'error' => 'Cannot delete a niche with existing contracts.'], 422);
        }

        ActivityLog::record('DELETE_NICHE', 'Columbary Niches', "Deleted columbary niche {$niche->niche_number}", $request);

        $niche->delete();

        return response()->json(['success' => true]);
    }
}
