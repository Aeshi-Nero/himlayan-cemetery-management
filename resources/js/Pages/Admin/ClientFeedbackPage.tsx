import React, { useEffect, useRef, useState } from 'react';
import { Plus, Star, Trash2, MessageSquare, X, AlertTriangle, CheckCircle2, Inbox } from 'lucide-react';
import type { ReactNode } from 'react';
import { ClientFeedback, Contract } from '@/types';
import AdminLayout from '@/Layouts/AdminLayout';

export default function ClientFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<ClientFeedback[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingFeedbackId, setDeletingFeedbackId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const toastTimer = useRef<number | null>(null);
  const [contractId, setContractId] = useState('');
  const [clientId, setClientId] = useState('');
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [saving, setSaving] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3500);
  };

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await window.axios.get('/api/client-feedback');
      if (res.data?.success) setFeedbacks(res.data.data);
    } catch (err) {
      console.error('Error fetching client feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchContracts = async () => {
    try {
      const res = await window.axios.get('/api/contracts');
      if (res.data?.success) setContracts(res.data.data);
    } catch (err) {
      console.error('Error fetching contracts:', err);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
    fetchContracts();
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const openAddModal = () => {
    const released = contracts.filter((c) => c.status === 'released');
    if (released.length > 0) {
      setContractId(released[0].id);
      setClientId(released[0].client_id);
    } else {
      setContractId('');
      setClientId('');
    }
    setRating(5);
    setComments('');
    setShowAddModal(true);
  };

  const handleContractChange = (id: string) => {
    setContractId(id);
    const selected = contracts.find((c) => c.id === id);
    setClientId(selected?.client_id || '');
  };

  const handleAddFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await window.axios.post('/api/client-feedback', {
        contract_id: contractId,
        client_id: clientId,
        rating,
        comments: comments || null,
      });
      if (res.data?.success) {
        setShowAddModal(false);
        fetchFeedbacks();
        showToast('success', 'Feedback recorded successfully');
      }
    } catch (err: any) {
      showToast('error', err?.response?.data?.error || 'Failed to record feedback');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    try {
      const res = await window.axios.delete(`/api/client-feedback/${id}`);
      if (res.data?.success) {
        setDeletingFeedbackId(null);
        fetchFeedbacks();
        showToast('success', 'Feedback deleted successfully');
      }
    } catch (err: any) {
      showToast('error', err?.response?.data?.error || 'Failed to delete feedback');
    }
  };

  const releasedContracts = contracts.filter((c) => c.status === 'released');
  const totalFeedbacks = feedbacks.length;
  const averageRating = totalFeedbacks > 0
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks).toFixed(1)
    : '0.0';

  const renderStars = (value: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-4 h-4 ${n <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-100'}`}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 border border-slate-200/80 rounded-3xl shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Client Experience</span>
          <h1 className="text-2xl font-heading italic font-bold text-slate-900 mt-0.5">Client Feedback</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Review client satisfaction ratings and comments across released contracts.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Record Feedback</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-700 shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Feedback Entries</p>
            <p className="text-2xl font-heading italic font-bold text-slate-900">{totalFeedbacks}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Average Rating</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-heading italic font-bold text-slate-900">{averageRating}</p>
              <span className="text-[10px] font-extrabold uppercase text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                / 5.0
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500 text-xs">
            <div className="animate-spin w-5 h-5 border-2 border-emerald-700 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="font-semibold text-slate-400">Loading feedback records...</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs space-y-2">
            <Inbox className="w-10 h-10 text-slate-200 mx-auto" />
            <p className="font-bold text-slate-500">No client feedback recorded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {feedbacks.map((fb) => (
              <div key={fb.id} className="p-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="w-9 h-9 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 font-bold text-sm">
                      {(fb.client?.full_name || '?').charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-950">{fb.client?.full_name || 'N/A'}</p>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        {fb.contract?.contract_number || 'No contract'}{fb.contract?.plot ? ` — Plot ${fb.contract.plot.plot_number}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {renderStars(fb.rating)}
                    <span className="text-[10px] font-bold text-slate-400">{fb.rating}.0</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-extrabold uppercase">
                      {fb.status}
                    </span>
                  </div>

                  {fb.comments && (
                    <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-3">
                      "{fb.comments}"
                    </p>
                  )}

                  <p className="text-[10px] text-slate-400 font-semibold">
                    Submitted {new Date(fb.submitted_at || fb.created_at || fb.createdAt).toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={() => setDeletingFeedbackId(fb.id)}
                  className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-lg transition-colors cursor-pointer inline-flex border border-slate-150 self-start"
                  title="Delete Feedback"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 text-slate-900 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-lg font-heading italic font-bold text-slate-900">Record Client Feedback</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {releasedContracts.length === 0 ? (
              <div className="text-center space-y-2 py-6">
                <MessageSquare className="w-10 h-10 text-slate-200 mx-auto" />
                <p className="text-xs font-bold text-slate-600">No released contracts available</p>
                <p className="text-[11px] text-slate-400 font-medium">
                  Feedback can only be recorded against released contracts. Release an approved contract first.
                </p>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="mt-2 w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-center cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddFeedback} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Released Contract *</label>
                  <select
                    value={contractId}
                    onChange={(e) => handleContractChange(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 cursor-pointer focus:outline-none"
                  >
                    {releasedContracts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.contract_number} — {c.client?.full_name || 'N/A'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Rating *</label>
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        className="cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${n <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-100'}`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-[10px] font-bold text-slate-400 uppercase">{rating}.0 / 5.0</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Comments</label>
                  <textarea
                    rows={3}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="e.g. Very satisfied with the memorial services provided..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-center cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-100 text-white disabled:text-slate-400 font-bold py-2.5 rounded-xl shadow-sm text-center"
                  >
                    {saving ? 'Saving...' : 'Save Feedback'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {deletingFeedbackId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 space-y-4 text-slate-900 shadow-2xl relative text-center">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Feedback Record?</h3>
              <p className="text-xs text-slate-500 font-medium">
                This feedback entry will be permanently removed. This cannot be undone.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setDeletingFeedbackId(null)}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => deletingFeedbackId && handleDeleteFeedback(deletingFeedbackId)}
                className="w-1/2 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-xl text-xs transition-all active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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

ClientFeedbackPage.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
