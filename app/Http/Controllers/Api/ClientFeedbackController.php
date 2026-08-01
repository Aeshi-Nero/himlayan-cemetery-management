<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\ClientFeedback;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ClientFeedbackController extends Controller
{
    public function index(): JsonResponse
    {
        $feedbacks = ClientFeedback::with(['client', 'contract'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['success' => true, 'data' => $feedbacks]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'contract_id' => ['required', 'string', 'exists:contracts,id'],
            'client_id' => ['required', 'string', 'exists:clients,id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comments' => ['nullable', 'string', 'max:2000'],
        ]);

        $data['id'] = 'fb-'.Str::uuid();
        $data['status'] = 'submitted';
        $data['submitted_at'] = now();

        $feedback = ClientFeedback::create($data);

        ActivityLog::record('CREATE_FEEDBACK', 'Client Feedback', 'Recorded client feedback for contract '.$data['contract_id'], $request);

        return response()->json(['success' => true, 'data' => $feedback->load(['client', 'contract'])]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $feedback = ClientFeedback::find($id);

        if (! $feedback) {
            return response()->json(['success' => false, 'error' => 'Feedback not found'], 404);
        }

        ActivityLog::record('DELETE_FEEDBACK', 'Client Feedback', 'Deleted client feedback record', $request);

        $feedback->delete();

        return response()->json(['success' => true]);
    }
}
