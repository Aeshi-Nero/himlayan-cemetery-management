<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ClientController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => Client::orderByDesc('created_at')->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'full_name' => ['required', 'string'],
            'contact_number' => ['required', 'string'],
            'email' => ['nullable', 'email'],
            'address' => ['nullable', 'string'],
            'id_number' => ['nullable', 'string'],
            'id_type' => ['nullable', 'string'],
        ]);

        $client = Client::create([
            'id' => 'cli-'.Str::uuid(),
            'full_name' => $data['full_name'],
            'contact_number' => $data['contact_number'],
            'email' => $data['email'] ?? null,
            'address' => $data['address'] ?? null,
            'id_number' => $data['id_number'] ?? null,
            'id_type' => $data['id_type'] ?? null,
        ]);

        ActivityLog::record('CREATE_CLIENT', 'Clients', "Added client {$client->full_name}", $request);

        return response()->json(['success' => true, 'data' => $client]);
    }
}
