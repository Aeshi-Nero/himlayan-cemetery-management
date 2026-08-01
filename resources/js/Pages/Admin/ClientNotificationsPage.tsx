import React, { useEffect, useRef, useState } from 'react';
import { Plus, Send, Users, Mail, X, AlertTriangle, CheckCircle2, Eye, Inbox } from 'lucide-react';
import type { ReactNode } from 'react';
import { Client, SentClientNotification } from '@/types';
import AdminLayout from '@/Layouts/AdminLayout';

const channelStyles: Record<string, string> = {
  database: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  mail: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  sms: 'bg-amber-50 text-amber-700 border-amber-200',
};

const statusStyles: Record<string, string> = {
  sent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function ClientNotificationsPage() {
  const [notifications, setNotifications] = useState<SentClientNotification[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [viewingNotification, setViewingNotification] = useState<SentClientNotification | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const toastTimer = useRef<number | null>(null);
  const [clientId, setClientId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [channel, setChannel] = useState<'database' | 'mail'>('database');
  const [sending, setSending] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3500);
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await window.axios.get('/api/client-notifications');
      if (res.data?.success) setNotifications(res.data.data);
    } catch (err) {
      console.error('Error fetching client notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await window.axios.get('/api/clients');
      if (res.data?.success) setClients(res.data.data);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchClients();
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const openComposeModal = () => {
    if (clients.length > 0) setClientId(clients[0].id);
    else setClientId('');
    setSubject('');
    setBody('');
    setChannel('database');
    setShowComposeModal(true);
  };

  const handleCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await window.axios.post('/api/client-notifications', {
        client_id: clientId,
        subject,
        body,
        channel,
      });
      if (res.data?.success) {
        const clientName = clients.find((c) => c.id === clientId)?.full_name || 'client';
        setShowComposeModal(false);
        fetchNotifications();
        showToast('success', `Notification sent to ${clientName}`);
      }
    } catch (err: any) {
      showToast('error', err?.response?.data?.error || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const totalSent = notifications.filter((n) => n.status === 'sent').length;
  const failedCount = notifications.filter((n) => n.status === 'failed').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 border border-slate-200/80 rounded-3xl shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Client Communications</span>
          <h1 className="text-2xl font-heading italic font-bold text-slate-900 mt-0.5">Client Notifications</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Compose and track database or mail notifications delivered to clients.
          </p>
        </div>

        <button
          onClick={openComposeModal}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Compose Notification</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-700 shrink-0">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Sent</p>
            <p className="text-2xl font-heading italic font-bold text-slate-900">{totalSent}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Failed Count</p>
            <p className="text-2xl font-heading italic font-bold text-slate-900">{failedCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500 text-xs">
            <div className="animate-spin w-5 h-5 border-2 border-emerald-700 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="font-semibold text-slate-400">Loading notification history...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs space-y-2">
            <Inbox className="w-10 h-10 text-slate-200 mx-auto" />
            <p className="font-bold text-slate-500">No client notifications sent yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                <tr>
                  <th className="p-4 pl-6">Client</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Channel</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Created At</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {notifications.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-bold text-[10px]">
                          {(n.client?.full_name || '?').charAt(0).toUpperCase()}
                        </span>
                        <span className="font-bold text-slate-950 text-sm">{n.client?.full_name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-slate-800 max-w-[240px] truncate">{n.subject}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-extrabold uppercase ${channelStyles[n.channel] || channelStyles.database}`}>
                        {n.channel}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-extrabold uppercase ${statusStyles[n.status] || statusStyles.failed}`}>
                        {n.status}
                      </span>
                    </td>
                    <td className="p-4 capitalize text-slate-700">{n.type}</td>
                    <td className="p-4 text-slate-500 font-mono">
                      {new Date(n.created_at || n.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-right pr-6 whitespace-nowrap">
                      <button
                        onClick={() => setViewingNotification(n)}
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-950 rounded-lg transition-colors cursor-pointer inline-flex border border-slate-150"
                        title="View Notification"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showComposeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 text-slate-900 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-lg font-heading italic font-bold text-slate-900">Compose Client Notification</h3>
              <button onClick={() => setShowComposeModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {clients.length === 0 ? (
              <div className="text-center space-y-2 py-6">
                <Users className="w-10 h-10 text-slate-200 mx-auto" />
                <p className="text-xs font-bold text-slate-600">No clients available</p>
                <p className="text-[11px] text-slate-400 font-medium">
                  Register clients before composing notifications.
                </p>
                <button
                  onClick={() => setShowComposeModal(false)}
                  className="mt-2 w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-center cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleCompose} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Recipient Client *</label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 cursor-pointer focus:outline-none"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.full_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Contract Renewal Reminder"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Message Body *</label>
                  <textarea
                    rows={4}
                    required
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write the full notification message..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Delivery Channel *</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as 'database' | 'mail')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 cursor-pointer focus:outline-none"
                  >
                    <option value="database">Database</option>
                    <option value="mail">Mail</option>
                  </select>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowComposeModal(false)}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-center cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="flex-1 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-100 text-white disabled:text-slate-400 font-bold py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sending ? 'Sending...' : 'Send Notification'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {viewingNotification && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 text-slate-900 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-lg font-heading italic font-bold text-slate-900">Notification Details</h3>
              <button onClick={() => setViewingNotification(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-slate-50/80 p-4 rounded-xl border border-slate-200 font-semibold text-slate-700">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Recipient</span>
                <span className="text-slate-950 font-bold">{viewingNotification.client?.full_name || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Channel</span>
                <span className={`px-2 py-0.5 rounded border text-[10px] font-extrabold uppercase ${channelStyles[viewingNotification.channel] || channelStyles.database}`}>
                  {viewingNotification.channel}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Status</span>
                <span className={`px-2 py-0.5 rounded border text-[10px] font-extrabold uppercase ${statusStyles[viewingNotification.status] || statusStyles.failed}`}>
                  {viewingNotification.status}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Date</span>
                <span className="font-mono text-slate-800">{new Date(viewingNotification.created_at || viewingNotification.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subject</span>
              <p className="text-sm font-bold text-slate-950 bg-slate-50 border border-slate-200 rounded-xl p-3">{viewingNotification.subject}</p>
            </div>

            <div className="space-y-2">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Message Body</span>
              <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-3 whitespace-pre-wrap">
                {viewingNotification.body || 'No body content.'}
              </p>
            </div>

            <button
              onClick={() => setViewingNotification(null)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-xs text-center cursor-pointer"
            >
              Close
            </button>
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

ClientNotificationsPage.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
