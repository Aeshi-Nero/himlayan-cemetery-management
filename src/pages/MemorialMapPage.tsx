import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, CircleMarker, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { Navbar } from '../components/Navbar';
import { Plot, PathNode, PathStep, Burial } from '../types';
import { apiClient } from '../api/client';
import { incrementMapUsageCount } from '../utils/mapUsageTracker';
import { MapPin, Navigation, Compass, Info, ArrowRight, Layers, CheckCircle2, Clock, Ban, Globe, Search, Sparkles, QrCode, Download, X, Calendar, ChevronUp, ChevronDown, ChevronRight, ChevronLeft, PanelRightClose, PanelRightOpen } from 'lucide-react';

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

  const baseW = width || (lotType === 'single' ? 14 : lotType === 'path' || lotType === 'border' || lotType === 'entrance' ? 12 : 18);
  const baseH = height || (lotType === 'single' ? 18 : lotType === 'path' || lotType === 'border' || lotType === 'entrance' ? 12 : 24);
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
      iconAnchor: [w/2, h/2],
    });
  } else if (lotType === 'border') {
    return L.divIcon({
      className: 'custom-plot-marker',
      html: `<div style="background-color: #10b981; border-radius: 50%; border: 2.5px solid #047857; box-shadow: 0 0 8px #10b981; cursor: pointer; ${styleStr}"></div>`,
      iconSize: [w, h],
      iconAnchor: [w/2, h/2],
    });
  } else if (!lotType || lotType === 'single') {
    return L.divIcon({
      className: 'custom-plot-marker',
      html: `<div style="background-color: ${color}; border: 2px solid white; border-radius: 2px; box-shadow: 0 0 8px ${color}; cursor: pointer; ${styleStr}"></div>`,
      iconSize: [w, h],
      iconAnchor: [w/2, h/2],
    });
  } else if (lotType === 'apartment') {
    return L.divIcon({
      className: 'custom-plot-marker',
      html: `<div style="background-color: ${color}; border: 2px solid white; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 10px; color: white; box-shadow: 0 0 8px ${color}; cursor: pointer; ${styleStr}">${capacity || 2}</div>`,
      iconSize: [w, h],
      iconAnchor: [w/2, h/2],
    });
  } else if (lotType === 'family') {
    return L.divIcon({
      className: 'custom-plot-marker',
      html: `<div style="background-color: ${color}; border: 2px solid white; border-radius: 3px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 8px ${color}; cursor: pointer; ${styleStr}"><div style="width: 6px; height: 6px; border: 1.5px solid white; transform: rotate(45deg);"></div></div>`,
      iconSize: [w, h],
      iconAnchor: [w/2, h/2],
    });
  } else {
    return L.divIcon({
      className: 'custom-plot-marker',
      html: `<div style="background-color: ${color}; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 8px ${color}; cursor: pointer; ${styleStr}"></div>`,
      iconSize: [w, h],
      iconAnchor: [w/2, h/2],
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
    return () => { map.off('zoomend', onZoomEnd); };
  }, [map, onZoom]);
  return null;
};

