<?php

namespace App\Services;

use App\Models\PathEdge;
use App\Models\PathNode;

class PathfindingService
{
    /**
     * Earth radius in meters.
     */
    private const EARTH_RADIUS = 6371000;

    /**
     * Haversine distance between two lat/lng points in meters.
     */
    public function haversine(float $lat1, float $lon1, float $lat2, float $lon2): int
    {
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1))
            * cos(deg2rad($lat2))
            * sin($dLon / 2) ** 2;

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return (int) round(self::EARTH_RADIUS * $c);
    }

    /**
     * Run A* between two path node IDs.
     *
     * @return array{path: array<int, array{nodeId: string, lat: float, lng: float, label: string, distanceFromPrevious: int}>, totalDistance: int, nodesVisited: int}
     */
    public function findPath(string $fromNodeId, string $toNodeId): array
    {
        $nodes = PathNode::all();
        $edges = PathEdge::all();

        $nodeMap = $nodes->keyBy('id');
        $start = $nodeMap->get($fromNodeId);
        $end = $nodeMap->get($toNodeId);

        if (! $start || ! $end) {
            return ['path' => [], 'totalDistance' => 0, 'nodesVisited' => 0];
        }

        // Build undirected adjacency list.
        $adj = [];
        foreach ($nodes as $node) {
            $adj[$node->id] = [];
        }
        foreach ($edges as $edge) {
            $adj[$edge->from_node_id][] = ['targetId' => $edge->to_node_id, 'weight' => (int) $edge->distance_weight];
            $adj[$edge->to_node_id][] = ['targetId' => $edge->from_node_id, 'weight' => (int) $edge->distance_weight];
        }

        $gScore = [];
        $fScore = [];
        foreach ($nodes as $node) {
            $gScore[$node->id] = INF;
            $fScore[$node->id] = INF;
        }

        $gScore[$fromNodeId] = 0;
        $fScore[$fromNodeId] = $this->haversine((float) $start->lat, (float) $start->lng, (float) $end->lat, (float) $end->lng);

        $openSet = [$fromNodeId];
        $cameFrom = [];
        $nodesVisited = 0;

        while ($openSet !== []) {
            $nodesVisited++;

            // Pick the open node with the lowest fScore.
            $currentId = $openSet[0];
            $lowestF = $fScore[$currentId];
            foreach ($openSet as $id) {
                if ($fScore[$id] < $lowestF) {
                    $lowestF = $fScore[$id];
                    $currentId = $id;
                }
            }

            if ($currentId === $toNodeId) {
                return $this->reconstructPath($nodeMap, $cameFrom, $fromNodeId, $toNodeId, $nodesVisited);
            }

            $openSet = array_values(array_diff($openSet, [$currentId]));

            foreach ($adj[$currentId] ?? [] as $neighbor) {
                $tentativeG = $gScore[$currentId] + $neighbor['weight'];
                if ($tentativeG < $gScore[$neighbor['targetId']]) {
                    $cameFrom[$neighbor['targetId']] = $currentId;
                    $gScore[$neighbor['targetId']] = $tentativeG;

                    $targetNode = $nodeMap->get($neighbor['targetId']);
                    $fScore[$neighbor['targetId']] = $tentativeG
                        + $this->haversine((float) $targetNode->lat, (float) $targetNode->lng, (float) $end->lat, (float) $end->lng);

                    $openSet[] = $neighbor['targetId'];
                }
            }
        }

        // Fallback: direct line when no edge path exists.
        $distance = $this->haversine((float) $start->lat, (float) $start->lng, (float) $end->lat, (float) $end->lng);

        return [
            'path' => [
                ['nodeId' => $start->id, 'lat' => (float) $start->lat, 'lng' => (float) $start->lng, 'label' => $start->node_label ?? $start->id, 'distanceFromPrevious' => 0],
                ['nodeId' => $end->id, 'lat' => (float) $end->lat, 'lng' => (float) $end->lng, 'label' => $end->node_label ?? $end->id, 'distanceFromPrevious' => $distance],
            ],
            'totalDistance' => $distance,
            'nodesVisited' => $nodesVisited,
        ];
    }

    /**
     * @param  \Illuminate\Support\Collection<int, PathNode>  $nodeMap
     * @param  array<string, string>  $cameFrom
     * @return array{path: array<int, array{nodeId: string, lat: float, lng: float, label: string, distanceFromPrevious: int}>, totalDistance: int, nodesVisited: int}
     */
    private function reconstructPath($nodeMap, array $cameFrom, string $fromNodeId, string $toNodeId, int $nodesVisited): array
    {
        $pathNodes = [];
        $current = $toNodeId;

        while ($current !== null) {
            $node = $nodeMap->get($current);
            if ($node) {
                array_unshift($pathNodes, $node);
            }
            $current = $cameFrom[$current] ?? null;
        }

        $pathSteps = [];
        $accumulatedDistance = 0;

        foreach ($pathNodes as $index => $node) {
            $stepDist = 0;
            if ($index > 0) {
                $prev = $pathNodes[$index - 1];
                $stepDist = $this->haversine((float) $prev->lat, (float) $prev->lng, (float) $node->lat, (float) $node->lng);
                $accumulatedDistance += $stepDist;
            }
            $pathSteps[] = [
                'nodeId' => $node->id,
                'lat' => (float) $node->lat,
                'lng' => (float) $node->lng,
                'label' => $node->node_label ?? $node->id,
                'distanceFromPrevious' => $stepDist,
            ];
        }

        return [
            'path' => $pathSteps,
            'totalDistance' => $accumulatedDistance,
            'nodesVisited' => $nodesVisited,
        ];
    }
}
