import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Edit, Layers, MapPin, Package, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { ColumbaryNiche, NicheStatus } from '@/types';
import AdminLayout from '@/Layouts/AdminLayout';

type NicheWithContracts = ColumbaryNiche & { contracts_count?: number };

const statusStyles: Record<NicheStatus, string> = {
  available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  reserved: 'bg-amber-50 text-amber-700 border-amber-200',
  occupied: 'bg-rose-50 text-rose-700 border-rose-200',
};

const tileStyles: Record<NicheStatus, string> = {
  available: 'border-emerald-300 bg-emerald-50/60 hover:bg-emerald-50',
  reserved: 'border-amber-300 bg-amber-50/60 hover:bg-amber-50',
  occupied: 'border-rose-300 bg-rose-50/60 hover:bg-rose-50',
};

const statusDot: Record<NicheStatus, string> = {
  available: 'bg-emerald-500',
  reserved: 'bg-amber-500',
  occupied: 'bg-rose-500',
};

export default function ColumbaryNichesPage() {
  const [niches, setNiches] = useState<NicheWithContracts[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNiche, setEditingNiche] = useState<NicheWithContracts | null>(null);
  const [deletingNicheId, setDeletingNicheId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const toastTimer = useRef<number | null>(null);
  const [form, setForm] = useState({
    niche_number: '',
    section: '',
    row: '',
    tier: '',
    status: 'available' as NicheStatus,
    price: '',
    map_x: '',
    map_y: '',
    notes: '',
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3500);
  };

  const fetchNiches = async () => {
    setLoading(true);
    try {
      const res = await window.axios.get('/api/columbary-niches');
      if (res.data?.success) setNiches(res.data.data);
    } catch (err) {
      console.error('Error fetching columbary niches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNiches();
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const resetForm = () => {
    setForm({
      niche_number: '',
      section: '',
      row: '',
      tier: '',
      status: 'available',
      price: '',
      map_x: '',
      map_y: '',
      notes: '',
    });
  };

  const openAddModal = () => {
    setEditingNiche(null);
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (n: NicheWithContracts) => {
    setEditingNiche(n);
    setForm({
      niche_number: n.niche_number,
      section: n.section || '',
      row: n.row || '',
      tier: n.tier || '',
      status: n.status,
      price: String(n.price),
      map_x: n.map_x !== undefined ? String(n.map_x) : '',
      map_y: n.map_y !== undefined ? String(n.map_y) : '',
      notes: n.notes || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        niche_number: form.niche_number,
        section: form.section || null,
        row: form.row || null,
        tier: form.tier || null,
        status: form.status,
        price: parseFloat(form.price),
        map_x: form.map_x ? parseFloat(form.map_x) : null,
        map_y: form.map_y ? parseFloat(form.map_y) : null,
        notes: form.notes || null,
      };

      if (editingNiche) {
        const res = await window.axios.put(`/api/columbary-niches/${editingNiche.id}`, payload);
        if (res.data?.success) {
          setModalOpen(false);
          fetchNiches();
          showToast('success', 'Columbary niche updated successfully');
        }
      } else {
        const res = await window.axios.post('/api/columbary-niches', payload);
        if (res.data?.success) {
          setModalOpen(false);
          fetchNiches();
          showToast('success', 'Columbary niche created successfully');
        }
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Something went wrong';
      showToast('error', msg);
    }
  };

  const handleDeleteNiche = async (id: string) => {
    try {
      const res = await window.axios.delete(`/api/columbary-niches/${id}`);
      if (res.data?.success) {
        setDeletingNicheId(null);
        fetchNiches();
        showToast('success', 'Columbary niche deleted successfully');
      }
    } catch (err: any) {
      showToast('error', err?.response?.data?.error || 'Failed to delete columbary niche');
    }
  };

  const grouped = niches.reduce<Record<string, NicheWithContracts[]>>((acc, n) => {
    const section = n.section || 'Unassigned';
    if (!acc[section]) acc[section] = [];
    acc[section].push(n);
    return acc;
  }, {});

  const totalNiches = niches.length;
  const availableCount = niches.filter((n) => n.status === 'available').length;
  const reservedCount = niches.filter((n) => n.status === 'reserved').length;
  const occupiedCount = niches.filter((n) => n.status === 'occupied').length;

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 border border-slate-200/80 rounded-3xl shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Columbary</span>
          <h1 className="text-2xl font-heading italic font-bold text-slate-900 mt-0.5">Columbary Niches</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Track niche inventory grouped by section for urn interment services.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Niche</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-700">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Niches</p>
            <p className="text-xl font-extrabold text-slate-900">{totalNiches}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Available</p>
            <p className="text-xl font-extrabold text-slate-900">{availableCount}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-700">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reserved</p>
            <p className="text-xl font-extrabold text-slate-900">{reservedCount}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Occupied</p>
            <p className="text-xl font-extrabold text-slate-900">{occupiedCount}</p>
          </div>
        </div>
      </div>

      {/* Grouped Niche Grids */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 text-xs">
          <div className="animate-spin w-5 h-5 border-2 border-emerald-700 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="font-semibold text-slate-400">Loading columbary niches...</p>
        </div>
      ) : niches.length === 0 ? (
        <div className="p-16 text-center text-slate-400 text-xs space-y-2 bg-white border border-slate-200/80 rounded-3xl shadow-xs">
          <Package className="w-10 h-10 text-slate-200 mx-auto" />
          <p className="font-bold text-slate-500">No columbary niches found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([section, items]) => (
            <div key={section} className="bg-white border border-slate-200/80 rounded-3xl shadow-xs p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Section</span>
                  <h2 className="font-heading italic font-bold text-slate-900 text-lg">{section}</h2>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
                  {items.length} {items.length === 1 ? 'Niche' : 'Niches'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
                {items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => openEditModal(n)}
                    className={`text-left rounded-2xl border-2 p-3.5 transition-all cursor-pointer active:scale-95 ${tileStyles[n.status]}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold text-slate-900">{n.niche_number}</span>
                      <span className={`w-2 h-2 rounded-full ${statusDot[n.status]}`} />
                    </div>
                    <div className="space-y-0.5">
                      {n.tier && (
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Tier {n.tier}</p>
                      )}
                      {n.row && (
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Row {n.row}</p>
                      )}
                    </div>
                    <p className="text-xs font-extrabold text-emerald-700 mt-2">₱{n.price?.toLocaleString()}</p>
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${statusStyles[n.status]}`}>
                      {n.status}
                    </span>
                    {n.contracts_count !== undefined && n.contracts_count > 0 && (
                      <span className="block mt-1.5 text-[9px] font-bold text-slate-400">
                        {n.contracts_count} {n.contracts_count === 1 ? 'contract' : 'contracts'}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 text-slate-900 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-lg font-heading italic font-bold text-slate-900">
                {editingNiche ? 'Edit Columbary Niche' : 'Add Columbary Niche'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Niche Number *</label>
                  <input
                    type="text"
                    required
                    value={form.niche_number}
                    onChange={(e) => setForm({ ...form, niche_number: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Section</label>
                  <input
                    type="text"
                    value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Row</label>
                  <input
                    type="text"
                    value={form.row}
                    onChange={(e) => setForm({ ...form, row: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Tier</label>
                  <input
                    type="text"
                    value={form.tier}
                    onChange={(e) => setForm({ ...form, tier: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Status *</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as NicheStatus })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 cursor-pointer focus:outline-none"
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="occupied">Occupied</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Price (₱) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Map X</label>
                  <input
                    type="number"
                    value={form.map_x}
                    onChange={(e) => setForm({ ...form, map_x: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Map Y</label>
                  <input
                    type="number"
                    value={form.map_y}
                    onChange={(e) => setForm({ ...form, map_y: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional remarks about this niche..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl shadow-sm"
                >
                  {editingNiche ? 'Save Changes' : 'Create Niche'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deletingNicheId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 space-y-4 text-slate-900 shadow-2xl relative text-center">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Columbary Niche?</h3>
              <p className="text-xs text-slate-500 font-medium">
                This will permanently remove this niche from the columbary. This cannot be undone.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setDeletingNicheId(null)}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => deletingNicheId && handleDeleteNiche(deletingNicheId)}
                className="w-1/2 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-xl text-xs transition-all cursor-pointer active:scale-95"
              >
                Delete Niche
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-[60] flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-2xl text-xs font-bold text-slate-800">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

ColumbaryNichesPage.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
