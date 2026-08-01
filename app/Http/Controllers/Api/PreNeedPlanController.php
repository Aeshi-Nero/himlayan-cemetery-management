<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\PreNeedPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PreNeedPlanController extends Controller
{
    public function index(): JsonResponse
    {
        $plans = PreNeedPlan::orderBy('type')->orderBy('name')->get();

        return response()->json(['success' => true, 'data' => $plans]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:burial,funeral,memorial'],
            'description' => ['nullable', 'string'],
            'features' => ['nullable', 'array'],
            'price' => ['required', 'numeric', 'min:0'],
            'image' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $data['id'] = 'pln-'.Str::uuid();
        $data['slug'] = Str::slug($data['name']).'-'.substr((string) uniqid(), -4);
        $data['is_active'] = $request->boolean('is_active');

        $plan = PreNeedPlan::create($data);

        ActivityLog::record('CREATE_PLAN', 'Pre-Need Plans', "Created pre-need plan {$plan->name}", $request);

        return response()->json(['success' => true, 'data' => $plan]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $plan = PreNeedPlan::find($id);

        if (! $plan) {
            return response()->json(['success' => false, 'error' => 'Plan not found'], 404);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:burial,funeral,memorial'],
            'description' => ['nullable', 'string'],
            'features' => ['nullable', 'array'],
            'price' => ['required', 'numeric', 'min:0'],
            'image' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $data['slug'] = Str::slug($data['name']).'-'.substr((string) uniqid(), -4);
        $data['is_active'] = $request->boolean('is_active');

        $plan->update($data);

        ActivityLog::record('UPDATE_PLAN', 'Pre-Need Plans', "Updated pre-need plan {$plan->name}", $request);

        return response()->json(['success' => true, 'data' => $plan]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $plan = PreNeedPlan::find($id);

        if (! $plan) {
            return response()->json(['success' => false, 'error' => 'Plan not found'], 404);
        }

        if ($plan->contracts()->exists()) {
            return response()->json(['success' => false, 'error' => 'Cannot delete a plan with existing contracts.'], 422);
        }

        ActivityLog::record('DELETE_PLAN', 'Pre-Need Plans', "Deleted pre-need plan {$plan->name}", $request);

        $plan->delete();

        return response()->json(['success' => true]);
    }
}
