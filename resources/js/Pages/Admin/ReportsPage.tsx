import React, { useEffect, useState } from 'react';
import { BarChart3, Download, Printer, Filter, Calendar } from 'lucide-react';
import { DashboardStats } from '@/types';
import AdminLayout from '@/Layouts/AdminLayout';
import type { ReactNode } from 'react';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('occupancy');
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2026-12-31');
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await window.axios.get('/api/dashboard');
        if (res.data?.success) setStats(res.data.data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      }
    };
    fetchStats();
  }, []);

  const totalOccupied = stats ? stats.reservedPlots + stats.occupiedPlots : 25;
  const totalBurials = stats ? stats.completedBurials + stats.scheduledBurials : 2;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Executive Intelligence</span>
          <h1 className="text-2xl font-heading italic font-bold text-slate-900 mt-0.5">Cemetery Analytics & Reports</h1>
        </div>
        <button
          onClick={() => window.print()}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-full text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Print Official Report</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs text-slate-900">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Report Category</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="occupancy">Plot Occupancy & Inventory Summary</option>
              <option value="revenue">Financial Collections & Ledger</option>
              <option value="burials">Burial Services History</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Start Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">End Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>
      </div>

      {/* Report Summary Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xs space-y-6 text-slate-900">
        <div className="text-center border-b border-slate-200 pb-6">
          <h2 className="text-xl font-heading italic font-bold uppercase text-slate-900">
            HIMLAYAN MEMORIAL PARK
          </h2>
          <p className="text-xs text-slate-500 mt-1">Official Summary Report • Period: {dateFrom} to {dateTo}</p>
        </div>

        {reportType === 'occupancy' && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-emerald-700 text-sm">Plot Occupancy Breakdown</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-slate-500 block mb-1">Total Mapped Lots</span>
                <span className="text-2xl font-bold font-heading text-slate-900">{stats?.totalPlots ?? 80}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-slate-500 block mb-1">Available Lots</span>
                <span className="text-2xl font-bold font-heading text-emerald-700">{stats?.availablePlots ?? 55}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-slate-500 block mb-1">Occupied / Reserved</span>
                <span className="text-2xl font-bold font-heading text-amber-700">{totalOccupied}</span>
              </div>
            </div>
          </div>
        )}

        {reportType === 'revenue' && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-emerald-700 text-sm">Collections Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-slate-500 block mb-1">Total Collections Received</span>
                <span className="text-2xl font-bold font-heading text-emerald-700">
                  ₱{Number(stats?.totalRevenue ?? 25000).toLocaleString()}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-slate-500 block mb-1">Total Outstanding Balances</span>
                <span className="text-2xl font-bold font-heading text-amber-700">₱{Number(stats?.totalRevenue ?? 25000).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {reportType === 'burials' && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-emerald-700 text-sm">Burial Activity Log</h3>
            <p className="text-slate-700">
              Total burial services conducted in reporting period: <span className="font-bold text-slate-900">{totalBurials}</span>. All recorded in Section A and Section B.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

ReportsPage.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
