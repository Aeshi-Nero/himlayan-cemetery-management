import React from 'react';
import { Settings, Save } from 'lucide-react';
import type { ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">System Configuration</span>
        <h1 className="text-2xl font-heading italic font-bold text-slate-900 mt-0.5">Administrative Settings</h1>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6 text-xs text-slate-900">
        <div>
          <label className="block text-slate-600 font-semibold mb-1">Cemetery Name</label>
          <input
            type="text"
            defaultValue="Himlayan Memorial Park"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div>
          <label className="block text-slate-600 font-semibold mb-1">Administration Office Contact</label>
          <input
            type="text"
            defaultValue="+63 2 8922 4500"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div>
          <label className="block text-slate-600 font-semibold mb-1">Visiting Hours Policy</label>
          <input
            type="text"
            defaultValue="Monday to Sunday: 6:00 AM - 6:00 PM"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 cursor-pointer shadow-lg transition-colors">
          <Save className="w-4 h-4" />
          <span>Save System Settings</span>
        </button>
      </div>
    </div>
  );
}

SettingsPage.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
