import React, { useEffect, useState, useMemo, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { Navbar } from '@/Components/Public/Navbar';
import { Plot, PathStep, Burial, PlotConnection } from '@/types';
import { incrementMapUsageCount } from '@/utils/mapUsageTracker';
import {
  DEFAULT_CEMETERY_ID,
  DEFAULT_MAP_CENTER,
  FALLBACK_PLOT_LAT,
  FALLBACK_PLOT_LNG,
  DEFAULT_MAP_ZOOM,
} from '@/constants/geo';
import {
    MapPin,
    Navigation,
    ArrowRight,
    Search,
    Download,
    X,
    Calendar,
    ChevronUp,
    ChevronDown,
    ChevronRight,
    ChevronLeft,
} from 'lucide-react';

// Custom Map FlyTo Controller
const MapFlyToController = ({ center, zoom }: { center: [number, number] | null; zoom: number }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom, {
                duration: 1.8,
                easeLinearity: 0.25,
            });
        }
    }, [center, zoom, map]);
    return null;
};

// Custom Colored Markers / DivIcons for plots matching legend box
const createPlotIcon = (plot: Plot, zoomLevel: number = 16) => {
    const { status, lot_type: lotType, width, height, rotation, capacity } = plot;
    let color = '#00c853'; // Green (available)
    if (status === 'reserved') color = '#f59e0b'; // Amber
    if (status === 'occupied' || status === 'full') color = '#ff1744'; // Red

    const scale = Math.pow(1.22, Math.max(0, zoomLevel - 16));

    const baseW =
        width ||
        (lotType === 'single' ? 14 : lotType === 'path' || lotType === 'border' || lotType === 'entrance' ? 12 : 18);
    const baseH =
        height ||
        (lotType === 'single' ? 18 : lotType === 'path' || lotType === 'border' || lotType === 'entrance' ? 12 : 24);
    const r = rotation || 0;

    let w = baseW * scale;
    let h = baseH * scale;

    if (lotType === 'path' || lotType === 'border' || lotType === 'entrance') {
        w = Math.min(w, 20);
        h = Math.min(h, 20);
    }

    const styleStr = `width: ${w}px; height: ${h}px; transform: rotate(${r}deg);`;

    if (lotType === 'entrance') {
        const entW = Math.max(w, 24);
        const entH = Math.max(h, 24);
        const entStyle = `width: ${entW}px; height: ${entH}px; transform: rotate(${r}deg);`;
        return L.divIcon({
            className: 'custom-plot-marker',
            html: `<div style="background-color: #0d9488; border-radius: 50%; border: 2.5px solid #f59e0b; box-shadow: 0 0 10px #f59e0b, 0 0 5px #0d9488; cursor: pointer; display: flex; align-items: center; justify-content: center; ${entStyle}" title="Main Entrance Node">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"/>
          <path d="M2 20h20"/>
          <path d="M14 12v.01"/>
        </svg>
      </div>`,
            iconSize: [entW, entH],
            iconAnchor: [entW / 2, entH / 2],
        });
    } else if (lotType === 'path') {
        return L.divIcon({
            className: 'custom-plot-marker',
            html: `<div style="background-color: #14b8a6; border-radius: 50%; border: 2.5px solid #0f766e; box-shadow: 0 0 8px #14b8a6; cursor: pointer; ${styleStr}"></div>`,
            iconSize: [w, h],
            iconAnchor: [w / 2, h / 2],
        });
    } else if (lotType === 'border') {
        return L.divIcon({
            className: 'custom-plot-marker',
            html: `<div style="background-color: #10b981; border-radius: 50%; border: 2.5px solid #047857; box-shadow: 0 0 8px #10b981; cursor: pointer; ${styleStr}"></div>`,
            iconSize: [w, h],
            iconAnchor: [w / 2, h / 2],
        });
    } else if (!lotType || lotType === 'single') {
        return L.divIcon({
            className: 'custom-plot-marker',
            html: `<div style="background-color: ${color}; border: 2px solid white; border-radius: 2px; box-shadow: 0 0 8px ${color}; cursor: pointer; ${styleStr}"></div>`,
            iconSize: [w, h],
            iconAnchor: [w / 2, h / 2],
        });
    } else if (lotType === 'apartment') {
        return L.divIcon({
            className: 'custom-plot-marker',
            html: `<div style="background-color: ${color}; border: 2px solid white; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 10px; color: white; box-shadow: 0 0 8px ${color}; cursor: pointer; ${styleStr}">${capacity || 2}</div>`,
            iconSize: [w, h],
            iconAnchor: [w / 2, h / 2],
        });
    } else if (lotType === 'family') {
        return L.divIcon({
            className: 'custom-plot-marker',
            html: `<div style="background-color: ${color}; border: 2px solid white; border-radius: 3px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 8px ${color}; cursor: pointer; ${styleStr}"><div style="width: 6px; height: 6px; border: 1.5px solid white; transform: rotate(45deg);"></div></div>`,
            iconSize: [w, h],
            iconAnchor: [w / 2, h / 2],
        });
    } else {
        return L.divIcon({
            className: 'custom-plot-marker',
            html: `<div style="background-color: ${color}; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 8px ${color}; cursor: pointer; ${styleStr}"></div>`,
            iconSize: [w, h],
            iconAnchor: [w / 2, h / 2],
        });
    }
};

