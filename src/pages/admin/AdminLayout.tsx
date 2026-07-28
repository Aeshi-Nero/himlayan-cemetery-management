import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
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
  Bot,
  UserCheck,
  Building,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Deceased Records', path: '/admin/records', icon: Calendar, roleExclude: 'super_admin' },
    { name: 'Inquiries', path: '/admin/inquiries', icon: MessageSquare, roleExclude: 'super_admin' },
    { name: 'Contracts', path: '/admin/contracts', icon: FileText, roleExclude: 'super_admin' },
    { name: 'Payments', path: '/admin/payments', icon: CreditCard, roleExclude: 'super_admin' },
    { name: 'Burial Scheduling', path: '/admin/burials', icon: Calendar, roleExclude: 'super_admin' },
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-body flex">
      {/* Sidebar Overlay on mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Logo Brand */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
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

          {/* Navigation Items */}
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
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

        {/* User Profile & Logout Footer */}
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
              onClick={() => {
                logout();
                navigate('/login');
              }}
              title="Logout"
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
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

          {user?.role !== 'rcc' && (
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="text-xs text-slate-600 hover:text-emerald-700 transition-colors flex items-center gap-1.5 font-medium"
              >
                <span>Public Website</span>
              </Link>
            </div>
          )}
        </header>

        {/* Page Body */}
        <main className="flex-1 p-6 overflow-y-auto bg-slate-50 text-slate-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
