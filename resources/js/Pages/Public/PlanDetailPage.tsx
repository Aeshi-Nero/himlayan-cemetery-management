import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { CheckCircle2, ArrowLeft, ArrowRight, Flower2, MapPin } from 'lucide-react';
import { Navbar } from '@/Components/Public/Navbar';
import { PreNeedPlan } from '@/types';

interface PlansResponse {
    success: boolean;
    data: Record<string, PreNeedPlan[]>;
}

export const PlanDetailPage: React.FC<{ slug: string }> = ({ slug }) => {
    const [plan, setPlan] = useState<PreNeedPlan | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlan = async () => {
            setLoading(true);
            try {
                const res = await window.axios.get('/api/reserve/plans');
                if (res.data?.success) {
                    const groups = res.data.data as Record<string, PreNeedPlan[]>;
                    const allPlans = Object.values(groups).flat();
                    const found = allPlans.find((p) => p.slug === slug);
                    setPlan(found ?? null);
                }
            } catch (err) {
                console.error('Error fetching plan:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPlan();
    }, [slug]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-body pt-24 pb-16">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <Link
                    href="/plans"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-800 bg-white border border-slate-200 hover:border-emerald-400 px-4 py-2 rounded-full mb-6 transition-all shadow-2xs"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Pre-Need Plans</span>
                </Link>

                {loading ? (
                    <div className="py-20 text-center text-slate-500">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-3" />
                        <p className="text-xs">Loading plan details...</p>
                    </div>
                ) : !plan ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                        <Flower2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <h3 className="font-heading italic text-lg text-slate-900 font-bold mb-1">
                            Plan Not Found
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">
                            We could not find the plan you were looking for.
                        </p>
                        <Link
                            href="/plans"
                            className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-full text-xs font-bold transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Browse All Plans</span>
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-slate-900">
                            {plan.image ? (
                                <img
                                    src={plan.image}
                                    alt={plan.name}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-900 flex items-center justify-center">
                                    <Flower2 className="w-16 h-16 text-emerald-300/80" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
                            <div className="absolute bottom-4 left-5 right-5 z-10">
                                <span className="bg-emerald-900/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/40 uppercase mb-2 inline-block">
                                    {plan.type} Plan
                                </span>
                                <h1 className="text-2xl sm:text-3xl font-heading italic font-bold text-white drop-shadow-md">
                                    {plan.name}
                                </h1>
                            </div>
                        </div>

                        <div className="p-6 sm:p-8">
                            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
                                <div>
                                    <span className="text-xs text-slate-500 block mb-1">
                                        Plan Price
                                    </span>
                                    <span className="text-3xl font-heading italic font-bold text-emerald-700">
                                        ₱{plan.price.toLocaleString()}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-slate-500 block mb-1">
                                        Plan Type
                                    </span>
                                    <span className="text-sm font-bold text-slate-900 capitalize">
                                        {plan.type}
                                    </span>
                                </div>
                            </div>

                            <h2 className="text-lg font-heading italic font-bold text-slate-900 mb-2">
                                About This Plan
                            </h2>
                            <p className="text-sm text-slate-700 leading-relaxed mb-6">
                                {plan.description}
                            </p>

                            <h2 className="text-lg font-heading italic font-bold text-slate-900 mb-3">
                                What's Included
                            </h2>
                            {(plan.features ?? []).length > 0 ? (
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                                    {(plan.features ?? []).map((feature, idx) => (
                                        <li
                                            key={idx}
                                            className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700"
                                        >
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-slate-500 mb-8">
                                    No additional inclusions listed for this plan.
                                </p>
                            )}

                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6 flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-emerald-700 mt-0.5 shrink-0" />
                                <p className="text-xs text-emerald-900 leading-relaxed">
                                    This is a pre-need reservation. A member of the Himlayan ng
                                    Bayan team will contact you within 24 hours to confirm the
                                    details and discuss payment terms.
                                </p>
                            </div>

                            <Link
                                href={`/reserve?type=plan&plan=${plan.slug}`}
                                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                            >
                                <span>Reserve this plan</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlanDetailPage;
