import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Navbar } from '@/Components/Public/Navbar';
import { Plot } from '@/types';
import { incrementMapUsageCount } from '@/utils/mapUsageTracker';
import { FALLBACK_PLOT_LAT, FALLBACK_PLOT_LNG } from '@/constants/geo';
import { MapPin, Navigation, ArrowLeft, Send, Camera } from 'lucide-react';

import cemeteryLawnImg from '@/assets/images/cemetery_lawn_gardens_1784913858158.jpg';
import mausoleumImg from '@/assets/images/mausoleum_architecture_1784913872418.jpg';
import pathwayImg from '@/assets/images/memorial_pathway_1784913885130.jpg';
import terracesImg from '@/assets/images/garden_terraces_1784913898287.jpg';

const getSectionImage = (sec: string) => {
    switch (sec) {
        case 'A':
            return cemeteryLawnImg;
        case 'B':
            return mausoleumImg;
        case 'C':
            return pathwayImg;
        case 'D':
            return terracesImg;
        default:
            return cemeteryLawnImg;
    }
};

// Custom Map Marker Icon
const defaultMarkerIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

export const LotDetailPage: React.FC<{ plotId?: string }> = ({ plotId }) => {
    const id = plotId;

    const [plot, setPlot] = useState<Plot | null>(null);
    const [similarPlots, setSimilarPlots] = useState<Plot[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        incrementMapUsageCount();
        const fetchDetail = async () => {
            setLoading(true);
            try {
                const res = await window.axios.get(`/api/plots/${id}`);
                if (res.data?.success) {
                    const currentPlot: Plot = res.data.data;
                    setPlot(currentPlot);

                    // Fetch similar plots in same section
                    const simRes = await window.axios.get('/api/plots', {
                        params: { section: currentPlot.section, limit: 3 },
                    });
                    if (simRes.data?.success) {
                        setSimilarPlots(
                            simRes.data.data.filter((p: Plot) => p.id !== currentPlot.id),
                        );
                    }
                }
            } catch (err) {
                console.error('Error fetching plot detail:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    // Inquiry Navigation
    const handleProceedToInquiry = () => {
        if (!plot) return;
        router.visit(
            `/inquiry?plotId=${plot.id}&plotNumber=${plot.plot_number}&section=${plot.section}&lotType=${plot.lot_type}&price=${plot.price}`,
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-3" />
                    <p className="text-xs text-slate-600">Loading plot details...</p>
                </div>
            </div>
        );
    }

    if (!plot) {
        return (
            <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4">
                <h2 className="text-xl font-heading font-bold mb-2">Plot Not Found</h2>
                <button
                    onClick={() => router.visit('/lots')}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-4 py-2 rounded-full font-semibold"
                >
                    Return to Catalog
                </button>
            </div>
        );
    }

    const plotLat = plot.lat || FALLBACK_PLOT_LAT;
    const plotLng = plot.lng || FALLBACK_PLOT_LNG;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-body pt-24 pb-16">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back button */}
                <button
                    onClick={() => router.visit('/lots')}
                    className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Memorial Lots Catalog</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Info Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Title Header Card */}
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-950 group">
                                <img
                                    src={getSectionImage(plot.section)}
                                    alt={`Section ${plot.section} Memorial Grounds`}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

                                <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                                    <span className="bg-slate-950/80 backdrop-blur-md text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5 shadow-md">
                                        <Camera className="w-3.5 h-3.5" />
                                        <span>Himlayan Section {plot.section} Grounds</span>
                                    </span>
                                    <span className="bg-emerald-700/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md uppercase">
                                        {plot.lot_type}
                                    </span>
                                </div>

                                <div className="absolute bottom-4 left-4 right-4 z-10 flex items-end justify-between">
                                    <div>
                                        <span className="text-xs text-emerald-300 font-semibold uppercase tracking-wider block mb-1">
                                            Memorial Lot Overview
                                        </span>
                                        <h1 className="text-2xl sm:text-3xl font-heading italic font-bold text-white drop-shadow-md">
                                            Memorial Lot #{plot.plot_number}
                                        </h1>
                                    </div>
                                    <div className="bg-slate-950/80 backdrop-blur-md border border-slate-700 rounded-2xl px-4 py-2 text-right">
                                        <span className="text-[10px] text-slate-400 block uppercase font-bold">
                                            Price
                                        </span>
                                        <span className="text-xl font-bold font-heading text-emerald-400">
                                            ₱{plot.price?.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h4 className="font-heading font-bold text-slate-900 text-sm">
                                            Solano Public Cemetery
                                        </h4>
                                        <p className="text-xs text-slate-500">
                                            Brgy. Curifang, Solano, Nueva Vizcaya
                                        </p>
                                    </div>
                                    <button
                                        onClick={() =>
                                            router.visit(
                                                `/map?toNode=${plot.nearest_path_node_id || 'node-1'}`,
                                            )
                                        }
                                        className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-6 py-3 rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                                    >
                                        <Navigation className="w-4 h-4" />
                                        <span>Get Directions via Pathfinding</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Specifications Grid */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-lg font-heading italic font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">
                                Lot Specifications
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                    <span className="text-slate-500 block mb-1">Lot Number</span>
                                    <span className="font-bold text-slate-900 text-sm">
                                        #{plot.plot_number}
                                    </span>
                                </div>
                                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                    <span className="text-slate-500 block mb-1">Section</span>
                                    <span className="font-bold text-slate-900 text-sm">
                                        Section {plot.section}
                                    </span>
                                </div>
                                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                    <span className="text-slate-500 block mb-1">Lot Type</span>
                                    <span className="font-bold text-emerald-700 capitalize text-sm">
                                        {plot.lot_type}
                                    </span>
                                </div>
                                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                    <span className="text-slate-500 block mb-1">Capacity</span>
                                    <span className="font-bold text-slate-900 text-sm">
                                        {plot.capacity} Occupants
                                    </span>
                                </div>
                                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                    <span className="text-slate-500 block mb-1">
                                        Occupancy Status
                                    </span>
                                    <span className="font-bold text-amber-700 text-sm capitalize">
                                        {plot.status}
                                    </span>
                                </div>
                                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                    <span className="text-slate-500 block mb-1">
                                        Cemetery & Location
                                    </span>
                                    <span className="font-semibold text-slate-800 text-xs">
                                        Solano Public Cemetery
                                        <br />
                                        Brgy. Curifang, Solano, Nueva Vizcaya
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Map Preview */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
                            <h3 className="text-lg font-heading italic font-bold text-slate-900 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-emerald-700" />
                                <span>Geographic Location Map</span>
                            </h3>
                            <div className="h-72 rounded-xl overflow-hidden border border-slate-200">
                                <MapContainer
                                    center={[plotLat, plotLng]}
                                    zoom={17}
                                    maxZoom={24}
                                    scrollWheelZoom={false}
                                    className="h-full w-full"
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        maxZoom={24}
                                        maxNativeZoom={19}
                                    />
                                    <Marker position={[plotLat, plotLng]} icon={defaultMarkerIcon}>
                                        <Popup>
                                            <div className="text-slate-900 text-xs font-bold">
                                                Himlayan Lot #{plot.plot_number}
                                                <br />
                                                Section {plot.section} ({plot.lot_type})
                                            </div>
                                        </Popup>
                                    </Marker>
                                </MapContainer>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Inquiry Form */}
                    <div className="space-y-6">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-lg font-heading italic font-bold text-slate-900 mb-1 flex items-center gap-2">
                                <Send className="w-5 h-5 text-emerald-700" />
                                <span>Submit Plot Inquiry</span>
                            </h3>
                            <p className="text-xs text-slate-600 mb-6">
                                Reserve or request quotation from our RCC memorial clerk for Lot #
                                {plot.plot_number}.
                            </p>

                            {plot.status === 'available' ? (
                                <button
                                    onClick={handleProceedToInquiry}
                                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 rounded-xl text-xs shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <Send className="w-4 h-4" />
                                    <span>Submit Inquiry</span>
                                </button>
                            ) : (
                                <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-center text-xs font-semibold text-slate-600">
                                    This memorial lot is currently{' '}
                                    <span className="capitalize">{plot.status}</span>. Inquiries and
                                    reservations are closed.
                                </div>
                            )}
                        </div>

                        {/* Similar Lots Recommendations */}
                        {similarPlots.length > 0 && (
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                                <h4 className="text-sm font-heading font-bold text-slate-900">
                                    Similar Lots in Section {plot.section}
                                </h4>
                                <div className="space-y-3">
                                    {similarPlots.map((sim) => (
                                        <div
                                            key={sim.id}
                                            onClick={() => router.visit(`/lots/${sim.id}`)}
                                            className="bg-slate-50 hover:bg-slate-100 p-3 rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer transition-colors"
                                        >
                                            <div>
                                                <span className="font-bold text-xs text-slate-900 block">
                                                    Lot #{sim.plot_number}
                                                </span>
                                                <span className="text-[11px] text-slate-500 capitalize">
                                                    {sim.lot_type}
                                                </span>
                                            </div>
                                            <span className="text-xs font-bold text-emerald-700">
                                                ₱{sim.price?.toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LotDetailPage;
