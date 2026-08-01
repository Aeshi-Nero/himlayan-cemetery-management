import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Lock, Mail, Eye, EyeOff, Loader2, Shield, UserCheck, Wrench, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

import untitledDesignImg from '@/assets/images/untitled_design_1784969951289.jpg';
import himlayanBackdropImg from '@/assets/images/himlayan_hero_bg_top_text_1785132444974.jpg';
import flowerGardenImg from '@/assets/images/peaceful_flower_garden_1784913922607.jpg';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword?: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: 'Admin@123',
        remember: false,
    });
    const [showPassword, setShowPassword] = useState(false);

    const handleDemoSelect = (demoEmail: string) => {
        setData({ email: demoEmail, password: 'Admin@123', remember: false });
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Login" />
            <div className="h-screen bg-slate-50 flex flex-col lg:flex-row font-body text-slate-900 overflow-hidden">
                {/* Left Column: Atmospheric Media & Branding */}
                <div className="hidden lg:flex lg:w-[45%] h-full relative overflow-hidden bg-slate-950 flex-col justify-between p-12">
                    <img
                        src={himlayanBackdropImg}
                        alt="Himlayan Bright Cemetery Background"
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover object-center filter blur-[4px] brightness-110 contrast-105 scale-110 opacity-70 transition-opacity duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/75 via-slate-900/85 to-slate-950/90" />

                    {/* Top Link Back */}
                    <div className="relative z-10 flex items-center justify-between">
                        <Link
                            href="/"
                            title="Back to Public Website"
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white transition-all shadow-lg"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    </div>

                    {/* Center Content */}
                    <div className="relative z-10 my-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            <span className="font-heading italic font-extrabold text-emerald-300 text-3xl lg:text-4xl block mb-2 tracking-wide drop-shadow-md">
                                Himlayan
                            </span>
                            <h1 className="text-4xl lg:text-5xl font-heading font-bold italic text-white mb-6 leading-tight drop-shadow-sm">
                                Management Portal
                            </h1>
                            <p className="text-emerald-100/80 text-sm lg:text-base max-w-md leading-relaxed mb-8">
                                Access the centralized system to manage memorial lots, oversee park operations, and provide seamless service to our families.
                            </p>

                            <div className="space-y-4">
                                {[
                                    'Real-time interactive GIS mapping',
                                    'Comprehensive client record management',
                                    'Streamlined lot purchasing and transfers',
                                ].map((feature, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                        </div>
                                        <span className="text-slate-300 text-sm">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Bottom Trust Badge */}
                    <div className="relative z-10 text-xs text-slate-400">
                        <p>© 2026 Himlayan Cemetery</p>
                    </div>
                </div>

                {/* Right Column: Login Form */}
                <div className="w-full lg:w-[55%] h-full overflow-y-auto bg-slate-50 relative">
                    <div className="min-h-full flex items-center justify-center p-6 sm:p-12 lg:p-24 relative z-10">
                        {/* Decorative background elements for right side */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-200/50 rounded-full blur-3xl pointer-events-none -ml-32 -mb-32"></div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="w-full max-w-md bg-white border border-slate-200/60 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50 relative z-20"
                        >
                            <div className="mb-8">
                                <span className="inline-block bg-emerald-50 text-emerald-700 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest mb-4 border border-emerald-100">
                                    Authorized Personnel Only
                                </span>
                                <h2 className="text-3xl font-heading italic font-bold text-slate-900">Welcome Back</h2>
                                <p className="text-sm text-slate-500 mt-2">Sign in with your government email credentials to access the dashboard.</p>
                            </div>

                            {status && (
                                <div className="mb-4 text-sm font-medium text-green-600">{status}</div>
                            )}

                            {/* Quick Demo Credentials */}
                            <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 mb-8">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3 text-center">Select Role to Demo</span>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleDemoSelect('rcc@himlayan.gov.ph')}
                                        className={`p-3 rounded-xl font-bold border transition-all flex flex-col items-center gap-2 cursor-pointer ${
                                            data.email === 'rcc@himlayan.gov.ph'
                                                ? 'bg-emerald-700 text-white border-emerald-800 shadow-md transform scale-105'
                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                                        }`}
                                    >
                                        <UserCheck className="w-4 h-4" />
                                        <span className="text-[10px] uppercase tracking-wider">RCC Clerk</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleDemoSelect('engineer@himlayan.gov.ph')}
                                        className={`p-3 rounded-xl font-bold border transition-all flex flex-col items-center gap-2 cursor-pointer ${
                                            data.email === 'engineer@himlayan.gov.ph'
                                                ? 'bg-emerald-700 text-white border-emerald-800 shadow-md transform scale-105'
                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                                        }`}
                                    >
                                        <Wrench className="w-4 h-4" />
                                        <span className="text-[10px] uppercase tracking-wider">Engineer</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleDemoSelect('admin@himlayan.gov.ph')}
                                        className={`p-3 rounded-xl font-bold border transition-all flex flex-col items-center gap-2 cursor-pointer ${
                                            data.email === 'admin@himlayan.gov.ph'
                                                ? 'bg-emerald-700 text-white border-emerald-800 shadow-md transform scale-105'
                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                                        }`}
                                    >
                                        <Shield className="w-4 h-4" />
                                        <span className="text-[10px] uppercase tracking-wider">Admin</span>
                                    </button>
                                </div>
                            </div>

                            {(errors.email || errors.password) && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-4 rounded-xl mb-6 flex items-start gap-3">
                                    <div className="w-1 h-full bg-rose-500 rounded-full shrink-0"></div>
                                    <p>{errors.email || errors.password}</p>
                                </motion.div>
                            )}

                            {/* Form */}
                            <form onSubmit={handleLogin} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Email Address</label>
                                    <div className="relative group">
                                        <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 group-focus-within:text-emerald-600 transition-colors" />
                                        <input
                                            type="email"
                                            required
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="name@himlayan.gov.ph"
                                            className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400 shadow-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Password</label>
                                        {canResetPassword && (
                                            <Link href={route('password.request')} className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold hover:underline">Forgot?</Link>
                                        )}
                                    </div>
                                    <div className="relative group">
                                        <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 group-focus-within:text-emerald-600 transition-colors" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-12 py-3.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400 shadow-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-slate-900 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 transition-all cursor-pointer disabled:opacity-70 mt-4"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Authenticating...</span>
                                        </>
                                    ) : (
                                        <span>Access Dashboard</span>
                                    )}
                                </button>
                            </form>

                            {/* Mobile Back Link */}
                            <div className="text-center pt-8 lg:hidden">
                                <Link href="/" className="text-xs text-slate-500 hover:text-emerald-700 transition-colors inline-flex items-center gap-1 font-medium">
                                    <ArrowLeft className="w-3 h-3" /> Return to Website
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
}
