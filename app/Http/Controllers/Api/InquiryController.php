<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\Plot;
use App\Models\Inquiry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class InquiryController extends Controller
{
    /** Whitelist of fields the update endpoint is allowed to change. */
    private const UPDATABLE_FIELDS = [
        'plot_id',
        'full_name',
        'contact_number',
        'email',
        'requested_burial_date',
        'deceased_name',
        'message',
        'status',
    ];

    public function index(): JsonResponse
    {
        Plot::syncReservedToOccupied();

        $inquiries = Inquiry::with(['client', 'plot'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Inquiry $inquiry) {
                $data = $inquiry->toArray();
                $data['full_name'] = $inquiry->full_name ?? $inquiry->client?->full_name ?? '';
                $data['contact_number'] = $inquiry->contact_number ?? $inquiry->client?->contact_number ?? '';
                $data['email'] = $inquiry->email ?? $inquiry->client?->email ?? '';

                return $data;
            });

        return response()->json(['success' => true, 'data' => $inquiries]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'full_name' => ['required', 'string'],
            'contact_number' => ['required', 'string'],
            'email' => ['nullable', 'email'],
            'plot_id' => ['nullable', 'string'],
            'requested_burial_date' => ['nullable', 'date'],
            'deceased_name' => ['nullable', 'string'],
            'message' => ['nullable', 'string'],
        ]);

        $clientQuery = Client::where('contact_number', $data['contact_number']);

        if (! empty($data['email'])) {
            $clientQuery->orWhere('email', $data['email']);
        }

        $client = $clientQuery->first();

        if (! $client) {
            $client = Client::create([
                'id' => 'cli-'.Str::uuid(),
                'full_name' => $data['full_name'],
                'contact_number' => $data['contact_number'],
                'email' => $data['email'] ?? null,
            ]);
        }

        $inquiry = Inquiry::create([
            'id' => 'inq-'.Str::uuid(),
            'client_id' => $client->id,
            'plot_id' => $data['plot_id'] ?? null,
            'full_name' => $data['full_name'],
            'contact_number' => $data['contact_number'],
            'email' => $data['email'] ?? null,
            'inquiry_date' => now()->toDateString(),
            'requested_burial_date' => $data['requested_burial_date'] ?? null,
            'deceased_name' => $data['deceased_name'] ?? null,
            'message' => $data['message'] ?? null,
            'status' => 'pending',
        ]);

        ActivityLog::record('SUBMIT_INQUIRY', 'Inquiries', "Public inquiry submitted by {$client->full_name}");

        return response()->json(['success' => true, 'data' => $inquiry]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $inquiry = Inquiry::find($id);

        if (! $inquiry) {
            return response()->json(['success' => false, 'error' => 'Inquiry not found'], 404);
        }

        $data = $request->validate([
            'plot_id' => ['sometimes', 'nullable', 'string'],
            'full_name' => ['sometimes', 'string'],
            'contact_number' => ['sometimes', 'string'],
            'email' => ['sometimes', 'nullable', 'email'],
            'requested_burial_date' => ['sometimes', 'nullable', 'date'],
            'deceased_name' => ['sometimes', 'nullable', 'string'],
            'message' => ['sometimes', 'nullable', 'string'],
            'status' => ['sometimes', 'string', 'in:pending,contacted,approved,rejected,completed,closed'],
        ]);

        $inquiry->fill(array_intersect_key($data, array_flip(self::UPDATABLE_FIELDS)));
        $inquiry->processed_by = $request->user()?->id ?? $inquiry->processed_by;
        $inquiry->processed_at = now();
        $inquiry->save();

        if ($inquiry->status === 'approved') {
            $this->reservePlotForInquiry($inquiry);
        }

        Plot::syncReservedToOccupied();

        ActivityLog::record('UPDATE_INQUIRY', 'Inquiries', "Updated inquiry {$inquiry->id} status to {$inquiry->status}", $request);

        return response()->json(['success' => true, 'data' => $inquiry->refresh()]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $inquiry = Inquiry::find($id);

        if (! $inquiry) {
            return response()->json(['success' => false, 'error' => 'Inquiry not found'], 404);
        }

        $inquirer = $inquiry->full_name ?? $inquiry->client?->full_name ?? 'Inquirer';

        ActivityLog::record('DELETE_INQUIRY', 'Inquiries', "Deleted inquiry from {$inquirer}", $request);

        $inquiry->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Reserve the referenced plot when an inquiry is approved.
     */
    private function reservePlotForInquiry(Inquiry $inquiry): void
    {
        $plot = $inquiry->plot_id ? Plot::find($inquiry->plot_id) : null;

        if (! $plot && $inquiry->message) {
            preg_match('/Lot\s*#?([A-Z0-9-]+)/i', $inquiry->message, $matches);

            if (isset($matches[1])) {
                $plot = Plot::whereRaw('LOWER(plot_number) = ?', [strtolower($matches[1])])->first();
            }
        }

        if (! $plot) {
            return;
        }

        $plot->status = 'reserved';
        $plot->burial_date = $inquiry->requested_burial_date ?? now()->addDays(3)->setTime(10, 0);
        $plot->burial_time = '10:00 AM';
        $plot->inquirer_name = $inquiry->client?->full_name ?? $inquiry->full_name ?? 'Inquirer';
        if ($inquiry->deceased_name) {
            $plot->deceased_name = $inquiry->deceased_name;
        }
        $plot->save();
    }
}
