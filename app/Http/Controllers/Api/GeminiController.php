<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class GeminiController extends Controller
{
    private function apiKey(): ?string
    {
        return config('services.gemini.api_key') ?: env('GEMINI_API_KEY');
    }

    /**
     * Send a chat message to Gemini.
     */
    public function chat(Request $request): JsonResponse
    {
        $apiKey = $this->apiKey();

        if (! $apiKey) {
            return response()->json([
                'success' => false,
                'error' => 'GEMINI_API_KEY environment variable is not configured.',
            ], 500);
        }

        $data = $request->validate([
            'message' => ['required', 'string'],
            'history' => ['nullable', 'array'],
        ]);

        $model = env('GEMINI_CHAT_MODEL', 'gemini-3.5-flash');

        $systemInstruction = 'You are the empathetic, polite, and authoritative AI Concierge & Guide for Himlayan Memorial Park.'
            .'You assist visitors, families, and administrative staff with information about:'
            .'- Plot Availability: Sections A, B, C, and D (Single Lawn Lots ₱15,000, Family Mausoleum Lots ₱35,000, Garden Apartment Terraces ₱60,000).'
            .'- Visiting Hours: 6:00 AM - 6:00 PM Daily.'
            .'- Directions & Pathfinding: Main Gate Avenue, Chapel, Fountain Plaza, and navigation paths.'
            .'- Booking & Inquiries: Submitting public inquiry requests, contract requirements, death certificate submissions, installment payments.'
            .'Provide clear, warm, dignified, and succinct responses.';

        $contents = [];

        foreach ($data['history'] ?? [] as $entry) {
            if (isset($entry['role'], $entry['content']) || isset($entry['role'], $entry['text'])) {
                $contents[] = [
                    'role' => $entry['role'] === 'assistant' ? 'model' : 'user',
                    'parts' => [['text' => $entry['content'] ?? $entry['text']]],
                ];
            }
        }

        $contents[] = ['role' => 'user', 'parts' => [['text' => $data['message']]]];

        try {
            $response = Http::withOptions(['timeout' => 60])
                ->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent", [
                    'systemInstruction' => ['parts' => [['text' => $systemInstruction]]],
                    'contents' => $contents,
                    'key' => $apiKey,
                ]);
        } catch (ConnectionException) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to reach Gemini AI service',
            ], 500);
        }

        if (! $response->successful()) {
            return response()->json([
                'success' => false,
                'error' => $response->json('error.message') ?? 'Failed to generate response from Gemini AI',
            ], $response->status());
        }

        $reply = $response->json('candidates.0.content.parts.0.text')
            ?? 'I am here to assist you with any inquiries regarding Himlayan Memorial Park.';

        return response()->json(['success' => true, 'data' => ['reply' => $reply]]);
    }

    /**
     * Analyze an image with Gemini.
     */
    public function analyzeImage(Request $request): JsonResponse
    {
        $apiKey = $this->apiKey();

        if (! $apiKey) {
            return response()->json([
                'success' => false,
                'error' => 'GEMINI_API_KEY environment variable is not configured.',
            ], 500);
        }

        $data = $request->validate([
            'imageBase64' => ['required', 'string'],
            'mimeType' => ['nullable', 'string'],
            'prompt' => ['nullable', 'string'],
        ]);

        $model = env('GEMINI_IMAGE_MODEL', 'gemini-3.1-pro-preview');

        $imageBase64 = preg_replace('/^data:image\/\w+;base64,/', '', $data['imageBase64']);

        $prompt = $data['prompt']
            ?? 'Analyze this photo of a cemetery plot, monument, headstone, or document. Identify any visible text, condition assessment, section indicators, or notable details for Himlayan Memorial records.';

        try {
            $response = Http::withOptions(['timeout' => 60])
                ->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent", [
                    'contents' => [
                        [
                            'parts' => [
                                [
                                    'inlineData' => [
                                        'mimeType' => $data['mimeType'] ?? 'image/jpeg',
                                        'data' => $imageBase64,
                                    ],
                                ],
                                ['text' => $prompt],
                            ],
                        ],
                    ],
                    'key' => $apiKey,
                ]);
        } catch (ConnectionException) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to reach Gemini AI service',
            ], 500);
        }

        if (! $response->successful()) {
            return response()->json([
                'success' => false,
                'error' => $response->json('error.message') ?? 'Failed to analyze image with Gemini AI',
            ], $response->status());
        }

        $analysis = $response->json('candidates.0.content.parts.0.text') ?? 'Image analyzed successfully.';

        return response()->json(['success' => true, 'data' => ['analysis' => $analysis]]);
    }
}
