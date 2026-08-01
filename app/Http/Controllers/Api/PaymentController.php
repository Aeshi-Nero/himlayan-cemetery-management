<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Contract;
use App\Models\Payment;
use App\Notifications\PaymentReceived;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    public function index(): JsonResponse
    {
        $payments = Payment::with('contract')->orderByDesc('created_at')->get();

        return response()->json(['success' => true, 'data' => $payments]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'contract_id' => ['required', 'string', 'exists:contracts,id'],
            'amount' => ['required', 'numeric', 'min:0'],
            'payment_method' => ['nullable', 'string', 'in:cash,installment'],
            'receipt_number' => ['nullable', 'string'],
            'af_51_number' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $contract = Contract::find($data['contract_id']);

        if (! $contract) {
            return response()->json(['success' => false, 'error' => 'Contract not found'], 404);
        }

        $payableStatuses = [
            Contract::STATUS_RENTAL_COMPUTED,
            Contract::STATUS_PAID,
            Contract::STATUS_PENDING_APPROVAL,
        ];

        if (! in_array($contract->status, $payableStatuses, true)) {
            return response()->json([
                'success' => false,
                'error' => 'Payment can only be recorded once the rental has been computed and before final approval.',
            ], 422);
        }

        $payment = Payment::create([
            'id' => 'pay-'.Str::uuid(),
            'contract_id' => $data['contract_id'],
            'amount' => $data['amount'],
            'payment_date' => now()->toDateString(),
            'payment_method' => $data['payment_method'] ?? 'cash',
            'receipt_number' => $data['receipt_number'] ?? 'OR-2026-'.random_int(10000, 99999),
            'af_51_number' => $data['af_51_number'] ?? null,
            'collected_by' => $request->user()?->id,
            'notes' => $data['notes'] ?? null,
        ]);

        $payment->contract?->refreshPaymentTotals();

        $this->allocateToInstallmentSchedules($payment);

        // Assume full payment settles the contract when the paid amount
        // reaches the total amount. Installment contracts move forward
        // once every recorded payment satisfies this condition.
        $contract = $payment->contract?->fresh();

        if ($contract && $contract->amount_paid >= (float) $contract->total_amount && $contract->canTransitionTo(Contract::STATUS_PAID)) {
            $contract->markPaid();
        }

        if ($payment->contract?->client) {
            $payment->contract->client->notify(new PaymentReceived($payment));
        }

        ActivityLog::record('LOG_PAYMENT', 'Payments', "Logged payment of ₱{$data['amount']} (OR: {$payment->receipt_number})", $request);

        return response()->json(['success' => true, 'data' => $payment->load('contract')]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $payment = Payment::find($id);

        if (! $payment) {
            return response()->json(['success' => false, 'error' => 'Payment not found'], 404);
        }

        $payment->fill($request->only(['amount', 'payment_method', 'receipt_number', 'af_51_number', 'notes']));
        $payment->save();

        $payment->contract?->refreshPaymentTotals();

        ActivityLog::record('UPDATE_PAYMENT', 'Payments', "Updated payment {$id}", $request);

        return response()->json(['success' => true, 'data' => $payment->load('contract')]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $payment = Payment::find($id);

        if (! $payment) {
            return response()->json(['success' => false, 'error' => 'Payment not found'], 404);
        }

        $reference = $payment->receipt_number ?? $payment->id;

        ActivityLog::record('DELETE_PAYMENT', 'Payments', "Deleted payment record {$reference}", $request);

        $payment->delete();

        $payment->contract?->refreshPaymentTotals();

        return response()->json(['success' => true]);
    }

    /**
     * Apply a payment against the oldest unpaid / partial installment
     * schedules of the contract, oldest due date first.
     */
    private function allocateToInstallmentSchedules(Payment $payment): void
    {
        $contract = $payment->contract;

        if (! $contract) {
            return;
        }

        $remaining = (float) $payment->amount;

        $schedules = $contract->installmentSchedules()
            ->where('status', '!=', 'paid')
            ->orderBy('due_date')
            ->get();

        foreach ($schedules as $schedule) {
            if ($remaining <= 0) {
                break;
            }

            $outstanding = (float) $schedule->amount_due - (float) $schedule->amount_paid;

            if ($outstanding <= 0) {
                continue;
            }

            $apply = min($remaining, $outstanding);
            $schedule->amount_paid = round((float) $schedule->amount_paid + $apply, 2);
            $remaining = round($remaining - $apply, 2);

            if ($schedule->amount_paid >= (float) $schedule->amount_due) {
                $schedule->status = 'paid';
                $schedule->paid_at = now();
            } else {
                $schedule->status = 'partial';
            }

            $schedule->save();
        }
    }
}
