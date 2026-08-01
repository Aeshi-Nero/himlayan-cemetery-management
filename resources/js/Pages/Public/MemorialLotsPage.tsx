import React, { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { motion } from 'motion/react';
import {
    Search,
    Grid,
    MapPin,
    ArrowRight,
    Eye,
    CheckCircle2,
    Clock,
    Ban,
    ZoomIn,
    Send,
} from 'lucide-react';
import { Navbar } from '@/Components/Public/Navbar';
import { Plot } from '@/types';
import { incrementMapUsageCount } from '@/utils/mapUsageTracker';

import cemeteryLawnImg from '@/assets/images/cemetery_lawn_gardens_1784913858158.jpg';
import mausoleumImg from '@/assets/images/mausoleum_architecture_1784913872418.jpg';
import pathwayImg from '@/assets/images/memorial_pathway_1784913885130.jpg';
import terracesImg from '@/assets/images/garden_terraces_1784913898287.jpg';
import cemeteryMemorialBgImg from '@/assets/images/cemetery_memorial_bg_1784966447707.jpg';

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

const getGracePeriodText = (burialDateStr?: string) => {
    if (!burialDateStr) return 'Pending burial schedule';
    const bDate = new Date(burialDateStr);
    const now = new Date();
    const diffMs = bDate.getTime() - now.getTime();
    if (diffMs <= 0) {
        return 'Grace period completed (Transferring to Occupied)';
    }
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    if (days > 0) {
        return `${days}d ${hours}h until burial`;
    }
    return `${hours}h until burial`;
};

export const MemorialLotsPage: React.FC = () => {
    const { url } = usePage();
    const initialSearch = (() => {
        const params = new URL(url, window.location.origin).searchParams;
        return params.get('search') || '';
    })();

    const [plots, setPlots] = useState<Plot[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState(initialSearch);
    const [section, setSection] = useState('ALL');
    const [lotType, setLotType] = useState('ALL');
    const [status, setStatus] = useState('ALL');
    const [sortBy, setSortBy] = useState('plot_number');

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchPlots = async () => {
        setLoading(true);
        try {
            const params: Record<string, unknown> = { page, limit: 12 };
            if (search) params.search = search;
            if (section !== 'ALL') params.section = section;
            if (lotType !== 'ALL') params.lot_type = lotType;
            if (status !== 'ALL') params.status = status;

            const res = await window.axios.get('/api/plots', { params });
            if (res.data?.success) {
                let result: Plot[] = res.data.data;

                // Filter out occupied or full lots (only available and reserved are shown on catalog)
                result = result.filter((p) => p.status !== 'occupied' && p.status !== 'full');

                // Client-side sorting
                if (sortBy === 'price_asc') {
                    result.sort((a, b) => (a.price || 0) - (b.price || 0));
                } else if (sortBy === 'price_desc') {
                    result.sort((a, b) => (b.price || 0) - (a.price || 0));
                } else {
                    result.sort((a, b) => a.plot_number.localeCompare(b.plot_number));
                }

                setPlots(result);
                setTotalPages(res.data.pagination?.totalPages || 1);
            }
        } catch (err) {
            console.error('Error fetching plots:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlots();

        const handleRemoteUpdate = () => {
            fetchPlots();
        };
        window.addEventListener('himlayan_plots_updated', handleRemoteUpdate);
        window.addEventListener('storage', handleRemoteUpdate);
        return () => {
            window.removeEventListener('himlayan_plots_updated', handleRemoteUpdate);
            window.removeEventListener('storage', handleRemoteUpdate);
        };
    }, [search, section, lotType, status, sortBy, page]);

    const getStatusBadge = (st: string) => {
        switch (st) {
            case 'available':
                return (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Available
                    </span>
                );
            case 'reserved':
                return (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Reserved
                    </span>
                );
            case 'occupied':
            case 'full':
                return (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                        <Ban className="w-3 h-3" /> Occupied
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-body pt-24 pb-16">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="relative rounded-2xl overflow-hidden mb-8 p-6 sm:p-8 bg-emerald-950 text-white shadow-md border border-emerald-800/40">
                    <div
                        className="absolute inset-0 bg-cover bg-center filter blur-[4px] scale-105 opacity-45"
                        style={{ backgroundImage: `url(${cemeteryMemorialBgImg})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-slate-950/80 to-emerald-950/85" />

                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-300 bg-emerald-900/70 border border-emerald-500/30 px-3 py-1 rounded-full inline-block mb-2 shadow-sm">
                                Himlayan Inventory
                            </span>
                            <h1 className="text-3xl sm:text-4xl font-heading italic font-bold text-white drop-shadow-sm">
                                Memorial Lots Catalog
                            </h1>
                            <p className="text-emerald-100/90 text-xs sm:text-sm mt-1 max-w-2xl font-body">
                                Browse lawn plots, family mausoleums, and terrace apartments with
                                real-time status.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                            <button
                                onClick={async () => {
                                    await incrementMapUsageCount();
                                    router.visit('/map');
                                }}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-full flex items-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg border border-emerald-400/30"
                            >
                                <MapPin className="w-4 h-4" />
                                <span>Map View</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 mb-8 shadow-sm">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                        <div className="relative flex-1 min-w-[280px] lg:min-w-[420px]">
                            <Search className="w-4.5 h-4.5 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search a Cemetery, Lot Number, Section"
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 shadow-inner font-medium transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
                            <div>
                                <select
                                    value={section}
                                    onChange={(e) => {
                                        setSection(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full bg-slate-100/90 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-2 text-[11px] font-medium text-slate-700 focus:outline-none focus:border-emerald-600 cursor-pointer"
                                >
                                    <option value="ALL">All Sections (A - D)</option>
                                    <option value="A">Section A (Lawn)</option>
                                    <option value="B">Section B (Memorial)</option>
                                    <option value="C">Section C (Terrace)</option>
                                    <option value="D">Section D (Mausoleum)</option>
                                </select>
                            </div>

                            <div>
                                <select
                                    value={lotType}
                                    onChange={(e) => {
                                        setLotType(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full bg-slate-100/90 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-2 text-[11px] font-medium text-slate-700 focus:outline-none focus:border-emerald-600 cursor-pointer"
                                >
                                    <option value="ALL">All Lot Types</option>
                                    <option value="single">Single Lawn Lot</option>
                                    <option value="family">Family Mausoleum</option>
                                    <option value="apartment">Garden Terrace</option>
                                </select>
                            </div>

                            <div>
                                <select
                                    value={status}
                                    onChange={(e) => {
                                        setStatus(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full bg-slate-100/90 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-2 text-[11px] font-medium text-slate-700 focus:outline-none focus:border-emerald-600 cursor-pointer"
                                >
                                    <option value="ALL">All Available & Reserved</option>
                                    <option value="available">Available Only</option>
                                    <option value="reserved">Reserved (Grace Period)</option>
                                </select>
                            </div>

                            <div>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full bg-slate-100/90 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-2 text-[11px] font-medium text-slate-700 focus:outline-none focus:border-emerald-600 cursor-pointer"
                                >
                                    <option value="plot_number">Sort: Lot Number</option>
                                    <option value="price_asc">Price: Low to High</option>
                                    <option value="price_desc">Price: High to Low</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lots Grid */}
                {loading ? (
                    <div className="py-20 text-center text-slate-500">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-3" />
                        <p className="text-xs">Loading Himlayan memorial lot inventory...</p>
                    </div>
                ) : plots.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                        <Grid className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <h3 className="font-heading italic text-lg text-slate-900 font-bold mb-1">
                            No Memorial Lots Found
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">
                            Try clearing filters or searching for another section.
                        </p>
                        <button
                            onClick={() => {
                                setSearch('');
                                setSection('ALL');
                                setLotType('ALL');
                                setStatus('ALL');
                            }}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs px-4 py-2 rounded-full font-semibold transition-colors"
                        >
                            Reset All Filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plots.map((plot) => (
                            <motion.div
                                key={plot.id}
                                whileHover={plot.status === 'available' ? { y: -4 } : {}}
                                transition={{ duration: 0.2 }}
                                className={`bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between group ${
                                    plot.status === 'available'
                                        ? 'hover:border-emerald-500/55 hover:shadow-md cursor-pointer'
                                        : 'opacity-90'
                                }`}
                                onClick={() => {
                                    if (plot.status === 'available') {
                                        router.visit(`/lots/${plot.id}`);
                                    }
                                }}
                            >
                                <div>
                                    <div className="relative h-36 w-full overflow-hidden bg-slate-900">
                                        <img
                                            src={getSectionImage(plot.section)}
                                            alt={`Section ${plot.section} Memorial Grounds`}
                                            referrerPolicy="no-referrer"
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                                            <span className="bg-slate-900/80 backdrop-blur-md text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/30">
                                                Section {plot.section}
                                            </span>
                                            {getStatusBadge(plot.status)}
                                        </div>

                                        <div className="absolute bottom-2 left-3 right-3 z-10 flex items-center justify-between">
                                            <span className="text-lg font-heading font-bold text-white drop-shadow-md">
                                                Lot #{plot.plot_number}
                                            </span>
                                            <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ZoomIn className="w-3.5 h-3.5" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-5">
                                        {plot.status === 'reserved' && (
                                            <div className="mb-3 bg-amber-50 border border-amber-200/90 rounded-xl p-2.5 text-xs text-amber-900 space-y-1.5 shadow-2xs">
                                                <div className="flex items-center justify-between gap-2 border-b border-amber-200/80 pb-1">
                                                    <div className="flex items-center gap-1.5 font-bold">
                                                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                                        <span>Burial Schedule:</span>
                                                    </div>
                                                    <span className="font-extrabold text-amber-950">
                                                        {plot.burial_date
                                                            ? new Date(
                                                                  plot.burial_date,
                                                              ).toLocaleString('en-US', {
                                                                  dateStyle: 'medium',
                                                                  timeStyle: 'short',
                                                              })
                                                            : 'Pending schedule'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-[11px] font-semibold text-amber-800">
                                                    <span>Waiting Grace Period:</span>
                                                    <span className="font-bold text-amber-950">
                                                        {getGracePeriodText(plot.burial_date)}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-2 text-xs text-slate-700 mb-2">
                                            <div className="flex items-center justify-between py-1 border-b border-slate-100">
                                                <span className="text-slate-500">Lot Type:</span>
                                                <span className="font-semibold text-emerald-700 capitalize">
                                                    {plot.lot_type}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between py-1 border-b border-slate-100">
                                                <span className="text-slate-500">Capacity:</span>
                                                <span className="font-semibold text-slate-800">
                                                    {plot.capacity} Occupants (
                                                    {plot.current_occupants} current)
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between py-1 border-b border-slate-100">
                                                <span className="text-slate-500">Cemetery:</span>
                                                <span className="font-semibold text-slate-800">
                                                    Solano Public Cemetery
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between py-1 border-b border-slate-100">
                                                <span className="text-slate-500">Location:</span>
                                                <span className="font-semibold text-slate-800">
                                                    Brgy. Curifang, Solano, Nueva Vizcaya
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-5 pb-5">
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 mb-3">
                                        <span className="text-xs text-slate-500">
                                            Estimated Price:
                                        </span>
                                        <span className="text-lg font-bold font-heading text-emerald-700">
                                            ₱{plot.price?.toLocaleString()}
                                        </span>
                                    </div>

                                    {plot.status === 'available' ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.visit(
                                                        `/inquiry?plotId=${plot.id}&plotNumber=${plot.plot_number}&section=${plot.section}&lotType=${plot.lot_type}&price=${plot.price}`,
                                                    );
                                                }}
                                                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                                            >
                                                <Send className="w-3.5 h-3.5" />
                                                <span>Inquire</span>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.visit(`/lots/${plot.id}`);
                                                }}
                                                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                            >
                                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                                <span>Details</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center py-2.5 px-3 bg-slate-100 rounded-xl text-xs font-semibold text-slate-500">
                                            {plot.status === 'reserved'
                                                ? 'Reserved (Not Available)'
                                                : 'Occupied (Not Available)'}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="mt-10 flex items-center justify-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(p - 1, 1))}
                            disabled={page === 1}
                            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-100 transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-xs text-slate-600 px-3">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                            disabled={page === totalPages}
                            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-100 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MemorialLotsPage;