const gateIcon = L.divIcon({
    className: 'custom-gate-marker',
    html: `<div style="background-color: #3b82f6; width: 18px; height: 18px; border-radius: 4px; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px; shadow: 0 0 10px #3b82f6;">G</div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
});

const ZoomListener = ({ onZoom }: { onZoom: (zoom: number) => void }) => {
    const map = useMap();
    useEffect(() => {
        onZoom(map.getZoom());
        const onZoomEnd = () => onZoom(map.getZoom());
        map.on('zoomend', onZoomEnd);
        return () => {
            map.off('zoomend', onZoomEnd);
        };
    }, [map, onZoom]);
    return null;
};

// Build an undirected adjacency map from persisted cemetery connections.
const buildConnectionAdjacency = (connections: PlotConnection[]) => {
    const adj = new Map<string, string[]>();
    const add = (a: string, b: string) => {
        if (!adj.has(a)) adj.set(a, []);
        adj.get(a)!.push(b);
    };
    connections.forEach((c) => {
        add(c.from_plot_id, c.to_plot_id);
        add(c.to_plot_id, c.from_plot_id);
    });
    return adj;
};

// BFS over the cemetery connection graph returning an ordered array of plot ids from start to end.
const bfsPlotRoute = (
    startId: string,
    endId: string,
    adj: Map<string, string[]>,
): string[] | null => {
    if (startId === endId) return [startId];
    const queue: string[] = [startId];
    const prev = new Map<string, string>([[startId, startId]]);
    const seen = new Set<string>([startId]);
    while (queue.length > 0) {
        const cur = queue.shift()!;
        const neighbors = adj.get(cur) || [];
        for (const n of neighbors) {
            if (seen.has(n)) continue;
            seen.add(n);
            prev.set(n, cur);
            if (n === endId) {
                const route: string[] = [];
                let node: string | undefined = endId;
                while (node && node !== startId) {
                    route.unshift(node);
                    node = prev.get(node);
                }
                route.unshift(startId);
                return route;
            }
            queue.push(n);
        }
    }
    return null;
};

// The starting landmark for a cemetery = its entrance plot, else the first path plot, else null.
const findEntrancePlot = (plots: Plot[]): Plot | null => {
    const entrance = plots.find((p) => p.lot_type === 'entrance');
    if (entrance) return entrance;
    const path = plots.find((p) => p.lot_type === 'path');
    return path || null;
};

// Build turn-by-turn walking steps across the cemetery's own connection network,
// ending with a short walk from the last connected node onto the target plot.
const buildCemeteryPathSteps = (
    target: Plot,
    plots: Plot[],
    conns: PlotConnection[],
    startPlot?: Plot | null,
): { steps: PathStep[]; totalDistance: number } => {
    const lat = target.lat || FALLBACK_PLOT_LAT;
    const lng = target.lng || FALLBACK_PLOT_LNG;

    const gate = startPlot || findEntrancePlot(plots);
    const gateId = gate?.id;
    if (!gateId || gateId === target.id) {
        return {
            steps: [
                {
                    nodeId: `walk-to-${target.id}`,
                    lat,
                    lng,
                    label: `Walk directly to Lot #${target.plot_number}`,
                    distanceFromPrevious: 0,
                },
            ],
            totalDistance: 0,
        };
    }

    const adj = buildConnectionAdjacency(conns);
    const route = bfsPlotRoute(gateId, target.id, adj);

    // Fall back to a direct leg (from gate to target) when there is no usable connection graph.
    if (!route || route.length < 2) {
        const gateLat = gate.lat || lat;
        const gateLng = gate.lng || lng;
        const dist = calculateHaversineDistance(gateLat, gateLng, lat, lng);
        return {
            steps: [
                {
                    nodeId: `from-gate-${gateId}`,
                    lat: gateLat,
                    lng: gateLng,
                    label: `Start at ${gate.plot_number} (${gate.lot_type})`,
                    distanceFromPrevious: 0,
                },
                {
                    nodeId: `walk-to-${target.id}`,
                    lat,
                    lng,
                    label: `Walk directly to Lot #${target.plot_number}`,
                    distanceFromPrevious: dist,
                },
            ],
            totalDistance: dist,
        };
    }

    const plotById = new Map(plots.map((p) => [p.id, p]));
    let distance = 0;
    const steps: PathStep[] = [];
    for (let i = 0; i < route.length; i++) {
        const nodeId = route[i];
        const plot = plotById.get(nodeId);
        if (!plot) continue;
        const pLat = plot.lat || lat;
        const pLng = plot.lng || lng;
        if (i === 0) {
            steps.push({
                nodeId,
                lat: pLat,
                lng: pLng,
                label: `Start at ${plot.plot_number} (${plot.lot_type})`,
                distanceFromPrevious: 0,
            });
            continue;
        }
        const prevPlot = plotById.get(route[i - 1]);
        const d = prevPlot
            ? calculateHaversineDistance(prevPlot.lat || pLat, prevPlot.lng || pLng, pLat, pLng)
            : 0;
        distance += d;
        steps.push({
            nodeId,
            lat: pLat,
            lng: pLng,
            label: `Along connection from ${prevPlot?.plot_number || '?'} to ${plot.plot_number}`,
            distanceFromPrevious: d,
        });
    }

    // Final short leg onto the target plot.
    const lastPlot = plotById.get(route[route.length - 1]);
    if (lastPlot && (lastPlot.lat !== lat || lastPlot.lng !== lng)) {
        const finalDist = calculateHaversineDistance(lastPlot.lat || lat, lastPlot.lng || lng, lat, lng);
        if (finalDist > 1) {
            distance += finalDist;
            steps.push({
                nodeId: `walk-to-${target.id}`,
                lat,
                lng,
                label: `Walk onto Lot #${target.plot_number}`,
                distanceFromPrevious: finalDist,
            });
        }
    }

    return { steps, totalDistance: distance };
};

// Helper: order plots by their persisted connection chain (placement order), falling back to plot_number ordering
const orderPlotsByConnectionChain = (plots: Plot[], connections: PlotConnection[]): Plot[] => {
    const plotById = new Map(plots.map((p) => [p.id, p]));
    const connSet = new Set<string>();
    connections.forEach((c) => {
        connSet.add(`${c.from_plot_id}__${c.to_plot_id}`);
        connSet.add(`${c.to_plot_id}__${c.from_plot_id}`);
    });

    if (plots.length <= 2) return plots;

    const ordered: Plot[] = [];
    const visited = new Set<string>();
    let start = plots[0];
    ordered.push(start);
    visited.add(start.id);

    for (let guard = 0; guard < plots.length * 2 && ordered.length < plots.length; guard++) {
        const curr = ordered[ordered.length - 1];
        const next = plots.find(
            (p) => !visited.has(p.id) && connSet.has(`${curr.id}__${p.id}`),
        );
        if (next) {
            ordered.push(next);
            visited.add(next.id);
            continue;
        }
        // Dead-end: pick the next unvisited plot by sequential plot number
        const fallback = plots
            .filter((p) => !visited.has(p.id))
            .sort((a, b) => {
                const na = parseInt(a.plot_number.split('-')[1] || '0', 10);
                const nb = parseInt(b.plot_number.split('-')[1] || '0', 10);
                return na - nb;
            })[0];
        if (fallback) {
            ordered.push(fallback);
            visited.add(fallback.id);
        } else {
            break;
        }
    }

    // Append any remaining (should not happen)
    plots.forEach((p) => {
        if (!visited.has(p.id)) ordered.push(p);
    });

    return ordered;
};

// Helper: parse deceased occupant names array from plot object or notes
const getPlotDeceasedNames = (plot: Plot): string[] => {
    if (plot.deceased_names && Array.isArray(plot.deceased_names) && plot.deceased_names.length > 0) {
        return plot.deceased_names;
    }
    if (plot.notes) {
        try {
            const parsed = JSON.parse(plot.notes);
            if (parsed && Array.isArray(parsed.deceased_names) && parsed.deceased_names.length > 0) {
                return parsed.deceased_names;
            }
        } catch {
            // not json
        }
    }
    return plot.deceased_name ? [plot.deceased_name] : [];
};

const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
};

