<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\ColumbaryNiche;
use App\Models\Contract;
use App\Models\Plot;
use App\Models\PreNeedPlan;
use App\Notifications\ContractApproved;
use App\Notifications\ContractReleased;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ContractController extends Controller
{
    public function index(): JsonResponse
    {
        $contracts = Contract::with(['client', 'plot', 'preNeedPlan', 'columbaryNiche'])
            ->orderByDesc('created_at')
            ->get()
            ->each(function (Contract $contract, int $idx) {
                if (! $contract->contract_number) {
                    $contract->contract_number = 'HMC-2026-'.(1000 + $idx);
                    $contract->save();
                }
            });

        return response()->json(['success' => true, 'data' => $contracts]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'client_id' => ['required', 'string', 'exists:clients,id'],
            'plot_id' => ['nullable', 'string', 'exists:plots,id'],
            'pre_need_plan_id' => ['nullable', 'string', 'exists:pre_need_plans,id'],
            'columbary_niche_id' => ['nullable', 'string', 'exists:columbary_niches,id'],
            'contract_date' => ['nullable', 'date'],
            'contract_type' => ['required', 'string', 'in:new,renewal'],
            'ordinance_period' => ['nullable', 'string', 'in:pre_2002,2002_2013,2013_present'],
            'lot_type' => ['nullable', 'string', 'in:individual,family'],
            'lot_area' => ['nullable', 'numeric', 'min:0'],
            'dimension' => ['nullable', 'string'],
            'total_amount' => ['nullable', 'numeric', 'min:0'],
            'payment_type' => ['nullable', 'string', 'in:cash,installment'],
            'installments' => ['nullable', 'integer', 'min:2', 'max:60'],
            'death_certificate_number' => ['nullable', 'string'],
            'af_51_number' => ['nullable', 'string'],
            'af_51_date' => ['nullable', 'date'],
        ]);

        $contract = Contract::create([
            'id' => 'ctr-'.Str::uuid(),
            'contract_number' => 'HMC-2026-'.random_int(1000, 9999),
            'client_id' => $data['client_id'],
            'plot_id' => $data['plot_id'] ?? null,
            'pre_need_plan_id' => $data['pre_need_plan_id'] ?? null,
            'columbary_niche_id' => $data['columbary_niche_id'] ?? null,
            'contract_date' => $data['contract_date'] ?? now()->toDateString(),
            'contract_type' => $data['contract_type'],
            'ordinance_period' => $data['ordinance_period'] ?? null,
            'lot_type' => $data['lot_type'] ?? null,
            'lot_area' => $data['lot_area'] ?? null,
            'dimension' => $data['dimension'] ?? null,
            'commencement_date' => now()->toDateString(),
            'expiration_date' => now()->addYears(30)->toDateString(),
            'total_amount' => $data['total_amount'] ?? 0,
            'payment_type' => $data['payment_type'] ?? 'cash',
            'status' => 'draft',
            'prepared_by' => $request->user()?->id,
            'death_certificate_number' => $data['death_certificate_number'] ?? null,
            'af_51_number' => $data['af_51_number'] ?? null,
            'af_51_date' => $data['af_51_date'] ?? null,
            'amount_paid' => 0,
            'balance_remaining' => $data['total_amount'] ?? 0,
        ]);

        if ($contract->lot_type && $contract->ordinance_period && $contract->total_amount && $contract->canTransitionTo(Contract::STATUS_RENTAL_COMPUTED)) {
            $contract->markRentalComputed();
        }

        if (($data['payment_type'] ?? 'cash') === 'installment') {
            $installments = $data['installments'] ?? 12;
            $monthly = ($data['total_amount'] ?? 0) / $installments;
            for ($i = 1; $i <= $installments; $i++) {
                $contract->installmentSchedules()->create([
                    'id' => 'sch-'.Str::uuid(),
                    'due_date' => now()->addMonths($i)->format('Y-m-d'),
                    'amount_due' => round($monthly, 2),
                    'amount_paid' => 0,
                    'status' => 'unpaid',
                ]);
            }
        }

        if ($contract->plot_id) {
            Plot::where('id', $contract->plot_id)->update(['status' => 'reserved']);
        }
        if ($contract->columbary_niche_id) {
            ColumbaryNiche::where('id', $contract->columbary_niche_id)->update(['status' => 'reserved']);
        }

        ActivityLog::record('CREATE_CONTRACT', 'Contracts', "Created contract {$contract->id} for plot {$contract->plot?->plot_number}", $request);

        return response()->json(['success' => true, 'data' => $contract->load(['client', 'plot', 'preNeedPlan', 'columbaryNiche', 'installmentSchedules'])]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $contract = Contract::find($id);

        if (! $contract) {
            return response()->json(['success' => false, 'error' => 'Contract not found'], 404);
        }

        $data = $request->validate([
            'plot_id' => ['nullable', 'string', 'exists:plots,id'],
            'pre_need_plan_id' => ['nullable', 'string', 'exists:pre_need_plans,id'],
            'columbary_niche_id' => ['nullable', 'string', 'exists:columbary_niches,id'],
            'contract_type' => ['nullable', 'string', 'in:new,renewal'],
            'ordinance_period' => ['nullable', 'string', 'in:pre_2002,2002_2013,2013_present'],
            'lot_type' => ['nullable', 'string', 'in:individual,family'],
            'lot_area' => ['nullable', 'numeric', 'min:0'],
            'dimension' => ['nullable', 'string'],
            'total_amount' => ['nullable', 'numeric', 'min:0'],
            'payment_type' => ['nullable', 'string', 'in:cash,installment'],
            'installments' => ['nullable', 'integer', 'min:2', 'max:60'],
            'death_certificate_number' => ['nullable', 'string'],
            'af_51_number' => ['nullable', 'string'],
            'af_51_date' => ['nullable', 'date'],
        ]);

        $contract->fill($data);
        $contract->save();

        if ($contract->lot_type && $contract->ordinance_period && $contract->total_amount && $contract->canTransitionTo(Contract::STATUS_RENTAL_COMPUTED)) {
            $contract->markRentalComputed();
        }

        ActivityLog::record('UPDATE_CONTRACT', 'Contracts', "Updated contract {$id} status to {$contract->status}", $request);

        return response()->json(['success' => true, 'data' => $contract->load(['client', 'plot'])]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $contract = Contract::find($id);

        if (! $contract) {
            return response()->json(['success' => false, 'error' => 'Contract not found'], 404);
        }

        $reference = $contract->contract_number ?? $contract->id;

        ActivityLog::record('DELETE_CONTRACT', 'Contracts', "Deleted contract {$reference}", $request);

        $contract->delete();

        return response()->json(['success' => true]);
    }

    public function approveTreasurer(Request $request, string $id): JsonResponse
    {
        $contract = Contract::find($id);

        if (! $contract) {
            return response()->json(['success' => false, 'error' => 'Contract not found'], 404);
        }

        if ($contract->status !== Contract::STATUS_PENDING_APPROVAL) {
            return response()->json([
                'success' => false,
                'error' => 'Contract must be submitted for approval (pending_approval) before Treasurer verification.',
            ], 422);
        }

        $contract->update(['approved_by_treasurer_at' => now()]);

        if ($contract->client) {
            $contract->client->notify(new ContractApproved($contract, 'treasurer'));
        }

        ActivityLog::record('APPROVE_CONTRACT', 'Contracts', "Verified Treasurer signature for contract {$contract->contract_number}", $request);

        return response()->json(['success' => true, 'data' => $contract->load(['client', 'plot'])]);
    }

    public function approveMayor(Request $request, string $id): JsonResponse
    {
        $contract = Contract::find($id);

        if (! $contract) {
            return response()->json(['success' => false, 'error' => 'Contract not found'], 404);
        }

        if ($contract->status !== Contract::STATUS_PENDING_APPROVAL) {
            return response()->json([
                'success' => false,
                'error' => 'Contract must be submitted for approval (pending_approval) before Mayor verification.',
            ], 422);
        }

        if (! $contract->approved_by_treasurer_at) {
            return response()->json([
                'success' => false,
                'error' => 'Treasurer must verify the contract before the Mayor.',
            ], 422);
        }

        $contract->update(['approved_by_mayor_at' => now()]);
        $contract->markApproved();

        if ($contract->client) {
            $contract->client->notify(new ContractApproved($contract, 'mayor'));
        }

        ActivityLog::record('APPROVE_CONTRACT', 'Contracts', "Verified Mayor signature for contract {$contract->contract_number}", $request);

        return response()->json(['success' => true, 'data' => $contract->load(['client', 'plot'])]);
    }

    /**
     * Generate the printable contract from the recorded payment
     * (AF-51 / OR number / OR date / amount) and submit it for approval.
     */
    public function generate(Request $request, string $id): JsonResponse
    {
        $contract = Contract::find($id);

        if (! $contract) {
            return response()->json(['success' => false, 'error' => 'Contract not found'], 404);
        }

        if ($contract->status !== Contract::STATUS_PAID) {
            return response()->json([
                'success' => false,
                'error' => 'Contract must be paid before the printable contract can be generated.',
            ], 422);
        }

        $payment = $contract->payments()->orderByDesc('payment_date')->first();

        if (! $payment) {
            return response()->json([
                'success' => false,
                'error' => 'No payment record found to generate the contract from.',
            ], 422);
        }

        $contract->fill([
            'af_51_number' => $payment->af_51_number ?? $contract->af_51_number,
            'af_51_date' => $payment->af_51_date ?? $contract->af_51_date,
            'amount_paid' => (float) $contract->amount_paid,
            'balance_remaining' => max(0, (float) $contract->total_amount - (float) $contract->amount_paid),
        ])->save();

        $contract->submitForApproval();

        ActivityLog::record('GENERATE_CONTRACT', 'Contracts', "Generated printable contract {$contract->contract_number} from OR {$payment->receipt_number}", $request);

        return response()->json(['success' => true, 'data' => $contract->load(['client', 'plot', 'preNeedPlan', 'columbaryNiche', 'payments', 'installmentSchedules'])]);
    }

    /**
     * Release an approved contract to the client (RCC only).
     */
    public function release(Request $request, string $id): JsonResponse
    {
        $contract = Contract::find($id);

        if (! $contract) {
            return response()->json(['success' => false, 'error' => 'Contract not found'], 404);
        }

        $user = $request->user();

        if (! $user || (! $user->isRcc() && ! $user->isSuperAdmin())) {
            return response()->json([
                'success' => false,
                'error' => 'Only the Records & Cemetery Clerk (RCC) may release contracts.',
            ], 403);
        }

        if ($contract->status !== Contract::STATUS_APPROVED) {
            return response()->json([
                'success' => false,
                'error' => 'Only approved contracts can be released.',
            ], 422);
        }

        $contract->markReleased();

        if ($contract->client) {
            $contract->client->notify(new ContractReleased($contract));
        }

        ActivityLog::record('RELEASE_CONTRACT', 'Contracts', "Released contract {$contract->contract_number} to the client", $request);

        return response()->json(['success' => true, 'data' => $contract->load(['client', 'plot'])]);
    }
}
