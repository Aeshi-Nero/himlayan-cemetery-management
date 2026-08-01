<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\BurialPermit;
use App\Models\Contract;
use App\Notifications\BurialPermitIssued;
use App\Services\RentalComputationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BurialPermitController extends Controller
{
    public function index(): JsonResponse
    {
        $permits = BurialPermit::with(['contract.client', 'issuedBy'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['success' => true, 'data' => $permits]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'contract_id' => ['required', 'string', 'exists:contracts,id'],
            'deceased_name' => ['required', 'string', 'max:255'],
            'date_of_birth' => ['nullable', 'date'],
            'date_of_death' => ['required', 'date'],
            'death_certificate_number' => ['nullable', 'string', 'max:100'],
            'burial_permit_fee' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $contract = Contract::findOrFail($data['contract_id']);

        if ($contract->isReleased() || $contract->status === Contract::STATUS_CANCELLED) {
            return response()->json([
                'success' => false,
                'error' => 'Burial permits cannot be issued for released or cancelled contracts.',
            ], 422);
        }

        $count = BurialPermit::count() + 1;
        $data['id'] = 'prm-'.Str::uuid();
        $data['permit_number'] = 'AF58-'.str_pad((string) $count, 6, '0', STR_PAD_LEFT);
        $data['issued_by'] = $request->user()?->id;
        $data['issued_at'] = now();
        $data['status'] = 'issued';

        $permit = BurialPermit::create($data);

        if ($contract->status === Contract::STATUS_DRAFT) {
            $contract->markPermitIssued();
        }

        $contract->update(['death_certificate_number' => $data['death_certificate_number'] ?? $contract->death_certificate_number]);

        if ($contract->client) {
            $contract->client->notify(new BurialPermitIssued($permit));
        }

        ActivityLog::record('ISSUE_BURIAL_PERMIT', 'Burial Permits', "Issued Burial Permit {$permit->permit_number} for {$permit->deceased_name}", $request);

        return response()->json(['success' => true, 'data' => $permit->load(['contract.client', 'issuedBy'])]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $permit = BurialPermit::find($id);

        if (! $permit) {
            return response()->json(['success' => false, 'error' => 'Burial permit not found'], 404);
        }

        $permit->fill($request->only([
            'contract_id',
            'deceased_name',
            'date_of_birth',
            'date_of_death',
            'death_certificate_number',
            'burial_permit_fee',
            'status',
            'notes',
        ]));
        $permit->save();

        ActivityLog::record('UPDATE_BURIAL_PERMIT', 'Burial Permits', "Updated burial permit {$permit->permit_number}", $request);

        return response()->json(['success' => true, 'data' => $permit->load(['contract.client', 'issuedBy'])]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $permit = BurialPermit::find($id);

        if (! $permit) {
            return response()->json(['success' => false, 'error' => 'Burial permit not found'], 404);
        }

        $reference = $permit->permit_number ?? $permit->id;

        ActivityLog::record('DELETE_BURIAL_PERMIT', 'Burial Permits', "Deleted burial permit {$reference}", $request);

        $permit->delete();

        return response()->json(['success' => true]);
    }

    public function computeRental(Request $request, RentalComputationService $service): JsonResponse
    {
        $data = $request->validate([
            'contract_type' => ['required', 'string', 'in:new,renewal'],
            'ordinance_period' => ['nullable', 'string', 'in:pre_2002,2002_2013,2013_present'],
            'lot_type' => ['required', 'string', 'in:individual,family'],
            'area' => ['nullable', 'numeric', 'min:0'],
        ]);

        if ($data['contract_type'] === 'new') {
            return response()->json([
                'success' => true,
                'data' => [
                    'type' => 'new',
                    'fee' => RentalComputationService::NEW_LOT_FEE,
                    'years' => 10,
                    'breakdown' => 'New lot fee: ₱'.number_format(RentalComputationService::NEW_LOT_FEE, 2),
                ],
            ]);
        }

        $period = $data['ordinance_period'] ?? '2013_present';

        $result = $service->computeRenewalByOrdinance(
            $period,
            $data['lot_type'],
            $data['area'] ?? null,
            10
        );

        return response()->json(['success' => true, 'data' => $result]);
    }
}
