<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\ColumbaryNiche;
use App\Models\Contract;
use App\Models\Plot;
use App\Models\PreNeedPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ReserveController extends Controller
{
    public function plans(): JsonResponse
    {
        $order = ['memorial', 'burial', 'funeral'];
        $plans = PreNeedPlan::where('is_active', true)->orderBy('type')->orderBy('name')->get()->groupBy('type');

        $data = collect($order)
            ->mapWithKeys(fn ($t) => [$t => $plans->get($t, collect())->values()])
            ->filter(fn ($p) => $p->isNotEmpty());

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function columbarium(): JsonResponse
    {
        $niches = ColumbaryNiche::orderBy('section')->orderBy('row')->orderBy('tier')->get();

        return response()->json(['success' => true, 'data' => $niches]);
    }

    public function lots(): JsonResponse
    {
        $plots = Plot::withCount('burials')
            ->where('status', 'available')
            ->orderBy('plot_number')
            ->get();

        return response()->json(['success' => true, 'data' => $plots]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', 'string', 'in:lot,columbary,plan'],
            'full_name' => ['required', 'string', 'max:255'],
            'contact_number' => ['required', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'plot_id' => ['required_if:type,lot', 'nullable', 'string', 'exists:plots,id'],
            'columbary_niche_id' => ['required_if:type,columbary', 'nullable', 'string', 'exists:columbary_niches,id'],
            'pre_need_plan_id' => ['required_if:type,plan', 'nullable', 'string', 'exists:pre_need_plans,id'],
            'message' => ['nullable', 'string'],
        ]);

        $client = Client::firstOrCreate(
            ['contact_number' => $data['contact_number']],
            [
                'full_name' => $data['full_name'],
                'email' => $data['email'] ?? null,
                'address' => $data['address'] ?? null,
                'id_number' => 'PENDING',
                'id_type' => 'Others',
            ]
        );

        $plotId = $data['type'] === 'lot' ? $data['plot_id'] : null;
        $nicheId = $data['type'] === 'columbary' ? $data['columbary_niche_id'] : null;
        $planId = $data['type'] === 'plan' ? $data['pre_need_plan_id'] : null;

        $price = 0;
        if ($plotId) {
            $price = Plot::find($plotId)?->price ?? 0;
        } elseif ($nicheId) {
            $price = ColumbaryNiche::find($nicheId)?->price ?? 0;
        } elseif ($planId) {
            $price = PreNeedPlan::find($planId)?->price ?? 0;
        }

        $contract = Contract::create([
            'id' => 'ctr-'.Str::uuid(),
            'client_id' => $client->id,
            'plot_id' => $plotId,
            'pre_need_plan_id' => $planId,
            'columbary_niche_id' => $nicheId,
            'contract_date' => now()->toDateString(),
            'total_amount' => $price,
            'payment_type' => 'installment',
            'status' => 'draft',
            'amount_paid' => 0,
            'balance_remaining' => $price,
        ]);

        if ($plotId) {
            Plot::where('id', $plotId)->update(['status' => 'reserved']);
        }
        if ($nicheId) {
            ColumbaryNiche::where('id', $nicheId)->update(['status' => 'reserved']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Your reservation has been submitted successfully. Our team will contact you within 24 hours.',
            'data' => $contract->load('client'),
        ]);
    }
}
