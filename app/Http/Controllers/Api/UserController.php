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
            'name' => ['required_without:full_name', 'string'],
            'full_name' => ['required_without:name', 'string'],
            'role' => ['required', 'string', 'in:super_admin,rcc,engineer'],
            'password' => ['nullable', 'string', 'min:8'],
            'department' => ['nullable', 'string'],
            'phone' => ['nullable', 'string'],
            'address' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $user = User::create([
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

    public function show(Request $request, string $id): JsonResponse
    {
        $user = User::find($id);

        if (! $user) {
            return response()->json(['success' => false, 'error' => 'User not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $user]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $user = User::find($id);

        if (! $user) {
            return response()->json(['success' => false, 'error' => 'User not found'], 404);
        }

        $data = $request->validate([
            'email' => ['required', 'email', 'unique:users,email,'.$id],
            'name' => ['required_without:full_name', 'string'],
            'full_name' => ['required_without:name', 'string'],
            'role' => ['required', 'string', 'in:super_admin,rcc,engineer'],
            'password' => ['nullable', 'string', 'min:8'],
            'department' => ['nullable', 'string'],
            'phone' => ['nullable', 'string'],
            'address' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $user->name = $data['full_name'] ?? $data['name'];
        $user->email = $data['email'];
        $user->role = $data['role'];
        $user->department = $data['department'] ?? $user->department;
        $user->phone = $data['phone'] ?? $user->phone;
        $user->address = $data['address'] ?? $user->address;

        if (isset($data['is_active'])) {
            $user->is_active = $data['is_active'];
        }

        if (! empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();

        ActivityLog::record('UPDATE_USER', 'Users', "Super Admin updated user {$user->email} ({$user->role})", $request);

        return response()->json(['success' => true, 'data' => $user]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = User::find($id);

        if (! $user) {
            return response()->json(['success' => false, 'error' => 'User not found'], 404);
        }

        if ($request->user()?->id === $user->id) {
            return response()->json(['success' => false, 'error' => 'You cannot delete your own account'], 422);
        }

        $reference = $user->email ?? $user->id;

        ActivityLog::record('DELETE_USER', 'Users', "Super Admin deleted user {$reference}", $request);

        $user->delete();

        return response()->json(['success' => true]);
    }
}
