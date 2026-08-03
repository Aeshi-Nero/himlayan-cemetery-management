import React, { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { motion } from 'motion/react';
import {
    MapPin,
    LogIn,
    LayoutDashboard,
    Home,
    FileSearch,
} from 'lucide-react';
import type { AuthUser } from '../../types/inertia';

import solanoLguSealImg from '../../assets/images/solano_lgu_seal_1784964597638.jpg';
import himlayanLogoOfficialImg from '../../assets/images/himlayan_ng_bayan_logo_2026.png';

const navLinks = [
    { name: 'Home Page', path: '/', icon: Home },
    { name: 'Interactive Map', path: '/map', icon: MapPin },
];

export const Navbar: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const { url } = usePage();
    const { auth } = usePage().props;
    const user = (auth?.user as AuthUser | null) ?? null;

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 40);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const currentPath = url.split('?')[0];

    return (
        <motion.header
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className={`fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 lg:px-16 py-2.5 transition-all duration-300 ${
                scrolled
                    ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-slate-200 text-slate-900'
                    : 'bg-white/90 backdrop-blur-md border-b border-slate-200/80 text-slate-900'
            }`}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between relative">
                {/* Left Logo */}
                <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
                    <img
                        src={solanoLguSealImg}
                        alt="LGU Solano Seal"
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover shadow-sm border border-slate-200 group-hover:scale-105 transition-transform"
                    />
                    <span className="text-slate-300 font-light text-lg sm:text-xl select-none px-0.5">
                        |
                    </span>
                    <div className="flex items-center">
                        <img
                            src={himlayanLogoOfficialImg}
                            alt="Himlayan ng Bayan Logo"
                            className="h-9 sm:h-10 max-w-[180px] sm:max-w-[220px] object-contain group-hover:opacity-90 transition-opacity"
                        />
                    </div>
                </Link>

                {/* Center Pill Nav - Perfectly Centered */}
                <div className="hidden md:flex items-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-100/90 rounded-full p-1 border border-slate-200 gap-1 shadow-inner">
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = currentPath === link.path;
                        return (
                            <Link
                                key={link.path}
                                href={link.path}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-body font-semibold transition-all ${
                                    isActive
                                        ? 'bg-emerald-700 text-white shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {link.name}
                            </Link>
                        );
                    })}

                    {/* Combined Memorial Inquiry Button */}
                    <Link
                        href="/lots"
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-body font-semibold transition-all ${
                            currentPath === '/lots'
                                ? 'bg-emerald-700 text-white shadow-sm'
                                : 'bg-emerald-700 text-white shadow-sm hover:bg-emerald-800'
                        }`}
                    >
                        <FileSearch className="w-3.5 h-3.5" />
                        Memorial Inquiry
                    </Link>
                </div>

                {/* Right CTA */}
                <div className="flex items-center gap-3">
                    {user ? (
                        <Link
                            href="/admin/dashboard"
                            className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-full px-5 py-2.5 text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
                        >
                            <LayoutDashboard className="w-3.5 h-3.5" />
                            <span>Dashboard</span>
                        </Link>
                    ) : (
                        <Link
                            href="/login"
                            className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-5 py-2.5 text-xs font-bold font-body flex items-center gap-2 shadow-sm transition-all hover:scale-105"
                        >
                            <LogIn className="w-3.5 h-3.5 text-slate-300" />
                            <span>Login</span>
                        </Link>
                    )}
                </div>
            </div>
        </motion.header>
    );
};
