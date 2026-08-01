import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Edit, Layers, Package, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { PreNeedPlan, PlanType } from '@/types';
import AdminLayout from '@/Layouts/AdminLayout';

const typeStyles: Record<PlanType, string> = {
  burial: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  funeral: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  memorial: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function PreNeedPlansPage() {
  const [plans, setPlans] = useState<PreNeedPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PreNeedPlan | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const toastTimer = useRef<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    type: 'burial' as PlanType,
    price: '',
    image: '',
    is_active: true,
    description: '',
    features: '',
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3500);
  };

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await window.axios.get('/api/pre-need-plans');
      if (res.data?.success) setPlans(res.data.data);
    } catch (err) {
      console.error('Error fetching pre-need plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const openAddModal = () => {
    setEditingPlan(null);
    setForm({ name: '', type: 'burial', price: '', image: '', is_active: true, description: '', features: '' });
    setModalOpen(true);
  };

  const openEditModal = (p: PreNeedPlan) => {
    setEditingPlan(p);
    setForm({
      name: p.name,
      type: p.type,
      price: String(p.price),
      image: p.image || '',
      is_active: p.is_active,
      description: p.description || '',
      features: p.features?.join('\n') || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        type: form.type,
        price: parseFloat(form.price),
        image: form.image || null,
        is_active: form.is_active,
        description: form.description || null,
        features: form.features.split('\n').map((f) => f.trim()).filter(Boolean),
      };

      if (editingPlan) {
        const res = await window.axios.put(`/api/pre-need-plans/${editingPlan.id}`, payload);
        if (res.data?.success) {
          setModalOpen(false);
          fetchPlans();
          showToast('success', 'Pre-need plan updated successfully');
        }
      } else {
        const res = await window.axios.post('/api/pre-need-plans', payload);
        if (res.data?.success) {
          setModalOpen(false);
          fetchPlans();
          showToast('success', 'Pre-need plan created successfully');
        }
      }
    } catch (err: any) {
      showToast('error', err?.response?.data?.error || 'Something went wrong');
    }
  };

  const handleDeletePlan = async (id: string) => {
    try {
      const res = await window.axios.delete(`/api/pre-need-plans/${id}`);
      if (res.data?.success) {
        setDeletingPlanId(null);
        fetchPlans();
        showToast('success', 'Pre-need plan deleted successfully');
      }
    } catch (err: any) {
      showToast('error', err?.response?.data?.error || 'Failed to delete pre-need plan');
    }
  };

  const totalPlans = plans.length;
  const activeCount = plans.filter((p) => p.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 border border-slate-200/80 rounded-3xl shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Memorial Services</span>
          <h1 className="text-2xl font-heading italic font-bold text-slate-900 mt-0.5">Pre-Need Plans</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage burial, funeral, and memorial service packages for clients.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Plan</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-700">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Plans</p>
            <p className="text-2xl font-extrabold text-slate-900">{totalPlans}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Plans</p>
            <p className="text-2xl font-extrabold text-slate-900">{activeCount}</p>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 text-xs">
          <div className="animate-spin w-5 h-5 border-2 border-emerald-700 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="font-semibold text-slate-400">Loading pre-need plans...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="p-16 text-center text-slate-400 text-xs space-y-2 bg-white border border-slate-200/80 rounded-3xl shadow-xs">
          <Package className="w-10 h-10 text-slate-200 mx-auto" />
          <p className="font-bold text-slate-500">No pre-need plans found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {plans.map((p) => (
            <div key={p.id} className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden flex flex-col">
              {p.image ? (
                <img src={p.image} alt={p.name} className="w-full h-36 object-cover" />
              ) : (
                <div className="w-full h-36 bg-gradient-to-br from-emerald-50 to-slate-100 border-b border-slate-200/80 flex items-center justify-center">
                  <Package className="w-9 h-9 text-slate-300" />
                </div>
              )}

              <div className="p-5 space-y-3 flex-1 flex flex-col">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-heading italic font-bold text-slate-900 text-sm leading-tight">{p.name}</h3>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border shrink-0 ${typeStyles[p.type]}`}>
                    {p.type}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${p.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {p.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-sm font-extrabold text-emerald-700">₱{p.price?.toLocaleString()}</span>
                </div>

                {p.description && (
                  <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-3">{p.description}</p>
                )}

                {p.features && p.features.length > 0 && (
                  <ul className="space-y-1.5">
                    {p.features.map((f, i) => (
                      <li key={i} className="text-xs text-slate-600 font-semibold flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex gap-2 mt-auto pt-3 border-t border-slate-100">
                  <button
                    onClick={() => openEditModal(p)}
                    className="flex-1 bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-800 border border-slate-200 rounded-xl py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => setDeletingPlanId(p.id)}
                    className="flex-1 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 rounded-xl py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
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
                {editingPlan ? 'Edit Pre-Need Plan' : 'Add Pre-Need Plan'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as PlanType })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 cursor-pointer focus:outline-none"
                  >
                    <option value="burial">Burial</option>
                    <option value="funeral">Funeral</option>
                    <option value="memorial">Memorial</option>
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

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Image URL</label>
                <input
                  type="text"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="https://example.com/plan-image.jpg"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief overview of the package..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Features (one per line)</label>
                <textarea
                  rows={4}
                  value={form.features}
                  onChange={(e) => setForm({ ...form, features: e.target.value })}
                  placeholder={"Professional embalming\nHearse rental\nCremation services"}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-700">Active (available for new contracts)</span>
              </label>

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
                  {editingPlan ? 'Save Changes' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deletingPlanId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 space-y-4 text-slate-900 shadow-2xl relative text-center">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Pre-Need Plan?</h3>
              <p className="text-xs text-slate-500 font-medium">
                This will permanently remove this plan from the catalog. This cannot be undone.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setDeletingPlanId(null)}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => deletingPlanId && handleDeletePlan(deletingPlanId)}
                className="w-1/2 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-xl text-xs transition-all cursor-pointer active:scale-95"
              >
                Delete Plan
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

PreNeedPlansPage.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
