import React, { useEffect, useState } from 'react';
import { Users, Plus, ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiClient } from '../../api/client';
import { User, UserRole } from '../../types';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Form & modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState<UserRole>('engineer');
  const [department, setDepartment] = useState('Himlayan Admin');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await apiClient.get('/users');
        if (res.data?.success) setUsers(res.data.data);
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !role) {
      setErrorMsg('All fields are required.');
      return;
    }
    if (phone.length !== 11) {
      setErrorMsg('Phone number must be exactly 11 digits (numbers only).');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.post('/users', {
        full_name: fullName,
        email: email,
        role: role,
        department: department,
        phone: phone,
        address: address,
      });
      if (res.data?.success) {
        setUsers((prev) => [res.data.data, ...prev]);
        setShowAddModal(false);
      } else {
        setErrorMsg(res.data?.error || 'Failed to create user account');
      }
    } catch (err: any) {
      console.error('Error creating user:', err);
      setErrorMsg(err.response?.data?.error || 'An error occurred while creating user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Security & RBAC</span>
          <h1 className="text-2xl font-heading italic font-bold text-slate-900 mt-0.5">Staff User Accounts</h1>
        </div>
        <button
          onClick={() => {
            setErrorMsg(null);
            setEmail('');
            setFullName('');
            setPhone('');
            setAddress('');
            setRole('engineer');
            setDepartment('Himlayan Admin');
            setShowAddModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Account</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading user accounts...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Full Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Phone Number</th>
                  <th className="p-4">Location Address</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Department</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{u.full_name}</td>
                    <td className="p-4 text-slate-600 font-mono">{u.email}</td>
                    <td className="p-4 text-slate-600 font-medium">{u.phone || '—'}</td>
                    <td className="p-4 text-slate-600 font-medium">{u.address || '—'}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">{u.department || 'Himlayan Admin'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-md w-full relative z-10 font-body space-y-4"
            >
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-inner">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Staff Account</h3>
                  <p className="text-[11px] text-slate-500">Create a new access account for portal personnel</p>
                </div>
              </div>

              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-2.5 rounded-xl flex items-start gap-2 animate-pulse">
                  <span className="font-bold">Error:</span> {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/25 focus:border-emerald-700 transition-all font-medium text-xs"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. johndoe@himlayan.gov.ph"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/25 focus:border-emerald-700 transition-all font-medium text-xs"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">Phone Number</label>
                  <input
                    type="tel"
                    required
                    maxLength={11}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    placeholder="e.g. 09171234567 (11 digits)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/25 focus:border-emerald-700 transition-all font-medium text-xs font-mono"
                  />
                </div>

                {/* Location Address */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">Location Address</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 123 Main Street, Manila"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/25 focus:border-emerald-700 transition-all font-medium text-xs"
                  />
                </div>

                {/* Role & Department */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-700">Access Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/25 focus:border-emerald-700 transition-all font-medium text-xs cursor-pointer"
                    >
                      <option value="engineer">Engineer</option>
                      <option value="rcc">RCC Clerk</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-700">Department</label>
                    <input
                      type="text"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Himlayan Admin"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/25 focus:border-emerald-700 transition-all font-medium text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-all cursor-pointer active:scale-95 text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center gap-2"
                  >
                    {submitting ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
