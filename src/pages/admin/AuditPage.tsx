import React, { useEffect, useState } from 'react';
import { ShieldAlert, Activity } from 'lucide-react';
import { apiClient } from '../../api/client';
import { ActivityLog } from '../../types';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await apiClient.get('/audit-logs');
        if (res.data?.success) setLogs(res.data.data);
      } catch (err) {
        console.error('Error fetching audit logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Security Audit</span>
        <h1 className="text-2xl font-heading italic font-bold text-slate-900 mt-0.5">System Audit Trail Logs</h1>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading audit logs...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Module</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono text-slate-500">{l.createdAt ? new Date(l.createdAt).toLocaleString() : ''}</td>
                    <td className="p-4 font-bold text-emerald-700">{l.module}</td>
                    <td className="p-4 font-bold text-slate-900">{l.action}</td>
                    <td className="p-4 text-slate-600">{l.user_email || 'System'}</td>
                    <td className="p-4 text-slate-500">{l.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
