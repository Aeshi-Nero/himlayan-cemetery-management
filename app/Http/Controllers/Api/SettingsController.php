<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SettingsController extends Controller
{
    private const CACHE_KEY = 'settings.public';

    private const CACHE_TTL_SECONDS = 3600;

    public function index(): JsonResponse
    {
        $settings = Cache::remember(self::CACHE_KEY, self::CACHE_TTL_SECONDS, function () {
            return [
                'cemetery_name' => Setting::get('cemetery_name', 'Himlayan Memorial Park'),
                'office_contact' => Setting::get('office_contact', '+63 2 8922 4500'),
                'visiting_hours' => Setting::get('visiting_hours', 'Monday to Sunday: 6:00 AM - 6:00 PM'),
                'default_department' => Setting::get('default_department', 'Himlayan Admin'),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'cemetery_name' => ['nullable', 'string'],
            'office_contact' => ['nullable', 'string'],
            'visiting_hours' => ['nullable', 'string'],
            'default_department' => ['nullable', 'string'],
        ]);

        foreach ($data as $key => $value) {
            if ($request->filled($key)) {
                Setting::set($key, $value);
            }
        }

        Cache::forget(self::CACHE_KEY);

        ActivityLog::record('UPDATE_SETTINGS', 'Settings', 'System administrative settings updated', $request);

        $settings = Cache::remember(self::CACHE_KEY, self::CACHE_TTL_SECONDS, function () {
            return [
                'cemetery_name' => Setting::get('cemetery_name'),
                'office_contact' => Setting::get('office_contact'),
                'visiting_hours' => Setting::get('visiting_hours'),
                'default_department' => Setting::get('default_department'),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }
}
