import React, { useEffect, useState } from 'react';
import { Settings, Save } from 'lucide-react';
import type { ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function SettingsPage() {
  const [cemeteryName, setCemeteryName] = useState('Himlayan Memorial Park');
  const [officeContact, setOfficeContact] = useState('+63 2 8922 4500');
  const [visitingHours, setVisitingHours] = useState('Monday to Sunday: 6:00 AM - 6:00 PM');
  const [defaultDepartment, setDefaultDepartment] = useState('Himlayan Admin');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await window.axios.get('/api/settings');
        if (res.data?.success) {
          const s = res.data.data;
          setCemeteryName(s.cemetery_name ?? 'Himlayan Memorial Park');
          setOfficeContact(s.office_contact ?? '+63 2 8922 4500');
          setVisitingHours(s.visiting_hours ?? 'Monday to Sunday: 6:00 AM - 6:00 PM');
          setDefaultDepartment(s.default_department ?? 'Himlayan Admin');
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setErrorMsg(null);
    try {
      await window.axios.put('/api/settings', {
        cemetery_name: cemeteryName,
        office_contact: officeContact,
        visiting_hours: visitingHours,
        default_department: defaultDepartment,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setErrorMsg(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">System Configuration</span>
        <h1 className="text-2xl font-heading italic font-bold text-slate-900 mt-0.5">Administrative Settings</h1>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6 text-xs text-slate-900">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading settings...</div>
        ) : (
          <>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Cemetery Name</label>
              <input
                type="text"
                value={cemeteryName}
                onChange={(e) => setCemeteryName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Administration Office Contact</label>
              <input
                type="text"
                value={officeContact}
                onChange={(e) => setOfficeContact(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Visiting Hours Policy</label>
              <input
                type="text"
                value={visitingHours}
                onChange={(e) => setVisitingHours(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Default Department
                <span className="text-[10px] text-slate-400 font-normal ml-1">
                  (auto-fills the Department box when adding a staff account)
                </span>
              </label>
              <input
                type="text"
                value={defaultDepartment}
                onChange={(e) => setDefaultDepartment(e.target.value)}
                placeholder="e.g. Himlayan Admin"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-2.5 rounded-xl">
                <span className="font-bold">Error:</span> {errorMsg}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 cursor-pointer shadow-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save System Settings'}</span>
              </button>
              {saved && (
                <span className="text-emerald-600 font-semibold text-xs">Settings saved successfully.</span>
              )}
            </div>
          </>
        )}
      </form>
    </div>
  );
}

SettingsPage.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
