import React, { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Send, User, Phone, Mail, MapPin, MessageSquare, CheckCircle2, Grid, Layers, Package } from 'lucide-react';
import { Navbar } from '@/Components/Public/Navbar';
import { Plot, ColumbaryNiche, PreNeedPlan } from '@/types';

type ReserveType = 'lot' | 'columbary' | 'plan';

const TYPES: { key: ReserveType; label: string; icon: typeof Grid }[] = [
    { key: 'lot', label: 'Memorial Lots', icon: Grid },
    { key: 'columbary', label: 'Columbary Niche', icon: Layers },
    { key: 'plan', label: 'Pre-Need Plan', icon: Package },
];

export const ReservePage: React.FC = () => {
    const { url } = usePage();
    const params = new URL(url, window.location.origin).searchParams;

    const typeParam = params.get('type');
    const planParam = params.get('plan');
    const plotParam = params.get('plot');
    const nicheParam = params.get('niche');

    const [type, setType] = useState<ReserveType>(
        typeParam === 'lot' ? 'lot' : typeParam === 'columbary' ? 'columbary' : 'plan',
    );
    const [plots, setPlots] = useState<Plot[]>([]);
    const [niches, setNiches] = useState<ColumbaryNiche[]>([]);
    const [plans, setPlans] = useState<PreNeedPlan[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedPlotId, setSelectedPlotId] = useState<string | null>(plotParam || null);
    const [selectedNicheId, setSelectedNicheId] = useState<string | null>(nicheParam || null);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

    const [fullName, setFullName] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [message, setMessage] = useState('');

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const changeType = (next: ReserveType) => {
        setType(next);
        setSelectedPlotId(null);
        setSelectedNicheId(null);
        setSelectedPlanId(null);
        setFieldErrors({});
        setSubmitError(null);
    };

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        const load = async () => {
            try {
                if (type === 'lot') {
                    const res = await window.axios.get('/api/reserve/lots');
                    if (res.data?.success) setPlots(res.data.data as Plot[]);
                } else if (type === 'columbary') {
                    const res = await window.axios.get('/api/reserve/columbarium');
                    if (res.data?.success) setNiches(res.data.data as ColumbaryNiche[]);
                } else {
                    const res = await window.axios.get('/api/reserve/plans');
                    if (res.data?.success) {
                        const groups = res.data.data as Record<string, PreNeedPlan[]>;
                        setPlans(Object.values(groups).flat());
                    }
                }
            } catch (err) {
                console.error('Error loading reservation options:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [type]);

    useEffect(() => {
        if (type === 'plan' && planParam && plans.length > 0) {
            const found = plans.find((p) => p.slug === planParam);
            if (found) setSelectedPlanId(found.id);
        }
    }, [type, planParam, plans]);

    const getSelectedLabel = () => {
        if (type === 'lot') {
            const plot = plots.find((p) => p.id === selectedPlotId);
            return plot ? `Memorial Lot #${plot.plot_number} • Section ${plot.section}` : null;
        }
        if (type === 'columbary') {
            const niche = niches.find((n) => n.id === selectedNicheId);
            return niche
                ? `Columbary Niche #${niche.niche_number} • ${niche.section || 'General'}`
                : null;
        }
        const plan = plans.find((p) => p.id === selectedPlanId);
        return plan ? plan.name : null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors: Record<string, string> = {};
        if (!fullName.trim()) errors.full_name = 'Full name is required.';
        if (!contactNumber.trim()) errors.contact_number = 'Contact number is required.';
        const hasSelection =
            type === 'lot' ? !!selectedPlotId : type === 'columbary' ? !!selectedNicheId : !!selectedPlanId;
        if (!hasSelection) errors.selection = 'Please select an item to reserve.';
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setSubmitError(null);
            return;
        }

        setSubmitting(true);
        setSubmitError(null);

        const payload: Record<string, unknown> = {
            type,
            full_name: fullName,
            contact_number: contactNumber,
            email: email || undefined,
            address: address || undefined,
            message: message || undefined,
        };
        if (type === 'lot') payload.plot_id = selectedPlotId || undefined;
        if (type === 'columbary') payload.columbary_niche_id = selectedNicheId || undefined;
        if (type === 'plan') payload.pre_need_plan_id = selectedPlanId || undefined;

        try {
            const res = await window.axios.post('/api/reserve', payload);
            if (res.data?.success) {
                sessionStorage.setItem('reserve_message', res.data.message || '');
                router.get('/reserve/confirmation');
            }
        } catch (err: any) {
            const apiErrors = err.response?.data?.errors;
            if (apiErrors) {
                const mapped: Record<string, string> = {};
                Object.keys(apiErrors).forEach((key) => {
                    const value = apiErrors[key];
                    mapped[key] = Array.isArray(value) ? value[0] : String(value);
                });
                setFieldErrors(mapped);
            } else {
                setFieldErrors({});
                setSubmitError(
                    err.response?.data?.message || 'Something went wrong. Please try again.',
                );
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-body pt-24 pb-16">
            <Navbar />

            <div className="max-w-5xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-8">
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                        Himlayan ng Bayan Reservation
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-heading italic font-bold text-slate-900 mt-1">
                        Reserve Your Memorial Item
                    </h1>
                    <p className="text-slate-600 text-xs sm:text-sm mt-2">
                        Select a memorial lot, columbary niche, or pre-need plan and submit your
                        reservation request.
                    </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
                    {TYPES.map((item) => {
                        const Icon = item.icon;
                        const isActive = type === item.key;
                        return (
                            <button
                                key={item.key}
                                onClick={() => changeType(item.key)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                    isActive
                                        ? 'bg-emerald-700 text-white shadow-md'
                                        : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-400 hover:text-emerald-800'
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3">
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-heading italic font-bold text-slate-900">
                                    {type === 'lot'
                                        ? 'Select Available Memorial Lot'
                                        : type === 'columbary'
                                          ? 'Select Available Columbary Niche'
                                          : 'Select Pre-Need Plan'}
                                </h2>
                                {selectedPlotId || selectedNicheId || selectedPlanId ? (
                                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full uppercase tracking-wide">
                                        Selected
                                    </span>
                                ) : null}
                            </div>

                            {loading ? (
                                <div className="py-12 text-center text-slate-500">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-3" />
                                    <p className="text-xs">Loading available options...</p>
                                </div>
                            ) : type === 'lot' ? (
                                plots.length === 0 ? (
                                    <p className="py-12 text-center text-xs text-slate-500">
                                        No available memorial lots right now.
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {plots.map((plot) => {
                                            const isSelected = selectedPlotId === plot.id;
                                            return (
                                                <button
                                                    key={plot.id}
                                                    onClick={() => {
                                                        setSelectedPlotId(plot.id);
                                                        setFieldErrors((prev) => ({
                                                            ...prev,
                                                            selection: '',
                                                        }));
                                                    }}
                                                    className={`text-left rounded-xl border p-3.5 transition-all cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600/20'
                                                            : 'bg-white border-slate-200 hover:border-emerald-400'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-[11px] font-bold text-slate-500 uppercase">
                                                            Section {plot.section}
                                                        </span>
                                                        {isSelected && (
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                        )}
                                                    </div>
                                                    <div className="font-heading font-bold text-slate-900 text-sm">
                                                        Lot #{plot.plot_number}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 capitalize mb-1.5">
                                                        {plot.lot_type}
                                                    </div>
                                                    <div className="text-xs font-bold text-emerald-700">
                                                        ₱{plot.price?.toLocaleString() ?? '0'}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )
                            ) : type === 'columbary' ? (
                                niches.length === 0 ? (
                                    <p className="py-12 text-center text-xs text-slate-500">
                                        No available columbary niches right now.
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {niches.map((niche) => {
                                            const isSelected = selectedNicheId === niche.id;
                                            return (
                                                <button
                                                    key={niche.id}
                                                    onClick={() => {
                                                        setSelectedNicheId(niche.id);
                                                        setFieldErrors((prev) => ({
                                                            ...prev,
                                                            selection: '',
                                                        }));
                                                    }}
                                                    className={`text-left rounded-xl border p-3.5 transition-all cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600/20'
                                                            : 'bg-white border-slate-200 hover:border-emerald-400'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-[11px] font-bold text-slate-500 uppercase">
                                                            {niche.section || 'General'}
                                                        </span>
                                                        {isSelected && (
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                        )}
                                                    </div>
                                                    <div className="font-heading font-bold text-slate-900 text-sm">
                                                        Niche #{niche.niche_number}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 mb-1.5">
                                                        Row {niche.row || '-'} • Tier {niche.tier || '-'}
                                                    </div>
                                                    <div className="text-xs font-bold text-emerald-700">
                                                        ₱{niche.price.toLocaleString()}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )
                            ) : plans.length === 0 ? (
                                <p className="py-12 text-center text-xs text-slate-500">
                                    No pre-need plans available right now.
                                </p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {plans.map((plan) => {
                                        const isSelected = selectedPlanId === plan.id;
                                        return (
                                            <button
                                                key={plan.id}
                                                onClick={() => {
                                                    setSelectedPlanId(plan.id);
                                                    setFieldErrors((prev) => ({
                                                        ...prev,
                                                        selection: '',
                                                    }));
                                                }}
                                                className={`text-left rounded-xl border p-4 transition-all cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600/20'
                                                        : 'bg-white border-slate-200 hover:border-emerald-400'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <div className="font-heading font-bold text-slate-900 text-sm">
                                                        {plan.name}
                                                    </div>
                                                    {isSelected && (
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-slate-500 capitalize mb-1.5">
                                                    {plan.type} Plan
                                                </div>
                                                <div className="text-xs font-bold text-emerald-700">
                                                    ₱{plan.price.toLocaleString()}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {fieldErrors.selection && (
                                <p className="mt-3 text-[11px] font-semibold text-rose-600">
                                    {fieldErrors.selection}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <form
                            onSubmit={handleSubmit}
                            className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4"
                        >
                            <h2 className="font-heading italic font-bold text-slate-900">
                                Your Details
                            </h2>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Full Name *
                                </label>
                                <div className="relative">
                                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="e.g. Juanita Reyes"
                                        className={`w-full bg-slate-50 border rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 ${
                                            fieldErrors.full_name
                                                ? 'border-rose-400'
                                                : 'border-slate-300'
                                        }`}
                                    />
                                </div>
                                {fieldErrors.full_name && (
                                    <p className="mt-1 text-[11px] font-semibold text-rose-600">
                                        {fieldErrors.full_name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Contact Number *
                                </label>
                                <div className="relative">
                                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                    <input
                                        type="text"
                                        value={contactNumber}
                                        onChange={(e) => setContactNumber(e.target.value)}
                                        placeholder="+63 917 123 4567"
                                        className={`w-full bg-slate-50 border rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 ${
                                            fieldErrors.contact_number
                                                ? 'border-rose-400'
                                                : 'border-slate-300'
                                        }`}
                                    />
                                </div>
                                {fieldErrors.contact_number && (
                                    <p className="mt-1 text-[11px] font-semibold text-rose-600">
                                        {fieldErrors.contact_number}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Email Address (Optional)
                                </label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Address (Optional)
                                </label>
                                <div className="relative">
                                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                    <input
                                        type="text"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        placeholder="Complete address"
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Message / Notes (Optional)
                                </label>
                                <div className="relative">
                                    <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                    <textarea
                                        rows={3}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Additional details for the reservation team..."
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                                    />
                                </div>
                            </div>

                            {submitError && (
                                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-[11px] font-semibold text-rose-700">
                                    {submitError}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" />
                                <span>{submitting ? 'Submitting Reservation...' : 'Submit Reservation'}</span>
                            </button>

                            {getSelectedLabel() && (
                                <p className="text-center text-[11px] text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 rounded-xl py-2.5 px-3">
                                    Reserving: {getSelectedLabel()}
                                </p>
                            )}
                        </form>
                    </div>
                </div>

                <p className="text-center text-[11px] text-slate-500 mt-10">
                    By submitting this reservation, you agree to be contacted by the Himlayan ng
                    Bayan Memorial Park team for confirmation and payment arrangements.
                </p>
            </div>
        </div>
    );
};

export default ReservePage;
