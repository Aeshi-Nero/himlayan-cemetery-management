import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { CheckCircle2, Home, Grid } from 'lucide-react';
import { Navbar } from '@/Components/Public/Navbar';

const DEFAULT_MESSAGE =
    'Your reservation has been submitted successfully. Our team will contact you within 24 hours.';

export const ReserveConfirmationPage: React.FC = () => {
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        const stored = sessionStorage.getItem('reserve_message');
        if (stored) {
            setMessage(stored);
            sessionStorage.removeItem('reserve_message');
        }
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-body pt-24 pb-16">
            <Navbar />

            <div className="max-w-2xl mx-auto px-4 sm:px-6">
                <div className="bg-white border border-emerald-200 rounded-2xl p-8 sm:p-12 text-center space-y-5 shadow-sm">
                    <div className="w-20 h-20 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-heading italic font-bold text-slate-900">
                        Reservation Submitted
                    </h1>
                    <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                        {message ?? DEFAULT_MESSAGE}
                    </p>
                    <div className="pt-4 flex flex-wrap justify-center gap-3">
                        <Link
                            href="/"
                            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-5 py-2.5 rounded-full font-bold flex items-center gap-2 shadow-sm transition-all"
                        >
                            <Home className="w-3.5 h-3.5" />
                            <span>Back to Home</span>
                        </Link>
                        <Link
                            href="/lots"
                            className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs px-5 py-2.5 rounded-full font-semibold flex items-center gap-2 transition-colors"
                        >
                            <Grid className="w-3.5 h-3.5" />
                            <span>View Memorial Lots</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReserveConfirmationPage;
