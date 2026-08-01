import React, { useEffect, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { AuthUser } from '@/types/inertia';
import { UserNotification } from '@/types';
import {
    LayoutDashboard,
    Users,
    FileText,
    CreditCard,
    Calendar,
    BarChart3,
    MapPin,
    Grid,
    GitBranch,
    ShieldAlert,
    Settings,
    LogOut,
    Menu,
    X,
    MessageSquare,
    FileBadge,
    Package,
    Layers,
    Star,
    BellRing,
    Bell,
} from 'lucide-react';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const { url, props } = usePage();
    const user = props.auth.user as AuthUser | null;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState<UserNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [bellOpen, setBellOpen] = useState(false);

    const currentPath = url.split('?')[0];

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await window.axios.get('/api/user-notifications', { params: { unread_only: true } });
                if (res.data?.success) {
                    setNotifications(res.data.data);
                    setUnreadCount(res.data.unread_count);
                }
            } catch {}
        };
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const timeAgo = (dateStr: string) => {
        const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
        if (seconds < 60) return `${Math.max(0, seconds)}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const handleMarkRead = async (notification: UserNotification) => {
        setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)));
        setUnreadCount((c) => Math.max(0, c - 1));
        try {
            await window.axios.post(`/api/user-notifications/${notification.id}/read`);
        } catch {}
        if (notification.link) {
            router.get(notification.link);
        }
    };

    const handleMarkAllRead = async () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
        try {
            await window.axios.post('/api/user-notifications/read-all');
        } catch {}
    };

    const navItems = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Deceased Records', path: '/admin/records', icon: Calendar, roleExclude: 'super_admin' },
        { name: 'Inquiries', path: '/admin/inquiries', icon: MessageSquare, roleExclude: 'super_admin' },
        { name: 'Contracts', path: '/admin/contracts', icon: FileText, roleExclude: 'super_admin' },
        { name: 'Payments', path: '/admin/payments', icon: CreditCard, roleExclude: 'super_admin' },
        { name: 'Burial Scheduling', path: '/admin/burials', icon: Calendar, roleExclude: 'super_admin' },
        { name: 'Burial Permits', path: '/admin/permits', icon: FileBadge, roleExclude: 'engineer' },
        { name: 'Pre-Need Plans', path: '/admin/plans', icon: Package, roleExclude: 'engineer' },
        { name: 'Columbary Niches', path: '/admin/niches', icon: Layers, roleExclude: 'engineer' },
        { name: 'Client Feedback', path: '/admin/feedback', icon: Star, roleExclude: 'engineer' },
        { name: 'Client Notifications', path: '/admin/client-notifications', icon: BellRing, roleExclude: 'engineer' },
        { name: 'Reports', path: '/admin/reports', icon: BarChart3, roleExclude: 'super_admin' },
        { name: 'Map Editor', path: '/admin/map-editor', icon: MapPin, roleExclude: ['rcc', 'super_admin'] },
        { name: 'Plots Inventory', path: '/admin/plots', icon: Grid, roleExclude: ['rcc', 'super_admin'] },
        { name: 'Pathways Graph', path: '/admin/pathways', icon: GitBranch, roleExclude: ['rcc', 'super_admin'] },
        { name: 'User Accounts', path: '/admin/users', icon: Users, roleRequired: 'super_admin' },
        { name: 'Audit Logs', path: '/admin/audit', icon: ShieldAlert, roleExclude: 'rcc' },
        { name: 'Settings', path: '/admin/settings', icon: Settings },
    ];

    const filteredNavItems = navItems.filter(
        (item) =>
            (!item.roleRequired || user?.role === item.roleRequired) &&
            (!item.roleExclude ||
                (Array.isArray(item.roleExclude)
                    ? !item.roleExclude.includes(user?.role || '')
                    : user?.role !== item.roleExclude))
    );

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-body flex">
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
                />
            )}

            <aside
                className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                }`}
            >
                <div>
                    <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center font-heading font-bold text-white text-lg shadow-md">
                                H
                            </div>
                            <div>
                                <span className="font-heading italic text-lg font-bold text-slate-900 block">Himlayan</span>
                                <span className="text-[10px] text-emerald-700 tracking-widest uppercase block -mt-1 font-semibold">
                                    Admin Portal
                                </span>
                            </div>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-slate-400 hover:text-slate-700"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
                        {filteredNavItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentPath === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                                        isActive
                                            ? 'bg-emerald-700 text-white font-bold shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-4 border-t border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-emerald-800 shrink-0 font-bold text-xs">
                                {user?.full_name?.charAt(0) || 'U'}
                            </div>
                            <div className="overflow-hidden">
                                <span className="font-bold text-xs text-slate-900 block truncate">{user?.full_name}</span>
                                <span className="text-[10px] text-emerald-700 uppercase font-semibold block truncate">
                                    Role: {user?.role}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            title="Logout"
                            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-30 shadow-xs">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <span className="text-xs text-slate-600 font-medium">
                            Himlayan Memorial Park Administration
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <button
                                onClick={() => setBellOpen((o) => !o)}
                                title="Notifications"
                                className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>
                            {bellOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-xl shadow-lg border border-slate-200 z-50">
                                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 sticky top-0 bg-white">
                                            <span className="text-sm font-bold text-slate-900">Notifications</span>
                                            <button
                                                onClick={handleMarkAllRead}
                                                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
                                            >
                                                Mark all read
                                            </button>
                                        </div>
                                        <div>
                                            {notifications.length === 0 ? (
                                                <div className="px-4 py-8 text-center text-xs text-slate-500">No notifications</div>
                                            ) : (
                                                notifications.map((n) => (
                                                    <button
                                                        key={n.id}
                                                        onClick={() => handleMarkRead(n)}
                                                        className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 flex items-start gap-2.5 cursor-pointer"
                                                    >
                                                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />}
                                                        <span className="min-w-0">
                                                            <span className="block font-medium text-xs text-slate-900">{n.title}</span>
                                                            {n.body && (
                                                                <span className="block text-xs text-slate-600 line-clamp-2 mt-0.5">{n.body}</span>
                                                            )}
                                                            <span className="block text-[10px] text-slate-400 mt-1">
                                                                {timeAgo(n.created_at || n.createdAt)}
                                                            </span>
                                                        </span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        {user?.role !== 'rcc' && (
                            <Link
                                href="/"
                                className="text-xs text-slate-600 hover:text-emerald-700 transition-colors flex items-center gap-1.5 font-medium"
                            >
                                <span>Public Website</span>
                            </Link>
                        )}
                    </div>
                </header>

                <main className="flex-1 p-6 overflow-y-auto bg-slate-50 text-slate-900">
                    {children}
                </main>
            </div>
        </div>
    );
}
