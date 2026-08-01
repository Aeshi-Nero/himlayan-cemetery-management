import React, { useEffect, useState } from 'react';
import { Grid, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Plot } from '@/types';
import AdminLayout from '@/Layouts/AdminLayout';

export default function PlotsPage() {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPlots = async () => {
    setLoading(true);
    try {
      const res = await window.axios.get('/api/plots', { params: { limit: 10000 } });
      if (res.data?.success) setPlots(res.data.data);
    } catch (err) {
      console.error('Error fetching plots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlots();
  }, []);

  const filtered = plots.filter((p) => p.plot_number.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Inventory</span>
          <h1 className="text-2xl font-heading italic font-bold text-slate-900 mt-0.5">Memorial Plots Inventory</h1>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plot number..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading plots...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Plot Number</th>
                  <th className="p-4">Section</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Capacity</th>
                  <th className="p-4">Occupants</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-900">#{p.plot_number}</td>
                    <td className="p-4 text-slate-600 font-semibold">Section {p.section}</td>
                    <td className="p-4 capitalize text-slate-600">{p.lot_type}</td>
                    <td className="p-4 text-slate-600">{p.capacity}</td>
                    <td className="p-4 text-slate-600">{p.current_occupants}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-900">₱{p.price?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

PlotsPage.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