export const MemorialMapPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [plots, setPlots] = useState<Plot[]>([]);
  const [nodes, setNodes] = useState<PathNode[]>([]);
  const [burials, setBurials] = useState<Burial[]>([]);
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [zoomLevel, setZoomLevel] = useState(16);
  const [isLegendOpen, setIsLegendOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Map Pan / Zoom FlyTo
  const [flyToCenter, setFlyToCenter] = useState<[number, number] | null>(null);
  const [flyToZoom, setFlyToZoom] = useState<number>(19);

  // Pathfinding State
  const [fromNodeId, setFromNodeId] = useState('node-gate-1');
  const [toNodeId, setToNodeId] = useState('');
  const [pathSteps, setPathSteps] = useState<PathStep[]>([]);
  const [totalDistance, setTotalDistance] = useState<number | null>(null);
  const [loadingPath, setLoadingPath] = useState(false);

  // Search Loved One state
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      if (seenPlotIds.has(p.id)) return;
      const burialRecord = burials.find((b) => b.plot_id === p.id && b.deceased_name);
      const decName = p.deceased_name || burialRecord?.deceased_name;
      const inqName = p.inquirer_name;
      const pNum = p.plot_number;
      const sec = p.section;

      if (
        (decName && decName.toLowerCase().includes(query)) ||
        (inqName && inqName.toLowerCase().includes(query)) ||
        pNum.toLowerCase().includes(query) ||
        sec.toLowerCase().includes(query)
      ) {
        results.push({
          id: `plot-${p.id}`,
          name: decName || (inqName ? `${inqName} (Reserved)` : `Grave Lot #${pNum}`),
          plotNumber: pNum,
          section: sec,
          type: decName ? 'deceased' : 'plot',
          plot: p,
          dateStr: p.burial_date ? new Date(p.burial_date).toLocaleDateString() : undefined,
        });
      }
    });

    return results.slice(0, 8);
  }, [mapSearchQuery, burials, plots]);

  const handleSelectSuggestion = (suggestion: {
    name: string;
    plot: Plot;
    section: string;
    plotNumber: string;
  }) => {
    setMapSearchQuery(suggestion.name);
    setIsDropdownOpen(false);

    setSelectedPlot(suggestion.plot);
    const pLat = suggestion.plot.lat || 14.6720;
    const pLng = suggestion.plot.lng || 121.0410;
    setFlyToCenter([pLat, pLng]);
    setFlyToZoom(20);

    const targetNode = suggestion.plot.nearest_path_node_id || 'node-1';
    setToNodeId(targetNode);
    calculatePath(fromNodeId, targetNode);

    setSearchFeedback(
      `📍 Selected ${suggestion.name} at Lot #${suggestion.plot.plot_number} (Section ${suggestion.plot.section})! Map zoomed to grave box & walking path calculated.`
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

  const showSidebar = Boolean(selectedPlot || toNodeId);

  const handleClearSelection = () => {
    setSelectedPlot(null);
    setToNodeId('');
    setPathSteps([]);
    setTotalDistance(null);
    setSearchFeedback(null);
    setMapSearchQuery('');
  };

  const handleDownloadOfflinePass = () => {
    const deceasedName =
      selectedBurial?.deceased_name ||
      selectedPlot?.deceased_name ||
      selectedPlot?.inquirer_name ||
      (selectedPlot ? `Lot #${selectedPlot.plot_number}` : 'Memorial Lot');

    const dobStr = selectedBurial?.date_of_birth
      ? new Date(selectedBurial.date_of_birth).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : 'May 12, 1945';

    const dodStr = selectedBurial?.date_of_death
      ? new Date(selectedBurial.date_of_death).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : selectedPlot?.burial_date
      ? new Date(selectedPlot.burial_date).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : 'October 24, 2021';

    const stepsList = pathSteps.length > 0
      ? pathSteps
          .map(
            (step, i) =>
              `<li style="margin-bottom: 6px;"><strong>Step ${i + 1}:</strong> ${step.label} (${step.distanceFromPrevious} meters)</li>`
          )
          .join('')
      : '<li>Head directly to destination plot using park walkway signage.</li>';

    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
      window.location.origin + '/memorial-map?search=' + encodeURIComponent(deceasedName)
    )}&color=064e3b`;

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Himlayan Memorial Park - Offline Locator Pass</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #0f172a; padding: 24px; margin: 0; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border: 2px solid #047857; border-radius: 20px; padding: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
    .header { text-align: center; border-bottom: 2px dashed #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; }
    .header h1 { font-size: 22px; color: #064e3b; margin: 0 0 4px 0; letter-spacing: 0.5px; font-weight: 800; }
    .header p { font-size: 11px; color: #047857; text-transform: uppercase; font-weight: bold; margin: 0; letter-spacing: 1.5px; }
    .deceased-card { background: linear-gradient(135deg, #064e3b 0%, #047857 100%); color: #ffffff; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(4,120,87,0.25); }
    .deceased-name { font-size: 24px; font-weight: 800; margin-bottom: 6px; letter-spacing: 0.2px; }
    .dates { font-size: 13px; color: #d1fae5; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 12px; }
    .location-box { background: #f0fdf4; border: 1.5px solid #a7f3d0; color: #064e3b; border-radius: 12px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; font-weight: 700; font-size: 13px; }
    .qr-section { text-align: center; margin: 20px 0; padding: 20px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; }
    .qr-section img { width: 170px; height: 170px; border-radius: 12px; border: 1px solid #cbd5e1; background: #ffffff; padding: 8px; }
    .qr-section p { font-size: 11px; color: #64748b; margin-top: 10px; font-weight: 600; }
    .path-section { margin-top: 20px; }
    .path-section h3 { font-size: 13px; color: #064e3b; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; font-weight: 800; }
    ul { padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.6; margin: 0; }
    .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>HIMLAYAN MEMORIAL PARK</h1>
      <p>Offline Pathfinding & Memorial Pass</p>
    </div>
    <div class="deceased-card">
      <div class="deceased-name">🌹 ${deceasedName}</div>
      <div class="dates">
        <span>Born: ${dobStr}</span>
        <span>•</span>
        <span>Died: ${dodStr}</span>
      </div>
    </div>
    <div class="location-box">
      <span>Section ${selectedPlot?.section || 'A'} • Lot #${selectedPlot?.plot_number || 'A-01'}</span>
      <span>${totalDistance ? `${totalDistance}m Walking Distance` : 'Himlayan Memorial Park'}</span>
    </div>
    <div class="qr-section">
      <img src="${qrImageUrl}" alt="Offline Pass QR Code" />
      <p>Scan with camera to view interactive GPS map pass</p>
    </div>
    <div class="path-section">
      <h3>Turn-by-Turn Pathfinding Directions</h3>
      <ul>${stepsList}</ul>
    </div>
    <div class="footer">
      Generated on ${new Date().toLocaleString()} • Himlayan Memorial Park Navigator
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Himlayan_Pass_${deceasedName.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    // Increment global map usage count when user visits interactive map
    incrementMapUsageCount();

    const fetchData = async () => {
      try {
        const [plotsRes, nodesRes, burialsRes] = await Promise.all([
          apiClient.get('/plots?limit=10000'),
          apiClient.get('/pathfinding/nodes'),
          apiClient.get('/burials').catch(() => ({ data: { success: false, data: [] } })),
        ]);

        const loadedPlots: Plot[] = plotsRes.data?.success ? plotsRes.data.data : [];
        const loadedNodes: PathNode[] = nodesRes.data?.success ? nodesRes.data.data : [];
        const loadedBurials: Burial[] = burialsRes.data?.success ? burialsRes.data.data : [];

        setPlots(loadedPlots);
        setNodes(loadedNodes);
        setBurials(loadedBurials);

        // Check if query params specify search or destination node
        const searchQueryParam = searchParams.get('search') || searchParams.get('q') || searchParams.get('query');
        const toNodeQuery = searchParams.get('toNode');

        if (searchQueryParam) {
          setMapSearchQuery(searchQueryParam);
          executeDeceasedSearch(searchQueryParam, loadedPlots, loadedBurials);
        } else if (toNodeQuery) {
          setToNodeId(toNodeQuery);
          calculatePath('node-gate-1', toNodeQuery);
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

  const calculatePath = async (startId: string, endId: string) => {
    if (!startId || !endId) return;
    setLoadingPath(true);
    incrementMapUsageCount();
    try {
      const res = await apiClient.get('/pathfinding/find-path', {
        params: { from: startId, to: endId },
      });
      if (res.data?.success) {
        setPathSteps(res.data.data.path);
        setTotalDistance(res.data.data.totalDistance);
      }
    } catch (err) {
      console.error('Error running A* pathfinding:', err);
    } finally {
      setLoadingPath(false);
    }
  };

  const executeDeceasedSearch = async (
    queryText: string,
    plotList: Plot[] = plots,
    burialList: Burial[] = burials
  ) => {
    if (!queryText || !queryText.trim()) return;
    const q = queryText.trim().toLowerCase();
    await incrementMapUsageCount();

    let matchedPlot: Plot | undefined = undefined;
    let deceasedInfo: string | null = null;

    // 1. Check burial records
    const matchedBurial = burialList.find(
      (b) =>
        b.deceased_name.toLowerCase().includes(q) ||
        (b.notes && b.notes.toLowerCase().includes(q))
    );

    if (matchedBurial) {
      matchedPlot = plotList.find((p) => p.id === matchedBurial.plot_id);
      deceasedInfo = matchedBurial.deceased_name;
    }

    // 2. Check plots directly (deceased_name, inquirer_name, plot_number, section, notes)
    if (!matchedPlot) {
      matchedPlot = plotList.find(
        (p) =>
          (p.deceased_name && p.deceased_name.toLowerCase().includes(q)) ||
          (p.inquirer_name && p.inquirer_name.toLowerCase().includes(q)) ||
          p.plot_number.toLowerCase() === q ||
          p.plot_number.toLowerCase().includes(q) ||
          p.section.toLowerCase().includes(q) ||
          (p.notes && p.notes.toLowerCase().includes(q))
      );
      if (matchedPlot) {
        deceasedInfo = matchedPlot.deceased_name || matchedPlot.inquirer_name || null;
      }
    }

    if (matchedPlot) {
      setSelectedPlot(matchedPlot);
      setIsSidebarCollapsed(false);
      const pLat = matchedPlot.lat || 14.6720;
      const pLng = matchedPlot.lng || 121.0410;

      // Pan & Zoom directly to the exact grave coordinates with high detail zoom
      setFlyToCenter([pLat, pLng]);
      setFlyToZoom(20);

      const targetNode = matchedPlot.nearest_path_node_id || 'node-1';
      setToNodeId(targetNode);
      calculatePath(fromNodeId, targetNode);

      const nameDisplay = deceasedInfo ? `${deceasedInfo} ` : '';
      setSearchFeedback(
        `📍 Found ${nameDisplay}at Lot #${matchedPlot.plot_number} (Section ${matchedPlot.section})! Map zoomed to grave box & walking path calculated.`
      );
    } else {
      setSearchFeedback(`No grave or lot record found matching "${queryText}". Try searching for Maria or Lot A-12.`);
    }

    setTimeout(() => setSearchFeedback(null), 10000);
  };

  const handleLovedOneSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeDeceasedSearch(mapSearchQuery);
  };

  const polylinePositions: [number, number][] = pathSteps.map((step) => [step.lat, step.lng]);

  const defaultCenter: [number, number] = [14.6710, 121.0415];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-body pt-20 flex flex-col h-screen overflow-hidden">
      <Navbar />

      <div className="flex-1 flex flex-col-reverse lg:flex-row relative overflow-hidden">
        {/* Map Container (Main View Area) */}
        <div className="flex-1 h-full relative">
          {/* Bottom Center Search Bar Overlay (Landing Page Pill Design) */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4 pointer-events-auto" ref={dropdownRef}>
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
                className="w-full bg-transparent text-slate-900 placeholder-slate-500 text-sm font-body focus:outline-none px-2 font-medium"
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
                    No matching records found for "{mapSearchQuery}". Try "Maria", "Santos", or "Section A".
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
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              maxZoom={24}
              maxNativeZoom={20}
            />

            {/* Master Perimeter Polygon Overlay */}
            {(() => {
              const borderPlots = plots.filter((p) => p.lot_type === 'border');
              if (borderPlots.length >= 3) {
                const cLat = borderPlots.reduce((sum, p) => sum + (p.lat || 14.6720), 0) / borderPlots.length;
                const cLng = borderPlots.reduce((sum, p) => sum + (p.lng || 121.0410), 0) / borderPlots.length;
                const sorted = [...borderPlots].sort((a, b) => {
                  const angleA = Math.atan2((a.lat || 14.6720) - cLat, (a.lng || 121.0410) - cLng);
                  const angleB = Math.atan2((b.lat || 14.6720) - cLat, (b.lng || 121.0410) - cLng);
                  return angleA - angleB;
                });
                const coords = sorted.map((p) => [p.lat || 14.6720, p.lng || 121.0410] as [number, number]);
                return (
                  <Polygon
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
            })()}

            {/* Connected Path Nodes Line */}
            {(() => {
              const pathPlots = plots.filter((p) => p.lot_type === 'path' || p.lot_type === 'entrance');
              if (pathPlots.length > 1) {
                const sorted = [...pathPlots].sort((a, b) => {
                  if (a.lot_type === 'entrance' && b.lot_type !== 'entrance') return -1;
                  if (b.lot_type === 'entrance' && a.lot_type !== 'entrance') return 1;
                  const numA = parseInt(a.plot_number.split('-')[1] || '0', 10);
                  const numB = parseInt(b.plot_number.split('-')[1] || '0', 10);
                  if (numA && numB) return numA - numB;
                  return plots.indexOf(a) - plots.indexOf(b);
                });
                return (
                  <Polyline
                    positions={sorted.map((p) => [p.lat || 14.6720, p.lng || 121.0410] as [number, number])}
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
              return null;
            })()}

            {/* Gate / Node Markers */}
            {nodes.map((node) => (
              <Marker
                key={node.id}
                position={[node.lat, node.lng]}
                icon={gateIcon}
              >
                <Popup>
                  <div className="text-slate-900 text-xs font-bold">
                    {node.node_label || node.id}
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Plot Markers */}
            {plots
              .filter((plot) => {
                if (selectedPlot) {
                  return plot.id === selectedPlot.id;
                }
                if (filterType !== 'all' && plot.lot_type !== filterType) return false;
                if (filterStatus !== 'all' && plot.status !== filterStatus) return false;
                return true;
              })
              .map((plot) => {
              const pLat = plot.lat || 14.6720;
              const pLng = plot.lng || 121.0410;
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

              const isOccupied = plot.status === 'occupied' || plot.status === 'full' || Boolean(plot.deceased_name || burialRecord?.deceased_name);
              const isReserved = plot.status === 'reserved' && !isOccupied;

              return (
                <Marker
                  key={plot.id}
                  position={[pLat, pLng]}
                  icon={createPlotIcon(plot, zoomLevel)}
                  eventHandlers={{
                    click: () => {
                      setSelectedPlot(plot);
                      setFlyToCenter([pLat, pLng]);
                      setFlyToZoom(19);
                    },
                  }}
                >
                  <Popup>
                    <div className="text-slate-900 font-body text-xs p-1 space-y-1">
                      {/* Popup Content */}
                      {(isOccupied || isReserved) ? (
                        <>
                          <span className="font-bold text-sm block text-slate-900">
                            {plot.deceased_name || burialRecord?.deceased_name || (isReserved ? 'Reserved Lot' : 'Occupied Lot')}
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
                          <div><span className="font-bold text-rose-900">Born:</span> {dobStr}</div>
                          <div><span className="font-bold text-rose-900">Died:</span> {dodStr}</div>
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
            {selectedPlot && (() => {
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

              const isSelOccupied = selectedPlot.status === 'occupied' || selectedPlot.status === 'full' || Boolean(selectedPlot.deceased_name || selectedBurialRecord?.deceased_name);
              const isSelReserved = selectedPlot.status === 'reserved' && !isSelOccupied;

              return (
                <Marker
                  position={[selectedPlot.lat || 14.6720, selectedPlot.lng || 121.0410]}
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
                          {selectedPlot.deceased_name ? 'Resting Place / Grave' : 'Target Lot Location'}
                        </span>
                        <span className="font-heading italic font-bold text-sm block text-white mt-0.5">
                          {selectedPlot.deceased_name || `Lot #${selectedPlot.plot_number}`}
                        </span>
                      </div>
                      <div className="text-slate-700 text-[11px] space-y-1">
                        <div><strong className="text-slate-900">Grave Box #:</strong> Lot #{selectedPlot.plot_number}</div>
                        <div><strong className="text-slate-900">Section:</strong> Section {selectedPlot.section}</div>
                        <div><strong className="text-slate-900">Lot Category:</strong> {selectedPlot.lot_type}</div>
                        
                        {/* 1. OCCUPIED / FULL (RED): Date of Birth & Death */}
                        {isSelOccupied && (
                          <div className="bg-rose-50 border border-rose-200 text-rose-950 p-1.5 rounded text-[11px] mt-1 space-y-0.5">
                            <div><strong className="text-rose-900">Born:</strong> {selDobStr}</div>
                            <div><strong className="text-rose-900">Died:</strong> {selDodStr}</div>
                          </div>
                        )}

                        {/* 2. RESERVED (YELLOW): Burial Date */}
                        {isSelReserved && (
                          <div className="bg-amber-50 border border-amber-300 text-amber-950 p-1.5 rounded text-[11px] mt-1 space-y-0.5">
                            <strong className="text-amber-900 block font-bold">📅 Scheduled Burial:</strong>
                            <div className="font-semibold text-amber-900">{selBurialDateStr}</div>
                          </div>
                        )}

                        {/* 3. AVAILABLE (GREEN): Price */}
                        {selectedPlot.status === 'available' && !isSelOccupied && !isSelReserved && (
                          <div className="font-bold text-emerald-700 text-xs mt-1">
                            Price: ₱{selectedPlot.price?.toLocaleString() || '35,000'}
                          </div>
                        )}
                      </div>
                      <div className="pt-1">
                        <button
                          onClick={() => {
                            const targetNode = selectedPlot.nearest_path_node_id || 'node-1';
                            setToNodeId(targetNode);
                            calculatePath(fromNodeId, targetNode);
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
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"/>
                        <path d="M2 20h20"/>
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
                    {selectedBurial?.deceased_name ||
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
                <div className="pt-2 border-t border-emerald-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>
                      Himlayan Park • Section {selectedPlot?.section || 'A'} • Lot #{selectedPlot?.plot_number || 'A-01'}
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
                        '/memorial-map?search=' +
                        encodeURIComponent(
                          selectedBurial?.deceased_name ||
                            selectedPlot?.deceased_name ||
                            selectedPlot?.inquirer_name ||
                            `Lot #${selectedPlot?.plot_number || 'A-01'}`
                        )
                    )}&color=064e3b`}
                    alt="Grave Location QR Pass"
                    className="w-36 h-36 rounded-lg"
                  />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Digital Offline Pass</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Scan with camera to view interactive GPS map pass or download for offline park navigation.
                  </p>
                </div>
                <button
                  onClick={handleDownloadOfflinePass}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:scale-[1.02]"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Offline Map Pass</span>
                </button>
              </div>

              {/* Starting Landmark / Gate Selector */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <label className="block text-xs font-semibold text-slate-700">Starting Landmark / Gate</label>
                <select
                  value={fromNodeId}
                  onChange={(e) => {
                    setFromNodeId(e.target.value);
                    if (toNodeId) calculatePath(e.target.value, toNodeId);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                >
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.node_label || n.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Turn-by-Turn Pathfinding Result */}
              {totalDistance !== null && pathSteps.length > 0 && (
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Distance</span>
                    <span className="text-sm font-bold font-heading text-slate-900">{totalDistance} meters</span>
                  </div>

                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    <span className="text-[11px] font-semibold text-slate-600 block">Turn-by-Turn Steps:</span>
                    {pathSteps.map((step, idx) => (
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
