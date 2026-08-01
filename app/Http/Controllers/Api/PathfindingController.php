<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PathEdge;
use App\Models\PathNode;
use App\Services\PathfindingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PathfindingController extends Controller
{
    public function nodes(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => PathNode::all()]);
    }

    public function edges(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => PathEdge::all()]);
    }

    public function findPath(Request $request, PathfindingService $service): JsonResponse
    {
        $from = $request->query('from');
        $to = $request->query('to');

        if (! $from || ! $to) {
            return response()->json([
                'success' => false,
                'error' => '`from` and `to` node IDs required',
            ], 400);
        }

        $result = $service->findPath((string) $from, (string) $to);

        return response()->json(['success' => true, 'data' => $result]);
    }
}
