import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  Grid,
  DollarSign,
  MessageSquare,
  Activity,
  ShieldCheck,
  ArrowUpRight,
  TrendingUp,
  Users,
  Calendar,
  MapPin,
  Search,
  PlusCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Inbox,
  Briefcase,
  FileText,
  User as UserIcon,
  Phone,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiClient } from '../../api/client';
import { ActivityLog, Inquiry, Burial } from '../../types';
import { useAuthStore } from '../../store/authStore';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Extra states for Clerk workspace
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [burials, setBurials] = useState<Burial[]>([]);
  const [activeTab, setActiveTab] = useState<'burials' | 'inquiries' | 'activity'>('burials');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashRes, inqRes, burRes] = await Promise.all([
          apiClient.get('/dashboard'),
          user?.role === 'rcc' ? apiClient.get('/inquiries') : Promise.resolve({ data: { success: false } }),
          user?.role === 'rcc' ? apiClient.get('/burials') : Promise.resolve({ data: { success: false } })
        ]);

        if (dashRes.data?.success) {
          setStats(dashRes.data.data);
        }
        if (inqRes.data?.success) {
          setInquiries(inqRes.data.data);
        }
        if (burRes.data?.success) {
          setBurials(burRes.data.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user?.role]);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-2" />
        <p className="text-xs">Loading Himlayan dashboard metrics...</p>
      </div>
    );
  }

  const plotStatusData = [
    { name: 'Available', value: stats?.availablePlots || 0, color: '#10b981' },
    { name: 'Reserved', value: stats?.reservedPlots || 0, color: '#f59e0b' },
    { name: 'Occupied', value: stats?.occupiedPlots || 0, color: '#f43f5e' },
  ];

  const monthlyRevenueData = [
    { month: 'Jan', revenue: 15000 },
    { month: 'Feb', revenue: 22000 },
    { month: 'Mar', revenue: 35000 },
    { month: 'Apr', revenue: 28000 },
    { month: 'May', revenue: 42000 },
    { month: 'Jun', revenue: 38000 },
    { month: 'Jul', revenue: stats?.totalRevenue || 25000 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
          {user?.role === 'rcc' ? 'RCC Clerk Workspace' : 'Himlayan Overview'}
        </span>
        <h1 className="text-2xl font-heading italic font-bold text-slate-900 mt-0.5">
          {user?.role === 'rcc' ? 'Clerk Dashboard' : 'Executive Dashboard'}
        </h1>
      </div>

      {user?.role === 'rcc' ? (
        <>
          {/* Clerk Welcome Banner */}
          <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center">
              <ShieldCheck className="w-64 h-64 -mr-16" />
            </div>
            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-700/40 rounded-full text-[11px] font-bold tracking-wider uppercase border border-emerald-500/20 backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active Work Session
              </div>
              <h2 className="text-2xl font-heading font-bold italic tracking-wide">
                Welcome back, {user?.full_name?.split(' ')[0] || 'Clerk'}!
              </h2>
              <p className="text-xs text-emerald-100 font-medium max-w-xl">
                Cemetery operations are running smoothly. Today, you have <span className="font-bold text-white underline decoration-emerald-400">{inquiries.filter(i => i.status === 'pending').length} pending inquiries</span> and <span className="font-bold text-white underline decoration-amber-400">{burials.filter(b => b.burial_status === 'scheduled').length} scheduled interments</span> requiring your attention.
              </p>
              <div className="pt-2 flex items-center gap-4 text-xs font-semibold text-emerald-200">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span>•</span>
                <span>Himlayan Memorial Portal v1.2</span>
              </div>
            </div>
          </div>

          {/* RCC High-Fidelity KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Scheduled Interments */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between transition-all hover:shadow-md hover:border-slate-300">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">Scheduled Burials</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-heading italic font-bold text-slate-900">
                    {burials.filter(b => b.burial_status === 'scheduled').length}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">upcoming</span>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  {burials.filter(b => b.burial_status === 'completed').length} completed interments
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <Calendar className="w-6 h-6" />
              </div>
            </div>

            {/* KPI 2: Pending Inquiries */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between transition-all hover:shadow-md hover:border-slate-300">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">Pending Inquiries</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-heading italic font-bold text-rose-600">
                    {inquiries.filter(i => i.status === 'pending').length}
                  </span>
                  <span className="text-xs text-rose-500 font-semibold">requires reply</span>
                </div>
                <span className="text-[10px] text-slate-500 block">
                   {inquiries.filter(i => i.status === 'completed').length} reviewed & resolved
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                <MessageSquare className="w-6 h-6" />
              </div>
            </div>

            {/* KPI 3: Active Contracts */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between transition-all hover:shadow-md hover:border-slate-300">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">Active Deeds</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-heading italic font-bold text-emerald-700">
                    {stats?.activeContracts || 0}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">deeds registered</span>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Plots Section A - D active
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                <Briefcase className="w-6 h-6" />
              </div>
            </div>

            {/* KPI 4: Total Revenue */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between transition-all hover:shadow-md hover:border-slate-300">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">Total Collections</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-heading italic font-bold text-slate-900">
                    ₱{stats?.totalRevenue?.toLocaleString() || '12,500'}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-700 font-semibold block">
                  Official receipts logged
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/50 flex items-center justify-center text-slate-700">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Reworked Quick Action Center */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Operational Shortcut Hub</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Action 1 */}
              <button
                onClick={() => navigate('/admin/burials')}
                className="group relative bg-white border border-slate-200/80 rounded-2xl p-5 text-left transition-all hover:shadow-md hover:border-emerald-600/30 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0 group-hover:scale-110 transition-transform">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">Schedule Interment</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">Book a new burial service & select plot</p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {/* Action 2 */}
              <button
                onClick={() => navigate('/admin/inquiries')}
                className="group relative bg-white border border-slate-200/80 rounded-2xl p-5 text-left transition-all hover:shadow-md hover:border-emerald-600/30 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 shrink-0 group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">Review Inquiries</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">Answer visitor queries & assign tentative plots</p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {/* Action 3 */}
              <button
                onClick={() => navigate('/admin/contracts')}
                className="group relative bg-white border border-slate-200/80 rounded-2xl p-5 text-left transition-all hover:shadow-md hover:border-emerald-600/30 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-700 shrink-0 group-hover:scale-110 transition-transform">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">Deeds & Transfers</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">Register lot sales, contracts, and transfers</p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Interactive Live Workspace (Tabbed priority lists) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            {/* Tabs Header */}
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Clerk Action Console</span>
              </div>
              <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto">
                <button
                  onClick={() => setActiveTab('burials')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'burials'
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Upcoming Burials</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-extrabold ${activeTab === 'burials' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'}`}>
                    {burials.filter(b => b.burial_status === 'scheduled').length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('inquiries')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'inquiries'
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Client Inquiries</span>
                  {inquiries.filter(i => i.status === 'pending').length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'activity'
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Live Event Log</span>
                </button>
              </div>
            </div>

            {/* Tab Contents */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {activeTab === 'burials' && (
                  <motion.div
                    key="tab-burials"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Scheduled Interments</h4>
                        <p className="text-[10px] text-slate-400">Chronological schedule of incoming burial services</p>
                      </div>
                      <button
                        onClick={() => navigate('/admin/burials')}
                        className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <span>Manage Schedule</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {burials.length === 0 ? (
                      <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                        <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-medium">No burial services are currently scheduled.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600">
                          <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-100">
                            <tr>
                              <th className="p-3 font-bold">Deceased Individual</th>
                              <th className="p-3 font-bold">Lifespan Timeline</th>
                              <th className="p-3 font-bold">Interment Schedule</th>
                              <th className="p-3 font-bold">Target Plot</th>
                              <th className="p-3 font-bold text-right">Service Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {burials.slice(0, 5).map((b) => (
                              <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                                    {b.deceased_name.substring(0, 2)}
                                  </div>
                                  <span>{b.deceased_name}</span>
                                </td>
                                <td className="p-3 text-slate-500 text-[11px]">
                                  {b.date_of_birth ? new Date(b.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'} 
                                  {' '}to{' '} 
                                  <span className="font-semibold text-rose-700">
                                    {b.date_of_death ? new Date(b.date_of_death).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                                  </span>
                                </td>
                                <td className="p-3 font-medium text-slate-800">
                                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                                    <Clock className="w-3.5 h-3.5 shrink-0" />
                                    <span>
                                      {new Date(b.burial_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    {new Date(b.burial_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </td>
                                <td className="p-3 font-mono text-[11px] text-slate-600 font-bold">
                                  {b.plot_id ? b.plot_id.toUpperCase() : '—'}
                                </td>
                                <td className="p-3 text-right">
                                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    b.burial_status === 'scheduled'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}>
                                    {b.burial_status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'inquiries' && (
                  <motion.div
                    key="tab-inquiries"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Client Reservation Inquiries</h4>
                        <p className="text-[10px] text-slate-400">Public inquiries from visitors interested in lot reservations</p>
                      </div>
                      <button
                        onClick={() => navigate('/admin/inquiries')}
                        className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <span>Open Inquiries Desk</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {inquiries.length === 0 ? (
                      <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                        <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-medium">No customer inquiries submitted yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {inquiries.slice(0, 3).map((inq) => (
                          <div key={inq.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1.5 max-w-2xl">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900">{inq.full_name || inq.client?.full_name}</span>
                                <span className="text-[10px] text-slate-400">•</span>
                                <span className="text-slate-500 font-mono text-[11px]">{inq.email}</span>
                                <span className="text-[10px] text-slate-400">•</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{new Date(inq.createdAt || inq.inquiry_date).toLocaleDateString()}</span>
                                <span className="text-[10px] text-slate-400">•</span>
                                <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  inq.status === 'pending'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                }`}>
                                  {inq.status}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 line-clamp-2 italic">
                                "{inq.message || 'No written message. Interested in plot reservation.'}"
                              </p>
                              {inq.deceased_name && (
                                <div className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md w-fit">
                                  <UserIcon className="w-3 h-3 text-slate-400" />
                                  <span>Deceased: {inq.deceased_name}</span>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => navigate('/admin/inquiries')}
                              className="self-start md:self-auto bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] py-1.5 px-3.5 rounded-lg shadow-sm transition-all cursor-pointer active:scale-95"
                            >
                              Open & Reply
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'activity' && (
                  <motion.div
                    key="tab-activity"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Live System Events</h4>
                        <p className="text-[10px] text-slate-400">Activity stream representing secure platform auditing</p>
                      </div>
                      <button
                        onClick={() => navigate('/admin/audit')}
                        className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <span>Full Security Log</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                      {stats?.recentActivity?.slice(0, 6).map((log: ActivityLog) => (
                        <div key={log.id} className="flex gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 shadow-inner">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-900">
                              <span className="font-bold text-emerald-700">{log.action}</span> - {log.description}
                            </p>
                            <div className="flex gap-3 mt-1.5 text-xs text-slate-500 font-medium">
                              <span className="font-mono text-[10px]">{log.user_email || 'System'}</span>
                              <span>•</span>
                              <span>{log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}</span>
                              <span>•</span>
                              <span className="uppercase text-[9px] font-extrabold tracking-wider text-slate-400 bg-slate-200/55 px-1.5 py-0.5 rounded-md">{log.module}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* KPI Cards (Super Admin) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block mb-1">Total Mapped Plots</span>
                <span className="text-2xl font-heading italic font-bold text-slate-900">{stats?.totalPlots || 80}</span>
                <span className="text-[10px] text-emerald-700 font-semibold block mt-1">Sections A - D Active</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                <Grid className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block mb-1">Occupancy Rate</span>
                <span className="text-2xl font-heading italic font-bold text-amber-600">{stats?.occupancyRate || 0}%</span>
                <span className="text-[10px] text-slate-500 block mt-1">{stats?.occupiedPlots} Occupied / Reserved</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block mb-1">Total Collections</span>
                <span className="text-2xl font-heading italic font-bold text-emerald-700">₱{stats?.totalRevenue?.toLocaleString()}</span>
                <span className="text-[10px] text-slate-500 block mt-1">Logged Official Receipts</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block mb-1">Staff Access</span>
                <span className="text-2xl font-heading italic font-bold text-sky-600">12</span>
                <span className="text-[10px] text-slate-500 block mt-1">Active Admin / RCC Accounts</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Plot Status Pie Chart */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col">
              <h3 className="text-sm font-heading font-bold text-slate-900 shrink-0">Park Capacity Overview</h3>
              <div className="h-48 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={plotStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={5}
                      stroke="none"
                    >
                      {plotStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', color: '#0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                      itemStyle={{ fontWeight: 600 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 shrink-0">
                {plotStatusData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{d.name}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Trend Line Chart */}
            <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-heading font-bold text-slate-900">Revenue & Collection Projection (₱)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₱${val/1000}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', color: '#0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                      formatter={(value) => [`₱${Number(value).toLocaleString()}`, 'Revenue']}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={3} dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-heading font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>System Security & Audit Logs</span>
              </h3>
              <button
                onClick={() => navigate('/admin/audit')}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>View Full Audit Trail</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3 font-bold">Timestamp</th>
                    <th className="p-3 font-bold">Module</th>
                    <th className="p-3 font-bold">Action</th>
                    <th className="p-3 font-bold">User</th>
                    <th className="p-3 font-bold">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats?.recentActivity?.slice(0, 5).map((log: ActivityLog) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono text-[10px] text-slate-400">{log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}</td>
                      <td className="p-3 font-bold text-emerald-700">
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[9px] uppercase tracking-wider">{log.module}</span>
                      </td>
                      <td className="p-3 font-bold text-slate-900">{log.action}</td>
                      <td className="p-3 text-slate-600 flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600 uppercase">
                          {log.user_email?.substring(0, 2) || 'SY'}
                        </div>
                        {log.user_email || 'System'}
                      </td>
                      <td className="p-3 text-slate-500 truncate max-w-[200px]">{log.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
