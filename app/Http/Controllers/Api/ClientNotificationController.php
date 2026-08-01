<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\SentClientNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ClientNotificationController extends Controller
{
    public function index(): JsonResponse
    {
        $notifications = SentClientNotification::with('client')
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['success' => true, 'data' => $notifications]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'client_id' => ['required', 'string', 'exists:clients,id'],
            'subject' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:2000'],
            'channel' => ['required', 'string', 'in:database,mail'],
        ]);

        $client = Client::findOrFail($data['client_id']);

        $notification = SentClientNotification::create([
            'id' => 'scn-'.Str::uuid(),
            'client_id' => $client->id,
            'type' => 'manual',
            'channel' => $data['channel'],
            'subject' => $data['subject'],
            'body' => $data['body'],
            'status' => 'sent',
        ]);

        ActivityLog::record('SEND_CLIENT_NOTIFICATION', 'Client Notifications', "Sent notification to {$client->full_name}", $request);

        return response()->json(['success' => true, 'data' => $notification->load('client')]);
    }
}
