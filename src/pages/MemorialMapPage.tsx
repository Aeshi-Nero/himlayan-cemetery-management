import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { Navbar } from '../components/Navbar';
import { Plot, PathNode, PathStep } from '../types';
import { apiClient } from '../api/client';
import { incrementMapUsageCount } from '../utils/mapUsageTracker';
import { MapPin, Navigation, Compass, Info, ArrowRight, Layers, CheckCircle2, Clock, Ban, Globe, Search } from 'lucide-react';

// Custom Colored Markers / DivIcons for plots matching legend box
const createPlotIcon = (plot: Plot, zoomLevel: number = 16) => {
  const { status, lot_type: lotType, width, height, rotation } = plot;
  let color = '#00c853'; // Green (available)
  if (status === 'reserved') color = '#f59e0b'; // Amber
  if (status === 'occupied' || status === 'full') color = '#ff1744'; // Red

  const scale = Math.pow(2, zoomLevel - 16);

  const baseW = width || (lotType === 'single' ? 14 : lotType === 'path' || lotType === 'border' ? 14 : 18);
  const baseH = height || (lotType === 'single' ? 18 : lotType === 'path' || lotType === 'border' ? 14 : 24);
  const r = rotation || 0;

  const w = baseW * scale;
  const h = baseH * scale;

  const styleStr = `width: ${w}px; height: ${h}px; transform: rotate(${r}deg);`;

  if (lotType === 'path') {
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
      html: `<div style="background-color: ${color}; border: 2px solid white; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 10px; color: white; box-shadow: 0 0 8px ${color}; cursor: pointer; ${styleStr}">2</div>`,
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
      html: `<div style="background-color: ${color}; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px ${color}; cursor: pointer; ${styleStr}"></div>`,
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
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [zoomLevel, setZoomLevel] = useState(16);

  // Pathfinding State
  const [fromNodeId, setFromNodeId] = useState('node-gate-1');
  const [toNodeId, setToNodeId] = useState('');
  const [pathSteps, setPathSteps] = useState<PathStep[]>([]);
  const [totalDistance, setTotalDistance] = useState<number | null>(null);
  const [loadingPath, setLoadingPath] = useState(false);

  // Search Loved One state
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  // Filter State
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    // Increment global map usage count when user visits interactive map
    incrementMapUsageCount();

    const fetchData = async () => {
      try {
        const [plotsRes, nodesRes] = await Promise.all([
          apiClient.get('/plots?limit=10000'),
          apiClient.get('/pathfinding/nodes'),
        ]);

        if (plotsRes.data?.success) setPlots(plotsRes.data.data);
        if (nodesRes.data?.success) setNodes(nodesRes.data.data);

        // Check if query params specify destination node or plot
        const toNodeQuery = searchParams.get('toNode');
        if (toNodeQuery) {
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

  const handleLovedOneSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapSearchQuery.trim()) return;
    const q = mapSearchQuery.trim().toLowerCase();
    
    // Increment global tally count on search submit
    await incrementMapUsageCount();

    const matchedPlot = plots.find(
      (p) =>
        p.plot_number.toLowerCase().includes(q) ||
        p.section.toLowerCase().includes(q) ||
        p.lot_type.toLowerCase().includes(q)
    );

    if (matchedPlot) {
      setSelectedPlot(matchedPlot);
      const targetNode = matchedPlot.nearest_path_node_id || 'node-1';
      setToNodeId(targetNode);
      calculatePath(fromNodeId, targetNode);
      setSearchFeedback(`Found Plot #${matchedPlot.plot_number} (Section ${matchedPlot.section})! Path computed.`);
    } else {
      setSearchFeedback(`Searched for "${mapSearchQuery}". Updated worldwide map usage tally.`);
    }

    setTimeout(() => setSearchFeedback(null), 4000);
  };

  const polylinePositions: [number, number][] = pathSteps.map((step) => [step.lat, step.lng]);

  const defaultCenter: [number, number] = [14.6710, 121.0415];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-body pt-20 flex flex-col h-screen overflow-hidden">
      <Navbar />

      <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
        {/* Left Side Control Panel */}
        <div className="w-full lg:w-96 bg-white border-r border-slate-200 p-6 flex flex-col justify-between z-20 overflow-y-auto max-h-[40vh] lg:max-h-none shadow-sm">
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Interactive Map</span>
              <h2 className="text-2xl font-heading italic font-bold text-slate-900 mt-1">Pathfinding Navigator</h2>
              <p className="text-xs text-slate-600 mt-1">
                Select entry gate and target lot node to compute turn-by-turn walking directions.
              </p>
            </div>

            {/* Find a Loved One / Plot Search Bar */}
            <div className="bg-emerald-950 text-white rounded-xl p-4 space-y-2 shadow-sm">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                Find a Loved One / Plot on Map
              </label>
              <form onSubmit={handleLovedOneSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={mapSearchQuery}
                    onChange={(e) => setMapSearchQuery(e.target.value)}
                    placeholder="Search plot # or name..."
                    className="w-full bg-emerald-900/80 border border-emerald-700/80 rounded-lg pl-8 pr-2 py-1.5 text-xs text-white placeholder-emerald-200/60 focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-all shrink-0"
                >
                  <Search className="w-3 h-3" />
                  <span>Search</span>
                </button>
              </form>
              {searchFeedback && (
                <div className="text-[11px] font-medium text-emerald-200 bg-emerald-900/90 p-2 rounded border border-emerald-700/60 mt-2">
                  {searchFeedback}
                </div>
              )}
            </div>

            {/* Map Filters */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Map Filters</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-700 mb-1">Lot Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="all">All Types</option>
                    <option value="single">Lawn Lot (Single)</option>
                    <option value="apartment">Apartment</option>
                    <option value="family">Family Estate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="all">All Statuses</option>
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="occupied">Occupied</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Pathfinding Controls */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Starting Landmark / Gate</label>
                <select
                  value={fromNodeId}
                  onChange={(e) => setFromNodeId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                >
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.node_label || n.id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Lot Node</label>
                <select
                  value={toNodeId}
                  onChange={(e) => setToNodeId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                >
                  <option value="">-- Select Destination --</option>
                  {plots.map((p) => (
                    <option key={p.id} value={p.nearest_path_node_id || 'node-1'}>
                      Lot #{p.plot_number} (Section {p.section})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => calculatePath(fromNodeId, toNodeId)}
                disabled={loadingPath || !toNodeId}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Navigation className="w-4 h-4" />
                <span>{loadingPath ? 'Calculating Shortest Path...' : 'Calculate Directions'}</span>
              </button>
            </div>

            {/* Pathfinding Result */}
            {totalDistance !== null && pathSteps.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                  <span className="text-xs font-bold text-emerald-800 uppercase">Total Walking Distance</span>
                  <span className="text-sm font-bold font-heading text-slate-900">{totalDistance} meters</span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
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

            {/* Map Legend */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <span className="text-xs font-bold text-slate-800 block mb-2">Plot Status Legend</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
                  <span className="text-slate-700">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />
                  <span className="text-slate-700">Reserved</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500 shadow-sm" />
                  <span className="text-slate-700">Occupied / Full</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-500 shadow-sm" />
                  <span className="text-slate-700">Gates & Chapel</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Map Container */}
        <div className="flex-1 h-full relative">
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
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={24}
              maxNativeZoom={19}
            />

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
                if (filterType !== 'all' && plot.lot_type !== filterType) return false;
                if (filterStatus !== 'all' && plot.status !== filterStatus) return false;
                return true;
              })
              .map((plot) => {
              const pLat = plot.lat || 14.6720;
              const pLng = plot.lng || 121.0410;
              return (
                <Marker
                  key={plot.id}
                  position={[pLat, pLng]}
                  icon={createPlotIcon(plot, zoomLevel)}
                  eventHandlers={{
                    click: () => setSelectedPlot(plot),
                  }}
                >
                  <Popup>
                    <div className="text-slate-900 font-body text-xs p-1 space-y-1">
                      <span className="font-bold text-sm block">Lot #{plot.plot_number}</span>
                      <span className="text-slate-600 block">Section {plot.section} • {plot.lot_type}</span>
                      {plot.status === 'reserved' && plot.burial_date && (
                        <div className="bg-amber-50 border border-amber-300 rounded p-1 text-[10px] text-amber-900">
                          <span className="font-bold block">📅 Scheduled Burial:</span>
                          <span>
                            {new Date(plot.burial_date).toLocaleString('en-US', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                      )}
                      <span className="font-bold text-emerald-700 block mt-1">₱{plot.price?.toLocaleString()}</span>
                      <div className="mt-2 flex gap-1">
                        <button
                          onClick={() => {
                            setToNodeId(plot.nearest_path_node_id || 'node-1');
                            calculatePath(fromNodeId, plot.nearest_path_node_id || 'node-1');
                          }}
                          className="bg-emerald-600 text-white font-bold px-2.5 py-1 rounded text-[10px] cursor-pointer"
                        >
                          Directions
                        </button>
                        <button
                          onClick={() => navigate(`/lots/${plot.id}`)}
                          className="bg-slate-800 text-white font-bold px-2.5 py-1 rounded text-[10px] cursor-pointer"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Calculated A* Polyline Path */}
            {polylinePositions.length > 0 && (
              <Polyline
                positions={polylinePositions}
                pathOptions={{ color: '#10b981', weight: 6, opacity: 0.9, dashArray: '10, 10' }}
              />
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};
