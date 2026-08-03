<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\PreNeedPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class PreNeedPlanController extends Controller
{
    private const CACHE_KEY = 'plans.public';

    private const CACHE_TTL_SECONDS = 3600;

    public function index(): JsonResponse
    {
        $plans = Cache::remember(self::CACHE_KEY, self::CACHE_TTL_SECONDS, function () {
            return PreNeedPlan::orderBy('type')->orderBy('name')->get()->toArray();
        });

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

        Cache::forget(self::CACHE_KEY);

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

        Cache::forget(self::CACHE_KEY);

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

        Cache::forget(self::CACHE_KEY);

        return response()->json(['success' => true]);
    }
}
