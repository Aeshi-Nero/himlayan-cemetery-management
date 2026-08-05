<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Plot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PlotController extends Controller
{
    /** Maximum number of deceased-name stacks allowed on an apartment lot. */
    private const MAX_STACKS = 5;

    /** Whitelist of fields the update endpoint is allowed to change. */
    private const UPDATABLE_FIELDS = [
        'plot_number',
        'name',
        'section',
        'lat',
        'lng',
        'lot_type',
        'capacity',
        'current_occupants',
        'status',
        'price',
        'nearest_path_node_id',
        'notes',
        'width',
        'height',
        'rotation',
        'color',
        'cemetery_id',
        'deceased_names',
        'burial_date',
        'burial_time',
        'inquirer_name',
        'deceased_name',
    ];

    public function index(Request $request): JsonResponse
    {
        Plot::syncReservedToOccupied();

        $query = Plot::query();

        if ($section = $request->query('section')) {
            $query->where('section', strtoupper((string) $section));
        }
        if ($lotType = $request->query('lot_type')) {
            $query->where('lot_type', $lotType);
        }
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($minPrice = $request->query('minPrice')) {
            $query->where('price', '>=', (float) $minPrice);
        }
        if ($maxPrice = $request->query('maxPrice')) {
            $query->where('price', '<=', (float) $maxPrice);
        }
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('plot_number', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        $page = max(1, (int) $request->query('page', 1));
        $limit = min(max(1, (int) $request->query('limit', 100)), 10000);

        $paginator = $query->orderBy('plot_number')->paginate($limit, ['*'], 'page', $page);

        return response()->json([
            'success' => true,
            'data' => $paginator->items(),
            'pagination' => [
                'page' => $paginator->currentPage(),
                'limit' => $paginator->perPage(),
                'total' => $paginator->total(),
                'totalPages' => $paginator->lastPage(),
            ],
        ]);
    }

    public function show(string $idOrPlotNumber): JsonResponse
    {
        Plot::syncReservedToOccupied();

        $plot = Plot::where('id', $idOrPlotNumber)
            ->orWhere('plot_number', $idOrPlotNumber)
            ->first();

        if (! $plot) {
            return response()->json(['success' => false, 'error' => 'Plot not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $plot]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'plot_number' => ['required', 'string'],
            'name' => ['nullable', 'string'],
            'section' => ['required', 'string'],
            'lot_type' => ['required', 'string', 'in:single,family,apartment,path,border,entrance'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', 'string', 'in:available,reserved,occupied,full'],
            'lat' => ['nullable', 'numeric'],
            'lng' => ['nullable', 'numeric'],
            'notes' => ['nullable', 'string'],
            'width' => ['nullable', 'integer'],
            'height' => ['nullable', 'integer'],
            'rotation' => ['nullable', 'integer'],
            'cemetery_id' => ['nullable', 'string'],
        ]);

        $lotType = $data['lot_type'];
        $plot = Plot::create([
            'id' => $request->input('id') ?? 'plot-'.Str::uuid(),
            'plot_number' => $data['plot_number'],
            'name' => $data['name'] ?? null,
            'section' => $data['section'],
            'lot_type' => $lotType,
            'capacity' => $data['capacity'] ?? match ($lotType) {
                'single' => 1,
                'family' => 4,
                default => 8,
            },
            'current_occupants' => 0,
            'status' => $data['status'] ?? 'available',
            'price' => $data['price'] ?? 15000,
            'lat' => $data['lat'] ?? 14.6720,
            'lng' => $data['lng'] ?? 121.0410,
            'width' => $data['width'] ?? null,
            'height' => $data['height'] ?? null,
            'rotation' => $data['rotation'] ?? null,
            'cemetery_id' => $data['cemetery_id'] ?? null,
            'nearest_path_node_id' => 'node-1',
            'notes' => $data['notes'] ?? null,
        ]);

        ActivityLog::record('CREATE_PLOT', 'Plots', "Created plot {$plot->plot_number} in Section {$plot->section}", $request);

        return response()->json(['success' => true, 'data' => $plot]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $plot = Plot::find($id);

        if (! $plot) {
            return response()->json(['success' => false, 'error' => 'Plot not found'], 404);
        }

        $data = $request->validate([
            'plot_number' => ['sometimes', 'string'],
            'name' => ['sometimes', 'string'],
            'section' => ['sometimes', 'string'],
            'lat' => ['sometimes', 'numeric'],
            'lng' => ['sometimes', 'numeric'],
            'lot_type' => ['sometimes', 'string', 'in:single,family,apartment,path,border,entrance'],
            'capacity' => ['sometimes', 'integer', 'min:1'],
            'current_occupants' => ['sometimes', 'integer', 'min:0'],
            'status' => ['sometimes', 'string', 'in:available,reserved,occupied,full'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'nearest_path_node_id' => ['sometimes', 'string'],
            'notes' => ['sometimes', 'string'],
            'width' => ['sometimes', 'numeric'],
            'height' => ['sometimes', 'numeric'],
            'rotation' => ['sometimes', 'numeric'],
            'color' => ['sometimes', 'string'],
            'cemetery_id' => ['sometimes', 'string'],
            'deceased_names' => ['sometimes', 'array', 'max:'.self::MAX_STACKS],
            'deceased_names.*' => ['string'],
            'burial_date' => ['sometimes', 'nullable', 'date'],
            'burial_time' => ['sometimes', 'nullable', 'string'],
            'inquirer_name' => ['sometimes', 'string'],
            'deceased_name' => ['sometimes', 'string'],
        ]);

        // Enforce the stack ceiling on the persisted payload (defense in depth).
        if (isset($data['deceased_names'])) {
            $data['deceased_names'] = array_slice($data['deceased_names'], 0, self::MAX_STACKS);
        }

        $plot->fill(array_intersect_key($data, array_flip(self::UPDATABLE_FIELDS)));
        $plot->save();

        ActivityLog::record('UPDATE_PLOT', 'Plots', "Updated plot {$plot->plot_number} status/data", $request);

        return response()->json(['success' => true, 'data' => $plot->refresh()]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $plot = Plot::find($id);

        if (! $plot) {
            return response()->json(['success' => false, 'error' => 'Plot not found'], 404);
        }

        ActivityLog::record('DELETE_PLOT', 'Plots', "Deleted plot {$plot->plot_number} from Section {$plot->section}", $request);

        $plot->delete();

        return response()->json(['success' => true, 'data' => $plot]);
    }
}
