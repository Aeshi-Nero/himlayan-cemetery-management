import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { motion } from 'motion/react';
import {
    Landmark,
    Layers,
    Lock,
    CheckCircle2,
    Clock,
    Archive,
    ArrowRight,
} from 'lucide-react';
import { Navbar } from '@/Components/Public/Navbar';
import { ColumbaryNiche } from '@/types';

const ColumbariumPage: React.FC = () => {
    const [niches, setNiches] = useState<ColumbaryNiche[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNiches = async () => {
        setLoading(true);
        try {
            const res = await window.axios.get('/api/reserve/columbarium');
            if (res.data?.success) {
                setNiches(res.data.data as ColumbaryNiche[]);
            }
        } catch (err) {
            console.error('Error fetching columbarium niches:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNiches();
    }, []);

    const total = niches.length;
    const available = niches.filter((n) => n.status === 'available').length;
    const reserved = niches.filter((n) => n.status === 'reserved').length;
    const occupied = niches.filter((n) => n.status === 'occupied').length;

    const sections = Array.from(new Set(niches.map((n) => n.section).filter((s): s is string => !!s))).sort(
        (a, b) => a.localeCompare(b),
    );

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'available':
                return {
                    tile: 'bg-white border-emerald-300 hover:border-emerald-500 hover:shadow-lg',
                    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                    price: 'text-emerald-700',
                };
            case 'reserved':
                return {
                    tile: 'bg-amber-50/70 border-amber-300/80 opacity-70 cursor-not-allowed',
                    badge: 'bg-amber-100 text-amber-800 border-amber-300',
                    price: 'text-amber-700',
                };
            case 'occupied':
                return {
                    tile: 'bg-slate-100 border-slate-300 opacity-70 cursor-not-allowed',
                    badge: 'bg-slate-200 text-slate-700 border-slate-300',
                    price: 'text-slate-600',
                };
            default:
                return {
                    tile: 'bg-white border-slate-200',
                    badge: 'bg-slate-100 text-slate-700 border-slate-300',
                    price: 'text-slate-700',
                };
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'available':
                return <CheckCircle2 className="w-3 h-3" />;
            case 'reserved':
                return <Clock className="w-3 h-3" />;
            case 'occupied':
                return <Lock className="w-3 h-3" />;
            default:
                return null;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'available':
                return 'Available';
            case 'reserved':
                return 'Reserved';
            case 'occupied':
                return 'Occupied';
            default:
                return status;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-body pt-24 pb-16">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative rounded-2xl overflow-hidden mb-8 p-6 sm:p-8 bg-emerald-950 text-white shadow-md border border-emerald-800/40">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-slate-950/80 to-emerald-950/85" />

                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-300 bg-emerald-900/70 border border-emerald-500/30 px-3 py-1 rounded-full inline-block mb-2 shadow-sm">
                                Himlayan Columbarium
                            </span>
                            <h1 className="text-3xl sm:text-4xl font-heading italic font-bold text-white drop-shadow-sm">
                                Columbarium
                            </h1>
                            <p className="text-emerald-100/90 text-xs sm:text-sm mt-1 max-w-2xl font-body">
                                Browse our elevated garden wall niches for dignified urn
                                interment in the memorial park.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                            <span className="flex items-center gap-2 bg-white/10 border border-emerald-400/30 text-emerald-100 text-xs font-bold px-4 py-2.5 rounded-full">
                                <Layers className="w-4 h-4" />
                                {sections.length} Sections
                            </span>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 text-center text-slate-500">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-3" />
                        <p className="text-xs">Loading columbarium niches...</p>
                    </div>
                ) : niches.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                        <Landmark className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <h3 className="font-heading italic text-lg text-slate-900 font-bold mb-1">
                            No Niches Available
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">
                            There are currently no columbarium niches in the memorial park. Please
                            check back soon.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
                            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[11px] font-semibold text-slate-500">
                                        Total Niches
                                    </span>
                                    <Layers className="w-4 h-4 text-slate-400" />
                                </div>
                                <span className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">
                                    {total}
                                </span>
                            </div>
                            <div className="bg-white border border-emerald-200 rounded-2xl p-4 sm:p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[11px] font-semibold text-emerald-700">
                                        Available
                                    </span>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                </div>
                                <span className="text-2xl sm:text-3xl font-heading font-bold text-emerald-700">
                                    {available}
                                </span>
                            </div>
                            <div className="bg-white border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[11px] font-semibold text-amber-700">
                                        Reserved
                                    </span>
                                    <Clock className="w-4 h-4 text-amber-500" />
                                </div>
                                <span className="text-2xl sm:text-3xl font-heading font-bold text-amber-700">
                                    {reserved}
                                </span>
                            </div>
                            <div className="bg-white border border-slate-300 rounded-2xl p-4 sm:p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[11px] font-semibold text-slate-600">
                                        Occupied
                                    </span>
                                    <Lock className="w-4 h-4 text-slate-400" />
                                </div>
                                <span className="text-2xl sm:text-3xl font-heading font-bold text-slate-700">
                                    {occupied}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-8 shadow-sm">
                            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    Status Legend
                                </span>
                                {['available', 'reserved', 'occupied'].map((st) => {
                                    const styles = getStatusStyles(st);
                                    return (
                                        <span
                                            key={st}
                                            className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${styles.badge}`}
                                        >
                                            {getStatusIcon(st)}
                                            {getStatusLabel(st)}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-10">
                            {sections.map((section) => {
                                const sectionNiches = niches
                                    .filter((n) => n.section === section)
                                    .sort((a, b) => a.niche_number.localeCompare(b.niche_number));
                                return (
                                    <div key={section}>
                                        <div className="flex items-center gap-3 mb-4">
                                            <h2 className="text-xl sm:text-2xl font-heading italic font-bold text-slate-900">
                                                Section {section}
                                            </h2>
                                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                {sectionNiches.length} niches
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {sectionNiches.map((niche) => {
                                                const styles = getStatusStyles(niche.status);
                                                const isAvailable = niche.status === 'available';
                                                return (
                                                    <motion.div
                                                        key={niche.id}
                                                        whileHover={isAvailable ? { y: -4 } : {}}
                                                        transition={{ duration: 0.2 }}
                                                        className={`group border rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-sm ${styles.tile} ${
                                                            isAvailable
                                                                ? 'cursor-pointer hover:border-emerald-500 hover:shadow-md'
                                                                : ''
                                                        }`}
                                                        onClick={() => {
                                                            if (isAvailable) {
                                                                router.get(
                                                                    `/reserve?type=columbary&niche=${niche.id}`,
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        <div>
                                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                                <span className="text-lg font-heading font-bold text-slate-900">
                                                                    Niche #{niche.niche_number}
                                                                </span>
                                                                <span
                                                                    className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border shrink-0 ${styles.badge}`}
                                                                >
                                                                    {getStatusIcon(niche.status)}
                                                                    {getStatusLabel(niche.status)}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] font-semibold text-slate-500">
                                                                {niche.tier
                                                                    ? `Tier ${niche.tier}`
                                                                    : 'Tier —'}
                                                                {niche.row
                                                                    ? ` · Row ${niche.row}`
                                                                    : ' · Row —'}
                                                            </p>
                                                        </div>

                                                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                                            <span
                                                                className={`text-base font-bold font-heading ${styles.price}`}
                                                            >
                                                                ₱{niche.price?.toLocaleString()}
                                                            </span>
                                                            {isAvailable ? (
                                                                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    Reserve
                                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                                                                    {niche.status === 'reserved'
                                                                        ? 'Not Available'
                                                                        : 'In Use'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                <div className="mt-12 pt-6 border-t border-slate-200 text-center">
                    <p className="text-[11px] text-slate-400">
                        Solano Public Cemetery · Brgy. Curifang, Solano, Nueva Vizcaya
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                        All prices are subject to the latest municipal ordinance. Availability is
                        updated in real time.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ColumbariumPage;