export const MemorialMapPage: React.FC = () => {
    const { url } = usePage();
    const searchParams = useMemo(() => new URL(url, window.location.origin).searchParams, [url]);

    const [plots, setPlots] = useState<Plot[]>([]);
    const [burials, setBurials] = useState<Burial[]>([]);
    const [connections, setConnections] = useState<PlotConnection[]>([]);
    const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
    const [zoomLevel, setZoomLevel] = useState(16);
    const [isLegendOpen, setIsLegendOpen] = useState(true);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Map Pan / Zoom FlyTo
    const [flyToCenter, setFlyToCenter] = useState<[number, number] | null>(null);
    const [flyToZoom, setFlyToZoom] = useState<number>(19);

    // Search Loved One state
    const [mapSearchQuery, setMapSearchQuery] = useState('');
    const [selectedDeceasedName, setSelectedDeceasedName] = useState<string | null>(null);
    const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Resolve cemetery boundary: the group of plots sharing the target's cemetery_id (or all plots).
    const cemeteryPlots = useMemo(() => {
        if (!selectedPlot) return plots;
        return selectedPlot.cemetery_id
            ? plots.filter((p) => p.cemetery_id === selectedPlot.cemetery_id)
            : plots;
    }, [plots, selectedPlot]);

    // Resolve only the connections belonging to the selected plot's cemetery.
    const cemeteryConnections = useMemo(() => {
        if (!selectedPlot) return connections;
        return selectedPlot.cemetery_id
            ? connections.filter((c) => c.cemetery_id === selectedPlot.cemetery_id)
            : connections;
    }, [connections, selectedPlot]);

    // Current walking route from the entrance to the selected plot.
    const cemeteryPath = useMemo(() => {
        if (!selectedPlot) return { steps: [], totalDistance: 0 };
        return buildCemeteryPathSteps(selectedPlot, cemeteryPlots, cemeteryConnections);
    }, [selectedPlot, cemeteryPlots, cemeteryConnections]);

    const pathSteps = cemeteryPath.steps;
    const totalDistance = cemeteryPath.totalDistance;

    // Walking path steps already include routing to the target plot via the cemetery connection network.
    const extendedPathSteps = pathSteps;
    const extendedTotalDistance = totalDistance;

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Compute search suggestions dropdown list
    const searchSuggestions = useMemo(() => {
        const query = mapSearchQuery.trim().toLowerCase();
        if (!query) return [];

        interface SearchSuggestionItem {
            id: string;
            name: string;
            plotNumber: string;
            section: string;
            type: 'deceased' | 'plot';
            plot: Plot;
            dateStr?: string;
        }

        const results: SearchSuggestionItem[] = [];
        const seenPlotIds = new Set<string>();

        // 1. Search Burial records
        burials.forEach((b) => {
            if (
                b.deceased_name.toLowerCase().includes(query) ||
                (b.notes && b.notes.toLowerCase().includes(query))
            ) {
                const p = plots.find((plt) => plt.id === b.plot_id);
                if (p) {
                    seenPlotIds.add(p.id);
                    results.push({
                        id: `burial-${b.id}`,
                        name: b.deceased_name,
                        plotNumber: p.plot_number,
                        section: p.section,
                        type: 'deceased',
                        plot: p,
                        dateStr: b.burial_date ? new Date(b.burial_date).toLocaleDateString() : undefined,
                    });
                }
            }
        });

        // 2. Search Plots directly
        plots.forEach((p) => {
            const deceasedNames = getPlotDeceasedNames(p).filter((n) => n && n.trim().length > 0);
            const matchedDeceasedName = deceasedNames.find((name) => name.toLowerCase().includes(query));

            const inqName = p.inquirer_name;
            const pNum = p.plot_number;
            const sec = p.section;

            if (matchedDeceasedName) {
                if (!seenPlotIds.has(p.id)) {
                    results.push({
                        id: `plot-deceased-${p.id}-${matchedDeceasedName}`,
                        name: matchedDeceasedName,
                        plotNumber: pNum,
                        section: sec,
                        type: 'deceased',
                        plot: p,
                        dateStr: p.burial_date ? new Date(p.burial_date).toLocaleDateString() : undefined,
                    });
                    seenPlotIds.add(p.id);
                }
            } else if (
                (inqName && inqName.toLowerCase().includes(query)) ||
                pNum.toLowerCase().includes(query) ||
                sec.toLowerCase().includes(query)
            ) {
                if (!seenPlotIds.has(p.id)) {
                    results.push({
                        id: `plot-${p.id}`,
                        name: inqName ? `${inqName} (Reserved)` : `Grave Lot #${pNum}`,
                        plotNumber: pNum,
                        section: sec,
                        type: inqName ? 'deceased' : 'plot',
                        plot: p,
                        dateStr: p.burial_date ? new Date(p.burial_date).toLocaleDateString() : undefined,
                    });
                    seenPlotIds.add(p.id);
                }
            }
        });

        return results.slice(0, 8);
    }, [mapSearchQuery, burials, plots]);

    const handleSelectSuggestion = (suggestion: {
        name: string;
        plot: Plot;
        section: string;
        plotNumber: string;
        type?: 'deceased' | 'plot';
    }) => {
        setMapSearchQuery(suggestion.name);
        setIsDropdownOpen(false);

        setSelectedPlot(suggestion.plot);
        if (suggestion.type === 'deceased') {
            setSelectedDeceasedName(suggestion.name);
        } else {
            setSelectedDeceasedName(null);
        }
        const pLat = suggestion.plot.lat || FALLBACK_PLOT_LAT;
        const pLng = suggestion.plot.lng || FALLBACK_PLOT_LNG;
        setFlyToCenter([pLat, pLng]);
        setFlyToZoom(20);

        setSearchFeedback(
            `📍 Selected ${suggestion.name} at Lot #${suggestion.plot.plot_number} (Section ${suggestion.plot.section})! Map zoomed to grave box & walking path calculated.`,
        );
        setTimeout(() => setSearchFeedback(null), 10000);
    };

    // Filter State
    const [filterType, setFilterType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    // Derived state for selected burial record and sidebar visibility
    const selectedBurial = useMemo(() => {
        if (!selectedPlot) return null;
        return burials.find((b) => b.plot_id === selectedPlot.id);
    }, [selectedPlot, burials]);

    const showSidebar = Boolean(selectedPlot);

    const handleClearSelection = () => {
        setSelectedPlot(null);
        setSelectedDeceasedName(null);
        setSearchFeedback(null);
        setMapSearchQuery('');
    };

    const handleDownloadOfflineMap = () => {
        if (!selectedPlot) return;

        const deceasedName =
            selectedDeceasedName ||
            selectedBurial?.deceased_name ||
            selectedPlot?.deceased_name ||
            selectedPlot?.inquirer_name ||
            `Lot #${selectedPlot.plot_number}`;

        // Border polygon (placement-order chain)
        const borderPlots = cemeteryPlots.filter((p) => p.lot_type === 'border');
        const borderCoords = orderPlotsByConnectionChain(borderPlots, cemeteryConnections).map((p) => [
            p.lat || selectedPlot.lat || FALLBACK_PLOT_LAT,
            p.lng || selectedPlot.lng || FALLBACK_PLOT_LNG,
        ]);

        // Entrance node
        const entrance = findEntrancePlot(cemeteryPlots);

        // Walking path to the deceased box (from the computed route)
        const pathCoords = extendedPathSteps
            .map((s) => [s.lat, s.lng] as [number, number]);

        const targetCoords: [number, number] = [
            selectedPlot.lat || FALLBACK_PLOT_LAT,
            selectedPlot.lng || FALLBACK_PLOT_LNG,
        ];

        const safeName = (name: string) =>
            name.replace(/[<>&"']/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[ch] as string));

        const escJs = (val: unknown) =>
            JSON.stringify(val).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');

        const borderJson = escJs(borderCoords);
        const pathJson = escJs(pathCoords);
        const targetJson = escJs([targetCoords[0], targetCoords[1]]);
        const entranceJson = entrance
            ? escJs([entrance.lat || targetCoords[0], entrance.lng || targetCoords[1]])
            : 'null';
        const nameJson = escJs(deceasedName);
        const targetNumberJson = escJs(`Lot #${selectedPlot.plot_number}`);
        const sectionJson = escJs(`Section ${selectedPlot.section}`);
        const targetColor =
            selectedPlot.status === 'available' ? '#00c853' : selectedPlot.status === 'reserved' ? '#f59e0b' : '#ff1744';
        const colorJson = escJs(targetColor);

        const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Himlayan Memorial Park - Offline Map</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    #map { z-index: 1; }
    .header { position: absolute; top: 12px; left: 12px; right: 12px; z-index: 1000; background: rgba(6,78,59,0.95); color: #fff; border-radius: 14px; padding: 12px 16px; box-shadow: 0 6px 18px rgba(0,0,0,0.25); pointer-events: none; }
    .header h1 { margin: 0; font-size: 15px; letter-spacing: 0.3px; }
    .header p { margin: 3px 0 0; font-size: 11px; color: #a7f3d0; }
    .legend { position: absolute; bottom: 18px; left: 12px; z-index: 1000; background: rgba(255,255,255,0.95); border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 14px; font-size: 11px; color: #0f172a; box-shadow: 0 4px 14px rgba(0,0,0,0.12); }
    .legend div { display: flex; align-items: center; gap: 8px; margin: 4px 0; }
    .dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
    .swatch { width: 12px; height: 12px; border-radius: 2px; display: inline-block; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏛️ Himlayan Memorial Park — Offline Map</h1>
    <p>${safeName(deceasedName)} • ${safeName(selectedPlot.section ? `Section ${selectedPlot.section}` : '')} • ${safeName(`Lot #${selectedPlot.plot_number}`)}</p>
  </div>
  <div id="map"></div>
  <div class="legend">
    <div><span class="swatch" style="background:${safeName(targetColor)}; border:1px solid #fff;"></span> <strong>${safeName(deceasedName)}</strong> Grave Box</div>
    ${entrance ? '<div><span class="dot" style="background:#0d9488; border:2px solid #f59e0b;"></span> Entrance</div>' : ''}
    ${borderCoords.length >= 3 ? '<div><span class="swatch" style="background:#14b8a6;"></span> Cemetery Border</div>' : ''}
    ${pathCoords.length >= 2 ? '<div><span style="width:16px; height:4px; background:#059669; border-radius:2px; display:inline-block;"></span> Walking Path</div>' : ''}
  </div>
  <script>
    (function () {
      var border = ${borderJson};
      var path = ${pathJson};
      var target = ${targetJson};
      var entrance = ${entranceJson};
      var name = ${nameJson};
      var lotNumber = ${targetNumberJson};
      var section = ${sectionJson};
      var color = ${colorJson};

      var points = [];
      if (target) points.push(L.latLng(target[0], target[1]));
      if (entrance) points.push(L.latLng(entrance[0], entrance[1]));
      if (border.length >= 3) border.forEach(function (c) { points.push(L.latLng(c[0], c[1])); });
      if (path.length >= 2) path.forEach(function (c) { points.push(L.latLng(c[0], c[1])); });

      var map = L.map('map');
      if (points.length > 0) {
        map.fitBounds(L.latLngBounds(points).pad(0.15));
      } else {
        map.setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM);
      }

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 24,
        maxNativeZoom: 20
      }).addTo(map);

      if (border.length >= 3) {
        L.polygon(border, { color: '#0d9488', weight: 3, fillColor: '#14b8a6', fillOpacity: 0.12, dashArray: '6, 6' }).addTo(map);
      }

      if (entrance) {
        var entranceIcon = L.divIcon({
          className: '',
          html: '<div style="background-color:#0d9488; border-radius:50%; border:2.5px solid #f59e0b; box-shadow:0 0 10px #f59e0b, 0 0 5px #0d9488; width:22px; height:22px; display:flex; align-items:center; justify-content:center;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"/><path d="M2 20h20"/><path d="M14 12v.01"/></svg></div>',
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });
        L.marker(entrance, { icon: entranceIcon }).addTo(map).bindPopup('<strong>Entrance</strong><br/>Start your walk here.');
      }

      if (path.length >= 2) {
        L.polyline(path, { color: '#059669', weight: 6, opacity: 0.95, dashArray: '8, 8' }).addTo(map);
      }

      if (target) {
        var boxIcon = L.divIcon({
          className: '',
          html: '<div style="background-color:' + color + '; border:2px solid #ffffff; border-radius:3px; width:26px; height:34px; box-shadow:0 0 12px ' + color + ';"></div>',
          iconSize: [26, 34],
          iconAnchor: [13, 17]
        });
        var m = L.marker(target, { icon: boxIcon, zIndexOffset: 1000 }).addTo(map);
        m.bindPopup('<strong>' + name + '</strong><br/>' + section + '<br/>' + lotNumber);
        m.openPopup();
      }
    })();
  <\/script>
</body>
</html>`;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const fileUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = `Himlayan_Offline_Map_${deceasedName.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(fileUrl);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [plotsRes, burialsRes, connRes] = await Promise.all([
                    window.axios.get('/api/plots', { params: { limit: 10000 } }),
                    window.axios.get('/api/burials').catch(() => ({ data: { success: false, data: [] } })),
                    window.axios.get('/api/plot-connections').catch(() => ({ data: { success: false, data: [] } })),
                ]);

                const loadedPlots: Plot[] = plotsRes.data?.success ? plotsRes.data.data : [];
                const loadedBurials: Burial[] = burialsRes.data?.success ? burialsRes.data.data : [];
                const loadedConnections: PlotConnection[] = connRes.data?.success ? connRes.data.data : [];

                setPlots(loadedPlots);
                setBurials(loadedBurials);
                setConnections(loadedConnections);

                // Check if query params specify search
                const searchQueryParam =
                    searchParams.get('search') || searchParams.get('q') || searchParams.get('query');

                if (searchQueryParam) {
                    setMapSearchQuery(searchQueryParam);
                    executeDeceasedSearch(searchQueryParam, loadedPlots, loadedBurials);
                }
            } catch (err) {
                console.error('Error loading map data:', err);
            }
        };
        fetchData();

        const handleRemoteUpdate = () => {
            fetchData();
        };
        window.addEventListener('himlayan_plots_updated', handleRemoteUpdate);
        window.addEventListener('storage', handleRemoteUpdate);
        return () => {
            window.removeEventListener('himlayan_plots_updated', handleRemoteUpdate);
            window.removeEventListener('storage', handleRemoteUpdate);
        };
    }, [searchParams]);

    const executeDeceasedSearch = async (
        queryText: string,
        plotList: Plot[] = plots,
        burialList: Burial[] = burials,
    ) => {
        if (!queryText || !queryText.trim()) return;
        const q = queryText.trim().toLowerCase();
        await incrementMapUsageCount();

        let matchedPlot: Plot | undefined = undefined;
        let deceasedInfo: string | null = null;

        // 1. Check burial records
        const matchedBurial = burialList.find(
            (b) => b.deceased_name.toLowerCase().includes(q) || (b.notes && b.notes.toLowerCase().includes(q)),
        );

        if (matchedBurial) {
            matchedPlot = plotList.find((p) => p.id === matchedBurial.plot_id);
            deceasedInfo = matchedBurial.deceased_name;
        }

        // 2. Check plots directly (including nested deceased occupant arrays/JSON notes)
        if (!matchedPlot) {
            for (const p of plotList) {
                const deceasedNames = getPlotDeceasedNames(p).filter((n) => n && n.trim().length > 0);
                const match = deceasedNames.find((n) => n.toLowerCase().includes(q));
                if (match) {
                    matchedPlot = p;
                    deceasedInfo = match;
                    break;
                }
            }

            if (!matchedPlot) {
                matchedPlot = plotList.find(
                    (p) =>
                        (p.deceased_name && p.deceased_name.toLowerCase().includes(q)) ||
                        (p.inquirer_name && p.inquirer_name.toLowerCase().includes(q)) ||
                        p.plot_number.toLowerCase() === q ||
                        p.plot_number.toLowerCase().includes(q) ||
                        p.section.toLowerCase().includes(q) ||
                        (p.notes && p.notes.toLowerCase().includes(q)),
                );
                if (matchedPlot) {
                    deceasedInfo = matchedPlot.deceased_name || matchedPlot.inquirer_name || null;
                }
            }
        }

        if (matchedPlot) {
            setSelectedPlot(matchedPlot);
            if (deceasedInfo) {
                setSelectedDeceasedName(deceasedInfo);
            } else {
                setSelectedDeceasedName(null);
            }
            setIsSidebarCollapsed(false);
            const pLat = matchedPlot.lat || FALLBACK_PLOT_LAT;
            const pLng = matchedPlot.lng || FALLBACK_PLOT_LNG;

            // Pan & Zoom directly to the exact grave coordinates with high detail zoom
            setFlyToCenter([pLat, pLng]);
            setFlyToZoom(20);

            const nameDisplay = deceasedInfo ? `${deceasedInfo} ` : '';
            setSearchFeedback(
                `📍 Found ${nameDisplay}at Lot #${matchedPlot.plot_number} (Section ${matchedPlot.section})! Map zoomed to grave box & walking path calculated.`,
            );
        } else {
            setSearchFeedback(
                `No grave or lot record found matching "${queryText}". Try searching for Maria or Lot A-12.`,
            );
        }

        setTimeout(() => setSearchFeedback(null), 10000);
    };

    const handleLovedOneSearch = (e: React.FormEvent) => {
        e.preventDefault();
        executeDeceasedSearch(mapSearchQuery);
    };

    // Auto-download the offline map when the page is opened via the QR code (?download=1)
    const autoDownloadedRef = useRef(false);
    useEffect(() => {
        if (searchParams.get('download') !== '1') return;
        if (!selectedPlot) return;
        if (autoDownloadedRef.current) return;
        autoDownloadedRef.current = true;
        const t = setTimeout(() => handleDownloadOfflineMap(), 600);
        return () => clearTimeout(t);
    }, [searchParams, selectedPlot]);

    const polylinePositions: [number, number][] = extendedPathSteps.map((step) => [step.lat, step.lng]);

    const defaultCenter: [number, number] = DEFAULT_MAP_CENTER;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-body pt-20 flex flex-col h-screen overflow-hidden">
            <Navbar />

            <div className="flex-1 flex flex-col-reverse lg:flex-row relative overflow-hidden">
                {/* Map Container (Main View Area) */}
                <div className="flex-1 h-full relative">
                    {/* Bottom Center Search Bar Overlay (Landing Page Pill Design) */}
                    <div
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4 pointer-events-auto"
                        ref={dropdownRef}
                    >
                        <form
                            onSubmit={handleLovedOneSearch}
                            className="w-full bg-white/95 backdrop-blur-md rounded-full px-2 py-2 flex items-center gap-2 shadow-2xl border border-slate-200/90"
                        >
                            <Search className="w-5 h-5 text-emerald-800 ml-3 shrink-0" />
                            <input
                                type="text"
                                value={mapSearchQuery}
                                onChange={(e) => {
                                    setMapSearchQuery(e.target.value);
                                    setIsDropdownOpen(true);
                                }}
                                onFocus={() => setIsDropdownOpen(true)}
                                placeholder="Find a loved one (e.g. Maria, Santos)..."
                                className="w-full bg-transparent text-slate-900 placeholder-slate-500 text-sm font-body focus:outline-none px-2 font-medium appearance-none border-none"
                            />
                            <button
                                type="submit"
                                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-full p-3 font-semibold shadow-md transition-transform hover:scale-105 shrink-0 cursor-pointer"
                            >
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>

                        {/* Auto-suggest Dropdown Filter (Opens upwards above bottom search bar) */}
                        {isDropdownOpen && mapSearchQuery.trim() !== '' && (
                            <div className="absolute left-4 right-4 bottom-full mb-2 bg-white border border-slate-200/90 rounded-2xl shadow-2xl z-50 overflow-y-auto max-h-64 divide-y divide-slate-100 text-left animate-fadeIn">
                                {searchSuggestions.length > 0 ? (
                                    searchSuggestions.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => handleSelectSuggestion(item)}
                                            className="w-full px-4 py-3 hover:bg-emerald-50/70 flex items-center justify-between transition-colors group cursor-pointer"
                                        >
                                            <div>
                                                <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 flex items-center gap-2">
                                                    <span>{item.name}</span>
                                                    {item.type === 'deceased' && (
                                                        <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded font-semibold uppercase">
                                                            Deceased
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-slate-500 mt-0.5 font-medium flex items-center gap-1">
                                                    <MapPin className="w-3 h-3 text-emerald-600 inline shrink-0" />
                                                    <span>Himlayan Memorial Park • Section {item.section}</span>
                                                    {item.dateStr && ` (${item.dateStr})`}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 group-hover:text-emerald-800">
                                                <span>Locate on Map</span>
                                                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-xs text-slate-500 italic">
                                        No matching records found for "{mapSearchQuery}". Try "Maria", "Santos", or
                                        "Section A".
                                    </div>
                                )}
                            </div>
                        )}

                        {searchFeedback && (
                            <div className="text-xs font-medium text-emerald-900 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl border border-emerald-200 shadow-lg mt-2 text-center animate-fadeIn">
                                {searchFeedback}
                            </div>
                        )}
                    </div>

                    <MapContainer
                        center={defaultCenter}
                        zoom={16}
                        maxZoom={24}
                        scrollWheelZoom={true}
                        zoomControl={false}
                        className="h-full w-full z-10"
                    >
                        <ZoomControl position="bottomright" />
                        <ZoomListener onZoom={setZoomLevel} />
                        <MapFlyToController center={flyToCenter} zoom={flyToZoom} />

                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                            maxZoom={24}
                            maxNativeZoom={20}
                        />

                        {/* Master Perimeter Polygon Overlay (grouped by cemetery_id to avoid crossover lines) */}
                        {(() => {
                            const borderPlots = plots.filter((p) => p.lot_type === 'border');
                            const groupedBorders: { [key: string]: Plot[] } = {};
                            borderPlots.forEach((p) => {
                                const cid = p.cemetery_id || DEFAULT_CEMETERY_ID;
                                if (!groupedBorders[cid]) {
                                    groupedBorders[cid] = [];
                                }
                                groupedBorders[cid].push(p);
                            });

                            return Object.entries(groupedBorders).map(([cid, group]) => {
                                if (group.length >= 3) {
                                    const sorted = orderPlotsByConnectionChain(group, connections);
                                    const coords = sorted.map(
                                        (p) => [p.lat || FALLBACK_PLOT_LAT, p.lng || FALLBACK_PLOT_LNG] as [number, number],
                                    );
                                    return (
                                        <Polygon
                                            key={`border-poly-${cid}`}
                                            positions={coords}
                                            pathOptions={{
                                                color: '#0d9488',
                                                weight: 3,
                                                fillColor: '#14b8a6',
                                                fillOpacity: 0.12,
                                                dashArray: '6, 6',
                                            }}
                                        />
                                    );
                                }
                                return null;
                            });
                        })()}

                        {/* Connected Path Nodes Line (persisted connections, grouped by cemetery_id) */}
                        {(() => {
                            const groupedConns: { [key: string]: PlotConnection[] } = {};
                            connections.forEach((conn) => {
                                const cid = conn.cemetery_id || DEFAULT_CEMETERY_ID;
                                if (!groupedConns[cid]) {
                                    groupedConns[cid] = [];
                                }
                                groupedConns[cid].push(conn);
                            });

                            return Object.entries(groupedConns).map(([cid, group]) => {
                                const lines = group
                                    .map((conn) => {
                                        const fromPlot = plots.find((p) => p.id === conn.from_plot_id);
                                        const toPlot = plots.find((p) => p.id === conn.to_plot_id);
                                        if (!fromPlot || !toPlot) return null;
                                        if (fromPlot.lot_type === 'border' && toPlot.lot_type === 'border') return null;
                                        return (
                                            <Polyline
                                                key={`conn-line-${conn.id}`}
                                                positions={[
                                                    [fromPlot.lat || FALLBACK_PLOT_LAT, fromPlot.lng || FALLBACK_PLOT_LNG] as [number, number],
                                                    [toPlot.lat || FALLBACK_PLOT_LAT, toPlot.lng || FALLBACK_PLOT_LNG] as [number, number],
                                                ]}
                                                pathOptions={{
                                                    color: '#14b8a6',
                                                    weight: 3.5,
                                                    dashArray: '6, 6',
                                                    lineCap: 'round',
                                                    lineJoin: 'round',
                                                }}
                                            />
                                        );
                                    })
                                    .filter(Boolean);

                                if (lines.length === 0) {
                                    // Fallback for legacy data without persisted connections: connect path/entrance nodes
                                    const pathPlots = plots.filter(
                                        (p) =>
                                            p.lot_type === 'path' ||
                                            p.lot_type === 'entrance',
                                    );
                                    const groupPlots = pathPlots.filter(
                                        (p) => (p.cemetery_id || DEFAULT_CEMETERY_ID) === cid,
                                    );
                                    if (groupPlots.length <= 1) return null;
                                    const sorted = [...groupPlots].sort((a, b) => {
                                        if (a.lot_type === 'entrance' && b.lot_type !== 'entrance') return -1;
                                        if (b.lot_type === 'entrance' && a.lot_type !== 'entrance') return 1;
                                        const numA = parseInt(a.plot_number.split('-')[1] || '0', 10);
                                        const numB = parseInt(b.plot_number.split('-')[1] || '0', 10);
                                        if (numA && numB) return numA - numB;
                                        return plots.indexOf(a) - plots.indexOf(b);
                                    });
                                    return (
                                        <Polyline
                                            key={`path-line-${cid}`}
                                            positions={sorted.map(
                                                (p) => [p.lat || FALLBACK_PLOT_LAT, p.lng || FALLBACK_PLOT_LNG] as [number, number],
                                            )}
                                            pathOptions={{
                                                color: '#14b8a6',
                                                weight: 3.5,
                                                dashArray: '6, 6',
                                                lineCap: 'round',
                                                lineJoin: 'round',
                                            }}
                                        />
                                    );
                                }

                                return <React.Fragment key={`conns-${cid}`}>{lines}</React.Fragment>;
                            });
                        })()}

                        {/* Gate Markers From Cemetery Entrance Plots */}
                        {plots
                            .filter((p) => p.lot_type === 'entrance')
                            .map((plot) => (
                                <Marker
                                    key={`gate-${plot.id}`}
                                    position={[plot.lat || FALLBACK_PLOT_LAT, plot.lng || FALLBACK_PLOT_LNG]}
                                    icon={gateIcon}
                                >
                                    <Popup>
                                        <div className="text-slate-900 text-xs font-bold">
                                            {plot.plot_number}
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}

                        {/* Plot Markers (keep all cemetery assets visible; the searched plot is highlighted separately) */}
                        {plots
                            .filter((plot) => {
                                if (plot.lot_type === 'entrance') return false; // entrances rendered as gate markers below
                                if (filterType !== 'all' && plot.lot_type !== filterType) return false;
                                if (filterStatus !== 'all' && plot.status !== filterStatus) return false;
                                return true;
                            })
                            .map((plot) => {
                                const isTrackNode =
                                    plot.lot_type === 'path' || plot.lot_type === 'border';
                                const pLat = plot.lat || FALLBACK_PLOT_LAT;
                                const pLng = plot.lng || FALLBACK_PLOT_LNG;
                                const burialRecord = burials.find((b) => b.plot_id === plot.id);

                                const dobStr = burialRecord?.date_of_birth
                                    ? new Date(burialRecord.date_of_birth).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric',
                                      })
                                    : 'May 12, 1945';

                                const dodStr = burialRecord?.date_of_death
                                    ? new Date(burialRecord.date_of_death).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric',
                                      })
                                    : plot.burial_date
                                      ? new Date(plot.burial_date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })
                                      : 'October 24, 2021';

                                const burialDateStr = plot.burial_date
                                    ? new Date(plot.burial_date).toLocaleString('en-US', {
                                          dateStyle: 'medium',
                                          timeStyle: 'short',
                                      })
                                    : burialRecord?.burial_date
                                      ? new Date(burialRecord.burial_date).toLocaleString('en-US', {
                                            dateStyle: 'medium',
                                            timeStyle: 'short',
                                        })
                                      : 'To Be Scheduled';

                                const isOccupied =
                                    plot.status === 'occupied' ||
                                    plot.status === 'full' ||
                                    Boolean(plot.deceased_name || burialRecord?.deceased_name);
                                const isReserved = plot.status === 'reserved' && !isOccupied;

                                // Path & border nodes are non-selectable in the public map: show them but
                                // never open the pathfinding sidebar or a popup when clicked.
                                if (isTrackNode) {
                                    return (
                                        <Marker
                                            key={plot.id}
                                            position={[pLat, pLng]}
                                            icon={createPlotIcon(plot, zoomLevel)}
                                            interactive={false}
                                        />
                                    );
                                }

                                return (
                                    <Marker
                                        key={plot.id}
                                        position={[pLat, pLng]}
                                        icon={createPlotIcon(plot, zoomLevel)}
                                        eventHandlers={{
                                            click: () => {
                                                setSelectedPlot(plot);
                                                const names = getPlotDeceasedNames(plot).filter(
                                                    (n) => n && n.trim().length > 0,
                                                );
                                                if (names.length > 0) {
                                                    setSelectedDeceasedName(names[0]);
                                                } else {
                                                    setSelectedDeceasedName(null);
                                                }
                                                setFlyToCenter([pLat, pLng]);
                                                setFlyToZoom(19);
                                            },
                                        }}
                                    >
                                        <Popup>
                                            <div className="text-slate-900 font-body text-xs p-1 space-y-1">
                                                {/* Popup Content */}
                                                {isOccupied || isReserved ? (
                                                    <>
                                                        <span className="font-bold text-sm block text-slate-900">
                                                            {plot.deceased_name ||
                                                                burialRecord?.deceased_name ||
                                                                (isReserved ? 'Reserved Lot' : 'Occupied Lot')}
                                                        </span>
                                                        <span className="text-slate-700 font-semibold text-xs block">
                                                            Lot #{plot.plot_number}
                                                        </span>
                                                        <span className="text-slate-500 text-xs block">
                                                            Section {plot.section} • {plot.lot_type}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="font-bold text-sm block text-slate-900">
                                                            Lot #{plot.plot_number}
                                                        </span>
                                                        <span className="text-slate-600 text-xs block">
                                                            Section {plot.section} • {plot.lot_type}
                                                        </span>
                                                    </>
                                                )}

                                                {/* 1. OCCUPIED / RED BOX: Date of Birth and Death (NO Price) */}
                                                {isOccupied && (
                                                    <div className="bg-rose-50/90 border border-rose-200 rounded p-1.5 text-[11px] text-rose-950 font-medium space-y-0.5 mt-1">
                                                        <div className="flex items-center gap-1 font-bold text-rose-900">
                                                            <Calendar className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                                            <span>Memorial Dates:</span>
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-rose-900">Born:</span>{' '}
                                                            {dobStr}
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-rose-900">Died:</span>{' '}
                                                            {dodStr}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* 2. RESERVED / YELLOW BOX: Scheduled Burial Date (NO Price) */}
                                                {isReserved && (
                                                    <div className="bg-amber-50 border border-amber-300 rounded p-1.5 text-[11px] text-amber-950 font-medium space-y-0.5 mt-1">
                                                        <div className="flex items-center gap-1 font-bold text-amber-900">
                                                            <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                                            <span>Scheduled Burial:</span>
                                                        </div>
                                                        <div className="font-semibold text-amber-900">{burialDateStr}</div>
                                                    </div>
                                                )}

                                                {/* 3. AVAILABLE / GREEN BOX: Show Price */}
                                                {plot.status === 'available' && !isOccupied && !isReserved && (
                                                    <span className="font-bold text-emerald-700 block mt-1 text-sm">
                                                        ₱{plot.price?.toLocaleString() || '35,000'}
                                                    </span>
                                                )}
                                            </div>
                                        </Popup>
                                    </Marker>
                                );
                            })}

                        {/* Selected / Searched Plot Special Pulsing Highlight Marker */}
                        {selectedPlot &&
                            (() => {
                                const selectedBurialRecord = burials.find((b) => b.plot_id === selectedPlot.id);
                                const selDobStr = selectedBurialRecord?.date_of_birth
                                    ? new Date(selectedBurialRecord.date_of_birth).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric',
                                      })
                                    : 'May 12, 1945';

                                const selDodStr = selectedBurialRecord?.date_of_death
                                    ? new Date(selectedBurialRecord.date_of_death).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric',
                                      })
                                    : selectedPlot.burial_date
                                      ? new Date(selectedPlot.burial_date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })
                                      : 'October 24, 2021';

                                const selBurialDateStr = selectedPlot.burial_date
                                    ? new Date(selectedPlot.burial_date).toLocaleString('en-US', {
                                          dateStyle: 'medium',
                                          timeStyle: 'short',
                                      })
                                    : selectedBurialRecord?.burial_date
                                      ? new Date(selectedBurialRecord.burial_date).toLocaleString('en-US', {
                                            dateStyle: 'medium',
                                            timeStyle: 'short',
                                        })
                                      : 'To Be Scheduled';

                                const isSelOccupied =
                                    selectedPlot.status === 'occupied' ||
                                    selectedPlot.status === 'full' ||
                                    Boolean(selectedPlot.deceased_name || selectedBurialRecord?.deceased_name);
                                const isSelReserved = selectedPlot.status === 'reserved' && !isSelOccupied;

                                return (
                                    <Marker
                                        position={[selectedPlot.lat || FALLBACK_PLOT_LAT, selectedPlot.lng || FALLBACK_PLOT_LNG]}
                                        icon={L.divIcon({
                                            className: 'custom-selected-plot-highlight',
                                            html: `
                      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
                        <div style="position: absolute; width: 48px; height: 48px; border-radius: 50%; background-color: rgba(16, 185, 129, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                        <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; border: 3px solid #10b981; background-color: rgba(16, 185, 129, 0.25);"></div>
                        <div style="position: relative; width: 26px; height: 26px; border-radius: 50%; background-color: #047857; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">📍</div>
                      </div>
                    `,
                                            iconSize: [48, 48],
                                            iconAnchor: [24, 24],
                                        })}
                                    >
                                        <Popup autoPan={false}>
                                            <div className="text-slate-900 font-body text-xs p-1 space-y-1.5 max-w-xs">
                                                <div className="bg-emerald-950 text-white rounded-md p-2 shadow-sm border border-emerald-800">
                                                    <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                                                        {selectedPlot.deceased_name
                                                            ? 'Resting Place / Grave'
                                                            : 'Target Lot Location'}
                                                    </span>
                                                    <span className="font-heading italic font-bold text-sm block text-white mt-0.5">
                                                        {selectedPlot.deceased_name ||
                                                            `Lot #${selectedPlot.plot_number}`}
                                                    </span>
                                                </div>
                                                <div className="text-slate-700 text-[11px] space-y-1">
                                                    <div>
                                                        <strong className="text-slate-900">Grave Box #:</strong> Lot #
                                                        {selectedPlot.plot_number}
                                                    </div>
                                                    <div>
                                                        <strong className="text-slate-900">Section:</strong> Section{' '}
                                                        {selectedPlot.section}
                                                    </div>
                                                    <div>
                                                        <strong className="text-slate-900">Lot Category:</strong>{' '}
                                                        {selectedPlot.lot_type}
                                                    </div>

                                                    {/* 1. OCCUPIED / FULL (RED): Date of Birth & Death */}
                                                    {isSelOccupied && (
                                                        <div className="bg-rose-50 border border-rose-200 text-rose-950 p-1.5 rounded text-[11px] mt-1 space-y-0.5">
                                                            <div>
                                                                <strong className="text-rose-900">Born:</strong>{' '}
                                                                {selDobStr}
                                                            </div>
                                                            <div>
                                                                <strong className="text-rose-900">Died:</strong>{' '}
                                                                {selDodStr}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* 2. RESERVED (YELLOW): Burial Date */}
                                                    {isSelReserved && (
                                                        <div className="bg-amber-50 border border-amber-300 text-amber-950 p-1.5 rounded text-[11px] mt-1 space-y-0.5">
                                                            <strong className="text-amber-900 block font-bold">
                                                                📅 Scheduled Burial:
                                                            </strong>
                                                            <div className="font-semibold text-amber-900">
                                                                {selBurialDateStr}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* 3. AVAILABLE (GREEN): Price */}
                                                    {selectedPlot.status === 'available' &&
                                                        !isSelOccupied &&
                                                        !isSelReserved && (
                                                            <div className="font-bold text-emerald-700 text-xs mt-1">
                                                                Price: ₱
                                                                {selectedPlot.price?.toLocaleString() || '35,000'}
                                                            </div>
                                                        )}
                                                </div>
                                                <div className="pt-1">
                                                    <button
                                                        onClick={() => {
                                                            setFlyToCenter([
                                                                selectedPlot.lat || FALLBACK_PLOT_LAT,
                                                                selectedPlot.lng || FALLBACK_PLOT_LNG,
                                                            ]);
                                                            setFlyToZoom(20);
                                                        }}
                                                        className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-1.5 px-2 rounded text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-all shadow-sm"
                                                    >
                                                        <Navigation className="w-3 h-3" />
                                                        <span>Re-Calculate Walking Path</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                );
                            })()}

                        {/* Calculated A* Polyline Path */}
                        {polylinePositions.length > 0 && (
                            <Polyline
                                positions={polylinePositions}
                                pathOptions={{ color: '#059669', weight: 6, opacity: 0.95, dashArray: '8, 8' }}
                            />
                        )}
                    </MapContainer>

                    {/* Floating Top Left Legend Box (Copied from Engineer Workspace) */}
                    <div
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-30 flex flex-col items-start gap-3 pointer-events-auto"
                    >
                        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl w-56 sm:w-60 overflow-hidden text-slate-900 transition-all">
                            {/* Header */}
                            <div
                                onClick={() => setIsLegendOpen(!isLegendOpen)}
                                className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-200/80 select-none"
                            >
                                <span className="font-heading text-base font-semibold text-slate-900 tracking-tight">
                                    Legend:
                                </span>
                                {isLegendOpen ? (
                                    <ChevronUp className="w-5 h-5 text-slate-800 stroke-[2.2]" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-slate-800 stroke-[2.2]" />
                                )}
                            </div>

                            {/* Legend Content */}
                            {isLegendOpen && (
                                <div className="divide-y divide-slate-100 text-xs sm:text-sm font-body max-h-64 overflow-y-auto">
                                    {/* Available */}
                                    <div className="px-4 py-2.5 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-900 font-bold">•</span>
                                            <span className="text-slate-800 font-medium">Available</span>
                                        </div>
                                        <div className="w-4 h-5 bg-[#00c853] rounded-[2px] shadow-2xs" />
                                    </div>

                                    {/* Reserved */}
                                    <div className="px-4 py-2.5 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-900 font-bold">•</span>
                                            <span className="text-slate-800 font-medium">Reserved</span>
                                        </div>
                                        <div className="w-4 h-5 bg-[#f59e0b] rounded-[2px] shadow-2xs" />
                                    </div>

                                    {/* Occupied */}
                                    <div className="px-4 py-2.5 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-900 font-bold">•</span>
                                            <span className="text-slate-800 font-medium">Occupied</span>
                                        </div>
                                        <div className="w-4 h-5 bg-[#ff1744] rounded-[2px] shadow-2xs" />
                                    </div>

                                    {/* Apartment Type */}
                                    <div className="px-4 py-2.5 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-900 font-bold">•</span>
                                            <span className="text-slate-800 font-medium">Apartment Type</span>
                                        </div>
                                        <div className="w-5 h-6 border-2 border-slate-900 rounded-[3px] bg-white flex items-center justify-center font-bold text-xs text-slate-900">
                                            2
                                        </div>
                                    </div>

                                    {/* Ground Type */}
                                    <div className="px-4 py-2.5 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-900 font-bold">•</span>
                                            <span className="text-slate-800 font-medium">Ground Type</span>
                                        </div>
                                        <div className="w-5 h-6 border-2 border-slate-900 rounded-[3px] bg-white flex items-center justify-center">
                                            <div className="w-2.5 h-2.5 border-[1.5px] border-slate-900 rotate-45" />
                                        </div>
                                    </div>

                                    {/* Entrance Node */}
                                    <div className="px-4 py-2 flex items-center justify-between bg-teal-50/50">
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-900 font-bold">•</span>
                                            <span className="text-slate-900 font-bold text-xs">Entrance Node</span>
                                        </div>
                                        <div className="w-5 h-5 rounded-full border-2 border-amber-500 bg-teal-600 shadow-2xs flex items-center justify-center shrink-0">
                                            <svg
                                                width="10"
                                                height="10"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="#ffffff"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" />
                                                <path d="M2 20h20" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Path */}
                                    <div className="px-4 py-2.5 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-900 font-bold">•</span>
                                            <span className="text-slate-800 font-medium">Path</span>
                                        </div>
                                        <div className="w-5 h-5 rounded-full border-2 border-teal-700 bg-teal-500 shadow-2xs" />
                                    </div>

                                    {/* Border */}
                                    <div className="px-4 py-2.5 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-900 font-bold">•</span>
                                            <span className="text-slate-800 font-medium">Border</span>
                                        </div>
                                        <div className="w-5 h-5 rounded-full border-2 border-emerald-700 bg-emerald-500 shadow-2xs" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Floating Expand Toggle Button when collapsed */}
                    {showSidebar && isSidebarCollapsed && (
                        <button
                            onClick={() => setIsSidebarCollapsed(false)}
                            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-2.5 rounded-xl shadow-2xl border border-emerald-600 flex items-center gap-2 text-xs transition-all cursor-pointer hover:scale-105 active:scale-95 animate-fadeIn"
                            title="Open Pathfinding Navigator"
                        >
                            <Navigation className="w-4 h-4 text-emerald-300" />
                            <span>Pathfinding Navigator</span>
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Right Side Repurposed Control Panel (Only appears when a plot or deceased name is searched / selected) */}
                {showSidebar && !isSidebarCollapsed && (
                    <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 p-6 flex flex-col justify-between z-20 overflow-y-auto max-h-[50vh] lg:max-h-none shadow-xl animate-fadeIn">
                        <div className="space-y-5">
                            {/* Header + Collapse & Close buttons */}
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300">
                                        OFFLINE MEMORIAL PASS
                                    </span>
                                    <h2 className="text-xl font-heading italic font-bold text-slate-900 mt-1">
                                        Pathfinding Navigator
                                    </h2>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setIsSidebarCollapsed(true)}
                                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                        title="Collapse panel"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                        <span className="hidden sm:inline text-xs font-semibold">Collapse</span>
                                    </button>
                                    <button
                                        onClick={handleClearSelection}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                        title="Close panel"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Deceased Profile Card */}
                            <div className="bg-gradient-to-br from-emerald-950 to-slate-900 text-white rounded-2xl p-4 shadow-md border border-emerald-800 space-y-2">
                                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                                    <span>🌹 Deceased Memorial Record</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold font-heading text-white">
                                        {selectedDeceasedName ||
                                            selectedBurial?.deceased_name ||
                                            selectedPlot?.deceased_name ||
                                            selectedPlot?.inquirer_name ||
                                            (selectedPlot ? `Grave Lot #${selectedPlot.plot_number}` : 'Selected Record')}
                                    </h3>
                                    <div className="text-xs text-emerald-200/90 font-medium flex items-center gap-2 mt-1">
                                        <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                        <span>
                                            Born:{' '}
                                            {selectedBurial?.date_of_birth
                                                ? new Date(selectedBurial.date_of_birth).toLocaleDateString('en-US', {
                                                      month: 'short',
                                                      day: 'numeric',
                                                      year: 'numeric',
                                                  })
                                                : 'May 12, 1945'}
                                        </span>
                                        <span>•</span>
                                        <span>
                                            Died:{' '}
                                            {selectedBurial?.date_of_death
                                                ? new Date(selectedBurial.date_of_death).toLocaleDateString('en-US', {
                                                      month: 'short',
                                                      day: 'numeric',
                                                      year: 'numeric',
                                                  })
                                                : selectedPlot?.burial_date
                                                  ? new Date(selectedPlot.burial_date).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                    })
                                                  : 'October 24, 2021'}
                                        </span>
                                    </div>
                                </div>

                                {selectedPlot &&
                                    (() => {
                                        const occupantNames = getPlotDeceasedNames(selectedPlot).filter(
                                            (n) => n && n.trim().length > 0,
                                        );
                                        if (occupantNames.length > 1) {
                                            return (
                                                <div className="mt-2 pt-2 border-t border-emerald-800/50">
                                                    <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block mb-1">
                                                        Stacked Lot Occupants ({occupantNames.length}):
                                                    </span>
                                                    <div className="space-y-1">
                                                        {occupantNames.map((name, idx) => (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                onClick={() => setSelectedDeceasedName(name)}
                                                                className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition-all flex items-center justify-between border ${
                                                                    selectedDeceasedName === name
                                                                        ? 'bg-emerald-800/80 text-white font-bold border-emerald-500 shadow-sm'
                                                                        : 'bg-emerald-950/40 border-transparent hover:bg-emerald-950/80 text-emerald-200 hover:text-white'
                                                                }`}
                                                            >
                                                                <span className="truncate">🌹 Level {idx + 1}: {name}</span>
                                                                {selectedDeceasedName === name && (
                                                                    <span className="text-[9px] bg-emerald-600 border border-emerald-400 px-1.5 py-0.2 rounded font-bold uppercase shrink-0">
                                                                        Active
                                                                    </span>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}

                                <div className="pt-2 border-t border-emerald-800/80 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1.5 text-slate-300">
                                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                        <span>
                                            Himlayan Park • Section {selectedPlot?.section || 'A'} • Lot #
                                            {selectedPlot?.plot_number || 'A-01'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* QR Code Card */}
                            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col items-center text-center space-y-3">
                                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                                            window.location.origin +
                                                '/map?search=' +
                                                encodeURIComponent(
                                                    selectedDeceasedName ||
                                                        selectedBurial?.deceased_name ||
                                                        selectedPlot?.deceased_name ||
                                                        selectedPlot?.inquirer_name ||
                                                        `Lot #${selectedPlot?.plot_number || 'A-01'}`,
                                                ) +
                                                '&download=1',
                                        )}&color=064e3b`}
                                        alt="Download Offline Map QR Code"
                                        className="w-36 h-36 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-slate-900 block">Offline Map QR</span>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Scan with your camera to download an offline map of this grave location.
                                    </p>
                                </div>
                                <button
                                    onClick={handleDownloadOfflineMap}
                                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:scale-[1.02]"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Download Offline Map</span>
                                </button>
                            </div>

                            {/* Starting Landmark / Gate */}
                            {(() => {
                                const entrance = findEntrancePlot(cemeteryPlots);
                                return (
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                                        <label className="block text-xs font-semibold text-slate-700">
                                            Starting Gate / Landmark
                                        </label>
                                        <p className="text-xs text-slate-500">
                                            {entrance
                                                ? `${entrance.plot_number} (${entrance.lot_type}) • Section ${entrance.section}`
                                                : 'Walk through the cemetery main walkway'}
                                        </p>
                                    </div>
                                );
                            })()}

                            {/* Turn-by-Turn Pathfinding Result */}
                            {extendedTotalDistance !== null && extendedPathSteps.length > 0 && (
                                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-3">
                                    <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                                            Total Distance
                                        </span>
                                        <span className="text-sm font-bold font-heading text-slate-900">
                                            {extendedTotalDistance} meters
                                        </span>
                                    </div>

                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                        <span className="text-[11px] font-semibold text-slate-600 block">
                                            Turn-by-Turn Steps:
                                        </span>
                                        {extendedPathSteps.map((step, idx) => (
                                            <div key={idx} className="flex items-start gap-2 text-xs text-slate-800">
                                                <div className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <span className="font-semibold">{step.label}</span>
                                                    {step.distanceFromPrevious > 0 && (
                                                        <span className="text-[10px] text-slate-500 block">
                                                            Walk {step.distanceFromPrevious} meters
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MemorialMapPage;
