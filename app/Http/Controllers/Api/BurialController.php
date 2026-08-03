<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Burial;
use App\Models\Plot;
use App\Notifications\BurialScheduled;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BurialController extends Controller
{
    /** Whitelist of fields the update endpoint is allowed to change. */
    private const UPDATABLE_FIELDS = [
        'plot_id',
        'contract_id',
        'deceased_name',
        'date_of_birth',
        'date_of_death',
        'burial_date',
        'burial_status',
        'notes',
    ];

    public function index(): JsonResponse
    {
        $burials = Burial::with(['plot', 'contract'])->orderByDesc('created_at')->get();

        return response()->json(['success' => true, 'data' => $burials]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'plot_id' => ['required', 'string', 'exists:plots,id'],
            'contract_id' => ['nullable', 'string', 'exists:contracts,id'],
            'deceased_name' => ['required', 'string'],
            'date_of_birth' => ['nullable', 'date'],
            'date_of_death' => ['nullable', 'date'],
            'burial_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $burial = Burial::create([
            'id' => 'bur-'.Str::uuid(),
            'plot_id' => $data['plot_id'],
            'contract_id' => $data['contract_id'] ?? 'ctr-1',
            'deceased_name' => $data['deceased_name'],
            'date_of_birth' => $data['date_of_birth'] ?? null,
            'date_of_death' => $data['date_of_death'] ?? null,
            'burial_date' => $data['burial_date'],
            'burial_status' => 'scheduled',
            'scheduled_by' => $request->user()?->id,
            'notes' => $data['notes'] ?? null,
        ]);

        $plot = Plot::find($data['plot_id']);
        if ($plot) {
            $plot->current_occupants += 1;
            $plot->status = $plot->current_occupants >= $plot->capacity ? 'full' : 'occupied';
            $plot->save();
        }

        if ($burial->contract?->client) {
            $burial->contract->client->notify(new BurialScheduled($burial));
        }

        ActivityLog::record('SCHEDULE_BURIAL', 'Burials', "Scheduled burial for {$burial->deceased_name} in Plot {$plot?->plot_number}", $request);

        return response()->json(['success' => true, 'data' => $burial->load(['plot', 'contract'])]);
    }

    public function approve(Request $request, string $id): JsonResponse
    {
        $burial = Burial::find($id);

        if (! $burial) {
            return response()->json(['success' => false, 'error' => 'Burial record not found'], 404);
        }

        $burial->update([
            'burial_status' => 'completed',
            'approved_at' => now(),
        ]);

        ActivityLog::record('APPROVE_BURIAL', 'Burials', "Approved burial for {$burial->deceased_name}", $request);

        return response()->json(['success' => true, 'data' => $burial->load(['plot', 'contract'])]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $burial = Burial::find($id);

        if (! $burial) {
            return response()->json(['success' => false, 'error' => 'Burial record not found'], 404);
        }

        $data = $request->validate([
            'plot_id' => ['sometimes', 'string', 'exists:plots,id'],
            'contract_id' => ['sometimes', 'nullable', 'string', 'exists:contracts,id'],
            'deceased_name' => ['sometimes', 'string'],
            'date_of_birth' => ['sometimes', 'nullable', 'date'],
            'date_of_death' => ['sometimes', 'nullable', 'date'],
            'burial_date' => ['sometimes', 'date'],
            'burial_status' => ['sometimes', 'string', 'in:scheduled,completed,cancelled'],
            'notes' => ['sometimes', 'nullable', 'string'],
        ]);

        $burial->fill(array_intersect_key($data, array_flip(self::UPDATABLE_FIELDS)));
        $burial->save();

        ActivityLog::record('UPDATE_BURIAL', 'Burials', "Updated burial record {$id}", $request);

        return response()->json(['success' => true, 'data' => $burial->load(['plot', 'contract'])]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $burial = Burial::find($id);

        if (! $burial) {
            return response()->json(['success' => false, 'error' => 'Burial record not found'], 404);
        }

        $plot = Plot::find($burial->plot_id);
        if ($plot) {
            $plot->current_occupants = max(0, (int) $plot->current_occupants - 1);
            $plot->status = $plot->current_occupants === 0 ? 'available' : 'occupied';
            $plot->save();
        }

        ActivityLog::record('DELETE_BURIAL', 'Burials', "Deleted burial record for {$burial->deceased_name}", $request);

        $burial->delete();

        return response()->json(['success' => true]);
    }
}
