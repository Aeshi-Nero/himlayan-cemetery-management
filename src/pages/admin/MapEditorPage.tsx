import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { apiClient } from '../../api/client';
import { Plot } from '../../types';
import { MapPin, Save, RefreshCw } from 'lucide-react';

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

export const MapEditorPage: React.FC = () => {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchPlots = async () => {
    try {
      const res = await apiClient.get('/plots?limit=10000');
      if (res.data?.success) setPlots(res.data.data);
    } catch (err) {
      console.error('Error fetching plots:', err);
    }
  };

  useEffect(() => {
    fetchPlots();
  }, []);

  const handleUpdatePlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlot) return;
    setSaving(true);
    try {
      const res = await apiClient.put(`/plots/${selectedPlot.id}`, selectedPlot);
      if (res.data?.success) {
        fetchPlots();
        setSelectedPlot(null);
      }
    } catch (err) {
      console.error('Error updating plot:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">GIS Editor</span>
          <h1 className="text-2xl font-heading italic font-bold text-slate-900 mt-0.5">Plot Location & Status Map Editor</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Map View */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs h-full">
          <MapContainer center={[14.6710, 121.0415]} zoom={16} maxZoom={24} className="h-full w-full z-10">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={24}
              maxNativeZoom={19}
            />
            {plots.map((plot) => (
              <Marker
                key={plot.id}
                position={[plot.lat || 14.6720, plot.lng || 121.0410]}
                icon={createPlotIcon(plot)}
                eventHandlers={{
                  click: () => setSelectedPlot(plot),
                }}
              >
                <Popup>
                  <div className="text-slate-900 text-xs">
                    <span className="font-bold">Lot #{plot.plot_number}</span>
                    <br />
                    Click sidebar to edit properties.
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Edit Form Sidebar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 overflow-y-auto text-slate-900">
          <h3 className="font-heading font-bold text-slate-900 text-base">Plot Property Editor</h3>
          {selectedPlot ? (
            <form onSubmit={handleUpdatePlot} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Plot Number</label>
                <input
                  type="text"
                  value={selectedPlot.plot_number}
                  onChange={(e) => setSelectedPlot({ ...selectedPlot, plot_number: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Section</label>
                <select
                  value={selectedPlot.section}
                  onChange={(e) => setSelectedPlot({ ...selectedPlot, section: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  <option value="D">Section D</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Status</label>
                <select
                  value={selectedPlot.status}
                  onChange={(e) => setSelectedPlot({ ...selectedPlot, status: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="occupied">Occupied</option>
                  <option value="full">Full</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Price (₱)</label>
                <input
                  type="number"
                  value={selectedPlot.price}
                  onChange={(e) => setSelectedPlot({ ...selectedPlot, price: parseFloat(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={selectedPlot.lat}
                    onChange={(e) => setSelectedPlot({ ...selectedPlot, lat: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={selectedPlot.lng}
                    onChange={(e) => setSelectedPlot({ ...selectedPlot, lng: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlot(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <p className="text-xs text-slate-500 italic">Click any plot marker on the map to inspect and edit properties.</p>
          )}
        </div>
      </div>
    </div>
  );
};
