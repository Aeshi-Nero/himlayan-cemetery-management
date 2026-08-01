<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => User::orderBy('created_at')->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'unique:users,email'],
            'name' => ['required', 'string'],
            'full_name' => ['nullable', 'string'],
            'role' => ['required', 'string', 'in:super_admin,rcc,engineer,staff'],
            'password' => ['nullable', 'string', 'min:8'],
            'department' => ['nullable', 'string'],
            'phone' => ['nullable', 'string'],
            'address' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $user = User::create([
            'id' => null,
            'name' => $data['full_name'] ?? $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password'] ?? 'Admin@123'),
            'role' => $data['role'],
            'department' => $data['department'] ?? null,
            'phone' => $data['phone'] ?? null,
            'address' => $data['address'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);

        ActivityLog::record('CREATE_USER', 'Users', "Super Admin created user {$user->email} ({$user->role})", $request);

        return response()->json(['success' => true, 'data' => $user]);
    }
}
