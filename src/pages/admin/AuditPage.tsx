import React, { useEffect, useState, useMemo } from 'react';
import { ShieldAlert, Activity, RefreshCw, Search, UserCheck, Wrench, Shield, Filter, LogIn, AlertTriangle } from 'lucide-react';
import { apiClient } from '../../api/client';
import { ActivityLog } from '../../types';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string>('ALL');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/audit-logs');
      if (res.data?.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Compute Login Stats
  const stats = useMemo(() => {
    const totalLogs = logs.length;
    const logins = logs.filter((l) => l.action === 'USER_LOGIN');
    const rccLogins = logins.filter((l) => l.user_email?.includes('rcc@')).length;
    const engineerLogins = logins.filter((l) => l.user_email?.includes('engineer@')).length;
    const adminLogins = logins.filter((l) => l.user_email?.includes('admin@')).length;
    const failedLogins = logs.filter((l) => l.action === 'FAILED_LOGIN').length;

    return {
      totalLogs,
      totalLogins: logins.length,
      rccLogins,
      engineerLogins,
      adminLogins,
      failedLogins,
    };
  }, [logs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      // Account filter
      if (selectedAccount !== 'ALL') {
        if (selectedAccount === 'rcc' && !l.user_email?.includes('rcc@')) return false;
        if (selectedAccount === 'engineer' && !l.user_email?.includes('engineer@')) return false;
        if (selectedAccount === 'admin' && !l.user_email?.includes('admin@')) return false;
        if (selectedAccount === 'staff' && !l.user_email?.includes('staff@')) return false;
      }

      // Action filter
      if (actionFilter === 'LOGIN' && l.action !== 'USER_LOGIN') return false;
      if (actionFilter === 'FAILED' && l.action !== 'FAILED_LOGIN') return false;
      if (actionFilter === 'SYSTEM' && l.action === 'USER_LOGIN') return false;

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchEmail = l.user_email?.toLowerCase().includes(q);
        const matchAction = l.action.toLowerCase().includes(q);
        const matchModule = l.module.toLowerCase().includes(q);
        const matchDesc = l.description.toLowerCase().includes(q);
        if (!matchEmail && !matchAction && !matchModule && !matchDesc) return false;
      }

      return true;
    });
  }, [logs, selectedAccount, actionFilter, search]);

  const getRoleBadge = (email?: string) => {
    if (!email) return <span className="text-slate-400 font-medium">System</span>;
    if (email.includes('rcc@')) {
      return (
        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
          <UserCheck className="w-3 h-3 text-emerald-600" /> RCC Clerk ({email})
        </span>
      );
    }
    if (email.includes('engineer@')) {
      return (
        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
          <Wrench className="w-3 h-3 text-blue-600" /> Engineer ({email})
        </span>
      );
    }
    if (email.includes('admin@')) {
      return (
        <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
          <Shield className="w-3 h-3 text-purple-600" /> Super Admin ({email})
        </span>
      );
    }
    return <span className="text-slate-700 font-semibold">{email}</span>;
  };

  const getActionBadge = (action: string) => {
    if (action === 'USER_LOGIN') {
      return (
        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold">
          <LogIn className="w-3 h-3 text-emerald-700" /> USER LOGIN
        </span>
      );
    }
    if (action === 'FAILED_LOGIN') {
      return (
        <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-900 border border-rose-300 px-2 py-0.5 rounded text-[10px] font-bold">
          <AlertTriangle className="w-3 h-3 text-rose-600" /> FAILED LOGIN
        </span>
      );
    }
    return (
      <span className="bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold">
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Security & Authentication Audit</span>
          <h1 className="text-2xl font-heading italic font-bold text-slate-900 mt-0.5">System Audit Trail Logs</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time activity and access monitoring for RCC Clerk, Cemetery Engineer, and Super Admin user logins.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Login Monitoring Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">RCC Clerk Logins</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.rccLogins}</div>
          <span className="text-[11px] text-emerald-700 font-medium">rcc@himlayan.gov.ph</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Engineer Logins</span>
            <Wrench className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.engineerLogins}</div>
          <span className="text-[11px] text-blue-700 font-medium">engineer@himlayan.gov.ph</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Super Admin Logins</span>
            <Shield className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.adminLogins}</div>
          <span className="text-[11px] text-purple-700 font-medium">admin@himlayan.gov.ph</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Audit Events</span>
            <Activity className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.totalLogs}</div>
          <span className="text-[11px] text-slate-500 font-medium">Recorded Session Logs</span>
        </div>
      </div>

      {/* Search & Filtering Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email, action, module or description..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-slate-500 text-xs shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold">Account:</span>
          </div>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer font-medium"
          >
            <option value="ALL">All Accounts</option>
            <option value="rcc">RCC Clerk (rcc@himlayan.gov.ph)</option>
            <option value="engineer">Engineer (engineer@himlayan.gov.ph)</option>
            <option value="admin">Super Admin (admin@himlayan.gov.ph)</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer font-medium"
          >
            <option value="ALL">All Actions</option>
            <option value="LOGIN">User Logins Only</option>
            <option value="FAILED">Failed Logins</option>
            <option value="SYSTEM">System & Operations</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading audit logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No audit logs found matching the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Module</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">User Account</th>
                  <th className="p-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono text-slate-500 whitespace-nowrap">
                      {l.createdAt ? new Date(l.createdAt).toLocaleString() : 'N/A'}
                    </td>
                    <td className="p-4 font-bold text-emerald-800">{l.module}</td>
                    <td className="p-4">{getActionBadge(l.action)}</td>
                    <td className="p-4 whitespace-nowrap">{getRoleBadge(l.user_email)}</td>
                    <td className="p-4 text-slate-700 font-medium leading-relaxed">{l.description}</td>
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
