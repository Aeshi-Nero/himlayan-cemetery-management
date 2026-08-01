import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { motion } from 'motion/react';
import { Flower2, Cross, Heart, CheckCircle2, ArrowRight } from 'lucide-react';
import { Navbar } from '@/Components/Public/Navbar';
import { PreNeedPlan } from '@/types';

interface PlansResponse {
    success: boolean;
    data: Record<string, PreNeedPlan[]>;
}

const GROUPS: { key: string; label: string; icon: typeof Flower2 }[] = [
    { key: 'memorial', label: 'Memorial Plans', icon: Flower2 },
    { key: 'burial', label: 'Burial Plans', icon: Cross },
    { key: 'funeral', label: 'Funeral Plans', icon: Heart },
];

export const PlansPage: React.FC = () => {
    const [groups, setGroups] = useState<Record<string, PreNeedPlan[]>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            setLoading(true);
            try {
                const res = await window.axios.get('/api/reserve/plans');
                if (res.data?.success) {
                    setGroups(res.data.data as Record<string, PreNeedPlan[]>);
                }
            } catch (err) {
                console.error('Error fetching plans:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-body pt-24 pb-16">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative rounded-2xl overflow-hidden mb-10 p-6 sm:p-10 bg-gradient-to-br from-emerald-950 via-emerald-800 to-slate-900 text-white shadow-md border border-emerald-800/40">
                    <div className="absolute top-0 right-1/4 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-slate-800/40 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10">
                        <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-300 bg-emerald-900/70 border border-emerald-500/30 px-3 py-1 rounded-full inline-block mb-2 shadow-sm">
                            Himlayan Pre-Need Services
                        </span>
                        <h1 className="text-3xl sm:text-4xl font-heading italic font-bold text-white drop-shadow-sm">
                            Pre-Need Plans
                        </h1>
                        <p className="text-emerald-100/90 text-xs sm:text-sm mt-2 max-w-2xl font-body">
                            Plan ahead with dignity. Explore our memorial, burial, and funeral
                            plans designed to ease the burden on your family when the time comes.
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 text-center text-slate-500">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-3" />
                        <p className="text-xs">Loading Himlayan pre-need plans...</p>
                    </div>
                ) : Object.keys(groups).length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                        <Flower2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <h3 className="font-heading italic text-lg text-slate-900 font-bold mb-1">
                            No Pre-Need Plans Found
                        </h3>
                        <p className="text-xs text-slate-500">
                            Please check back later as new plans are being added.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {GROUPS.map((group) => {
                            const plans = groups[group.key] ?? [];
                            if (plans.length === 0) return null;
                            const Icon = group.icon;
                            return (
                                <div key={group.key}>
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800">
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl sm:text-2xl font-heading italic font-bold text-slate-900">
                                                {group.label}
                                            </h2>
                                            <p className="text-xs text-slate-500">
                                                {plans.length} plan{plans.length === 1 ? '' : 's'} available
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {plans.map((plan) => (
                                            <motion.div
                                                key={plan.id}
                                                whileHover={{ y: -4 }}
                                                transition={{ duration: 0.2 }}
                                                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-emerald-500/55 hover:shadow-md flex flex-col group"
                                            >
                                                <div className="relative h-36 w-full overflow-hidden bg-slate-900">
                                                    {plan.image ? (
                                                        <img
                                                            src={plan.image}
                                                            alt={plan.name}
                                                            referrerPolicy="no-referrer"
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-900 flex items-center justify-center">
                                                            <Icon className="w-10 h-10 text-emerald-300/80" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />
                                                    <div className="absolute top-3 right-3 z-10">
                                                        <span className="bg-emerald-900/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/40 uppercase">
                                                            {plan.type} Plan
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="p-5 flex-1 flex flex-col">
                                                    <h3 className="font-heading italic font-bold text-slate-900 text-lg mb-1">
                                                        {plan.name}
                                                    </h3>
                                                    <p className="text-xs text-slate-600 leading-relaxed mb-3 line-clamp-2">
                                                        {plan.description}
                                                    </p>

                                                    <div className="space-y-1.5 mb-4">
                                                        {(plan.features ?? []).slice(0, 3).map((feature, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="flex items-start gap-1.5 text-[11px] text-slate-700"
                                                            >
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                                                                <span className="line-clamp-1">{feature}</span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between mb-3 mt-auto">
                                                        <span className="text-xs text-slate-500">Price:</span>
                                                        <span className="text-lg font-bold font-heading text-emerald-700">
                                                            ₱{plan.price.toLocaleString()}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2">
                                                        <Link
                                                            href={`/plans/${plan.slug}`}
                                                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                                                        >
                                                            <span>View Details</span>
                                                            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                                                        </Link>
                                                        <Link
                                                            href={`/reserve?type=plan&plan=${plan.slug}`}
                                                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center transition-colors shadow-sm"
                                                        >
                                                            Reserve
                                                        </Link>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlansPage;
