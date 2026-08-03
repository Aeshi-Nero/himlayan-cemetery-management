import React, { useEffect, useState } from 'react';
import { Users, Plus, ShieldCheck, X, Eye, Pencil, Trash2, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, UserRole } from '@/types';
import AdminLayout from '@/Layouts/AdminLayout';
import type { ReactNode } from 'react';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Form & modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState<UserRole>('engineer');
  const [department, setDepartment] = useState('Himlayan Admin');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await window.axios.get('/api/users');
        if (res.data?.success) setUsers(res.data.data);
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const loadDefaultDepartment = async () => {
    try {
      const res = await window.axios.get('/api/settings');
      if (res.data?.success && res.data.data?.default_department) {
        setDepartment(res.data.data.default_department);
      }
    } catch (err) {
      console.error('Error fetching default department:', err);
    }
  };

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
      const res = await window.axios.post('/api/users', {
        full_name: fullName,
        email: email,
        role: role,
        department: department,
        phone: phone,
        address: address,
        password: password,
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

  const openView = (u: User) => {
    setSelectedUser(u);
    setShowViewModal(true);
  };

  const openEdit = (u: User) => {
    setErrorMsg(null);
    setEditingId(u.id);
    setFullName(u.full_name);
    setEmail(u.email);
    setPhone(u.phone || '');
    setAddress(u.address || '');
    setRole(u.role);
    setDepartment(u.department || 'Himlayan Admin');
    setPassword('');
    setShowEditModal(true);
  };

  const openDelete = (u: User) => {
    setSelectedUser(u);
    setShowDeleteModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (!fullName.trim() || !email.trim() || !role) {
      setErrorMsg('All fields are required.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await window.axios.put(`/api/users/${editingId}`, {
        full_name: fullName,
        email: email,
        role: role,
        department: department,
        phone: phone,
        address: address,
        ...(password ? { password } : {}),
      });
      if (res.data?.success) {
        setUsers((prev) => prev.map((u) => (u.id === editingId ? res.data.data : u)));
        setShowEditModal(false);
        setEditingId(null);
      } else {
        setErrorMsg(res.data?.error || 'Failed to update user account');
      }
    } catch (err: any) {
      console.error('Error updating user:', err);
      setErrorMsg(err.response?.data?.error || 'An error occurred while updating user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setDeleting(true);
    setErrorMsg(null);
    try {
      const res = await window.axios.delete(`/api/users/${selectedUser.id}`);
      if (res.data?.success) {
        setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
        setShowDeleteModal(false);
        setSelectedUser(null);
      } else {
        setErrorMsg(res.data?.error || 'Failed to delete user account');
      }
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setErrorMsg(err.response?.data?.error || 'An error occurred while deleting user');
    } finally {
      setDeleting(false);
    }
  };

  const roleBadgeColor = (r: string) => {
    switch (r) {
      case 'super_admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'rcc':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
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
            setPassword('');
            setRole('engineer');
            setDepartment('Himlayan Admin');
            loadDefaultDepartment();
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
                  <th className="p-4 text-right">Actions</th>
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
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${roleBadgeColor(u.role)}`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">{u.department || 'Himlayan Admin'}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openView(u)}
                          title="View"
                          className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(u)}
                          title="Edit"
                          className="p-2 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDelete(u)}
                          title="Delete"
                          className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
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

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">Temporary Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters (default: Admin@123)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/25 focus:border-emerald-700 transition-all font-medium text-xs"
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

      {/* VIEW MODAL */}
      <AnimatePresence>
        {showViewModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowViewModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-md w-full relative z-10 font-body space-y-4"
            >
              <button
                onClick={() => setShowViewModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shadow-inner">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">User Account Details</h3>
                  <p className="text-[11px] text-slate-500">{selectedUser.email}</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Full Name</span>
                  <span className="font-bold text-slate-900">{selectedUser.full_name}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Email</span>
                  <span className="font-semibold text-slate-900 font-mono">{selectedUser.email}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Phone Number</span>
                  <span className="font-semibold text-slate-900">{selectedUser.phone || '—'}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Address</span>
                  <span className="font-semibold text-slate-900">{selectedUser.address || '—'}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Role</span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${roleBadgeColor(selectedUser.role)}`}>
                    {selectedUser.role.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Department</span>
                  <span className="font-semibold text-slate-900">{selectedUser.department || 'Himlayan Admin'}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Status</span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                    selectedUser.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {selectedUser.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowViewModal(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-all cursor-pointer active:scale-95"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-md w-full relative z-10 font-body space-y-4"
            >
              <button
                onClick={() => setShowEditModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-inner">
                  <Pencil className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Staff Account</h3>
                  <p className="text-[11px] text-slate-500">Update the details for this portal account</p>
                </div>
              </div>

              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-2.5 rounded-xl flex items-start gap-2">
                  <span className="font-bold">Error:</span> {errorMsg}
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/25 focus:border-emerald-700 transition-all font-medium text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/25 focus:border-emerald-700 transition-all font-medium text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">Phone Number</label>
                  <input
                    type="tel"
                    maxLength={11}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/25 focus:border-emerald-700 transition-all font-medium text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">Location Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/25 focus:border-emerald-700 transition-all font-medium text-xs"
                  />
                </div>

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
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/25 focus:border-emerald-700 transition-all font-medium text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">New Password (optional)</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep current password"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/25 focus:border-emerald-700 transition-all font-medium text-xs"
                  />
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-all cursor-pointer active:scale-95 text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center gap-2"
                  >
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRM MODAL */}
      <AnimatePresence>
        {showDeleteModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-sm w-full relative z-10 font-body space-y-4"
            >
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-2.5 rounded-xl flex items-start gap-2">
                  <span className="font-bold">Error:</span> {errorMsg}
                </div>
              )}

              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shadow-inner">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Delete User Account</h3>
                  <p className="text-[11px] text-slate-500">{selectedUser.email}</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-slate-900">{selectedUser.full_name}</span>?
                This will permanently remove this access account and cannot be undone.
              </p>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-all cursor-pointer active:scale-95 text-center"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

UsersPage.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
