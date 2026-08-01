import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Printer,
  Eye,
  Edit,
  Trash2,
  Calculator,
  FileText,
  AlertTriangle,
  X,
  CheckCircle2,
  ScrollText,
  User,
  MapPin
} from 'lucide-react';
import type { ReactNode } from 'react';
import { BurialPermit, Contract } from '@/types';
import AdminLayout from '@/Layouts/AdminLayout';

export default function BurialPermitsPage() {
  const [permits, setPermits] = useState<BurialPermit[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPermit, setEditingPermit] = useState<BurialPermit | null>(null);
  const [deletingPermitId, setDeletingPermitId] = useState<string | null>(null);
  const [viewingPermit, setViewingPermit] = useState<BurialPermit | null>(null);

  const [contractId, setContractId] = useState('');
  const [deceasedName, setDeceasedName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [dateOfDeath, setDateOfDeath] = useState('');
  const [deathCertificateNumber, setDeathCertificateNumber] = useState('');
  const [burialPermitFee, setBurialPermitFee] = useState('');
  const [notes, setNotes] = useState('');

  const [rentalContractType, setRentalContractType] = useState('new');
  const [ordinancePeriod, setOrdinancePeriod] = useState('2013_present');
  const [rentalLotType, setRentalLotType] = useState('individual');
  const [rentalArea, setRentalArea] = useState('');
  const [rentalComputing, setRentalComputing] = useState(false);
  const [rentalBreakdown, setRentalBreakdown] = useState<string | null>(null);

  const [editDeceasedName, setEditDeceasedName] = useState('');
  const [editDateOfBirth, setEditDateOfBirth] = useState('');
  const [editDateOfDeath, setEditDateOfDeath] = useState('');
  const [editDeathCertificateNumber, setEditDeathCertificateNumber] = useState('');
  const [editBurialPermitFee, setEditBurialPermitFee] = useState('');
  const [editStatus, setEditStatus] = useState<'issued' | 'used' | 'cancelled'>('issued');
  const [editNotes, setEditNotes] = useState('');

  const PERMIT_ELIGIBLE = ['draft', 'permit_issued', 'rental_computed', 'paid', 'pending_approval', 'approved'];
  const activeContracts = contracts.filter((c) => PERMIT_ELIGIBLE.includes(c.status));

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchPermits = async () => {
    setLoading(true);
    try {
      const res = await window.axios.get('/api/burial-permits');
      if (res.data?.success) {
        setPermits(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching burial permits:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchContracts = async () => {
    try {
      const res = await window.axios.get('/api/contracts');
      if (res.data?.success) {
        setContracts(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching contracts:', err);
    }
  };

  useEffect(() => {
    fetchPermits();
    fetchContracts();
  }, []);

  const openAddModal = () => {
    setContractId(activeContracts[0]?.id || '');
    setDeceasedName('');
    setDateOfBirth('');
    setDateOfDeath('');
    setDeathCertificateNumber('');
    setBurialPermitFee('');
    setNotes('');
    setRentalContractType('new');
    setOrdinancePeriod('2013_present');
    setRentalLotType('individual');
    setRentalArea('');
    setRentalBreakdown(null);
    setShowAddModal(true);
  };

  const handleComputeRental = async () => {
    setRentalComputing(true);
    setRentalBreakdown(null);
    try {
      const res = await window.axios.post('/api/burial-permits/compute-rental', {
        contract_type: rentalContractType,
        ordinance_period: ordinancePeriod,
        lot_type: rentalLotType,
        area: rentalArea ? parseFloat(rentalArea) : null,
      });

      if (res.data?.success) {
        setBurialPermitFee(String(res.data.data.fee));
        setRentalBreakdown(res.data.data.breakdown);
      }
    } catch (err) {
      console.error('Error computing rental:', err);
    } finally {
      setRentalComputing(false);
    }
  };

  const handleAddPermit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await window.axios.post('/api/burial-permits', {
        contract_id: contractId,
        deceased_name: deceasedName,
        date_of_birth: dateOfBirth || null,
        date_of_death: dateOfDeath,
        death_certificate_number: deathCertificateNumber,
        burial_permit_fee: parseFloat(burialPermitFee),
        notes,
      });

      if (res.data?.success) {
        setShowAddModal(false);
        setToast('Burial permit issued successfully');
        fetchPermits();
      }
    } catch (err) {
      console.error('Error issuing burial permit:', err);
    }
  };

  const handleOpenEdit = (p: BurialPermit) => {
    setEditingPermit(p);
    setEditDeceasedName(p.deceased_name);
    setEditDateOfBirth(p.date_of_birth || '');
    setEditDateOfDeath(p.date_of_death);
    setEditDeathCertificateNumber(p.death_certificate_number || '');
    setEditBurialPermitFee(String(p.burial_permit_fee));
    setEditStatus(p.status);
    setEditNotes(p.notes || '');
  };

  const handleEditPermitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPermit) return;
    try {
      const res = await window.axios.put(`/api/burial-permits/${editingPermit.id}`, {
        deceased_name: editDeceasedName,
        date_of_birth: editDateOfBirth || null,
        date_of_death: editDateOfDeath,
        death_certificate_number: editDeathCertificateNumber,
        burial_permit_fee: parseFloat(editBurialPermitFee),
        status: editStatus,
        notes: editNotes,
      });

      if (res.data?.success) {
        setEditingPermit(null);
        setToast('Burial permit updated successfully');
        fetchPermits();
      }
    } catch (err) {
      console.error('Error updating burial permit:', err);
    }
  };

  const handleDeletePermit = async (id: string) => {
    try {
      const res = await window.axios.delete(`/api/burial-permits/${id}`);
      if (res.data?.success) {
        setDeletingPermitId(null);
        setToast('Burial permit deleted successfully');
        fetchPermits();
      }
    } catch (err) {
      console.error('Error deleting burial permit:', err);
    }
  };

  const issuedByName = (p: BurialPermit) => {
    const issuedBy = p.issued_by as unknown;
    if (p.issued_by_user?.full_name) return p.issued_by_user.full_name;
    if (typeof issuedBy === 'object' && issuedBy !== null) {
      const u = issuedBy as { full_name?: string; name?: string };
      return u.full_name || u.name || 'N/A';
    }
    return typeof issuedBy === 'string' && issuedBy ? issuedBy : 'N/A';
  };

  const totalIssued = permits.length;
  const totalUsed = permits.filter((p) => p.status === 'used').length;
  const totalCancelled = permits.filter((p) => p.status === 'cancelled').length;

  const filtered = permits.filter((p) => {
    const clientName = p.contract?.client?.full_name || '';
    const matchesSearch =
      (p.permit_number || '').toLowerCase().includes(search.toLowerCase()) ||
      clientName.toLowerCase().includes(search.toLowerCase()) ||
      p.deceased_name.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-5 right-5 z-[70] bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2.5 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 border border-slate-200/80 rounded-3xl shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Interment Clearance</span>
          <h1 className="text-2xl font-heading italic font-bold text-slate-900 mt-0.5">Burial Permits</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Issue official burial permits (AF-58), compute lot rental, and manage permit lifecycle.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Issue Permit</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            <ScrollText className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">Total Issued</span>
            <span className="text-2xl font-heading italic font-bold text-slate-900">{totalIssued}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">Used</span>
            <span className="text-2xl font-heading italic font-bold text-slate-900">{totalUsed}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
            <X className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">Cancelled</span>
            <span className="text-2xl font-heading italic font-bold text-slate-900">{totalCancelled}</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search permit #, client, or deceased..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="issued">Issued</option>
              <option value="used">Used</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500 text-xs">
            <div className="animate-spin w-5 h-5 border-2 border-emerald-700 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="font-semibold text-slate-400">Loading burial permits...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs space-y-2">
            <FileText className="w-10 h-10 text-slate-200 mx-auto" />
            <p className="font-bold text-slate-500">No burial permits match the active criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                <tr>
                  <th className="p-4 pl-6">Permit No</th>
                  <th className="p-4">Deceased</th>
                  <th className="p-4">Date of Death</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Plot</th>
                  <th className="p-4">Fee</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Issued By</th>
                  <th className="p-4">Issued At</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6">
                      <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-100 text-xs font-mono font-bold">
                        {p.permit_number || 'N/A'}
                      </span>
                    </td>

                    <td className="p-4 font-bold text-slate-900 text-sm">
                      {p.deceased_name}
                      {p.notes && (
                        <span className="block text-[10px] text-slate-400 font-medium italic mt-0.5 truncate max-w-xs">
                          "{p.notes}"
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-slate-500 font-mono">
                      {p.date_of_death ? new Date(p.date_of_death).toLocaleDateString() : 'N/A'}
                    </td>

                    <td className="p-4 font-bold text-slate-800">
                      {p.contract?.client?.full_name || 'N/A'}
                    </td>

                    <td className="p-4 text-emerald-700 font-bold">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{p.contract?.plot?.plot_number || 'N/A'}</span>
                      </div>
                    </td>

                    <td className="p-4 font-extrabold text-slate-900 text-sm">
                      ₱{p.burial_permit_fee?.toLocaleString()}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                          p.status === 'issued'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.status === 'used'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    <td className="p-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{issuedByName(p)}</span>
                      </div>
                    </td>

                    <td className="p-4 text-slate-500 font-mono">
                      {p.issued_at ? new Date(p.issued_at).toLocaleDateString() : 'N/A'}
                    </td>

                    <td className="p-4 text-right pr-6 space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setViewingPermit(p)}
                        className="p-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 rounded-lg transition-colors cursor-pointer inline-flex border border-slate-150"
                        title="View & Print AF-58"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-800 rounded-lg transition-colors cursor-pointer inline-flex border border-slate-150"
                        title="Edit Permit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeletingPermitId(p.id)}
                        className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-lg transition-colors cursor-pointer inline-flex border border-slate-150"
                        title="Delete Permit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-4 text-slate-900 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-lg font-heading italic font-bold text-slate-900">Issue New Burial Permit</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddPermit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Active Contract *</label>
                <select
                  value={contractId}
                  onChange={(e) => setContractId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 cursor-pointer focus:outline-none"
                >
                  {activeContracts.length > 0 ? (
                    activeContracts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.client?.full_name || 'N/A'} — Plot {c.plot?.plot_number || 'N/A'}
                      </option>
                    ))
                  ) : (
                    <option value="">No active contracts available</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Deceased Name *</label>
                <input
                  type="text"
                  required
                  value={deceasedName}
                  onChange={(e) => setDeceasedName(e.target.value)}
                  placeholder="e.g. Lourdes Santos"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Date of Death *</label>
                  <input
                    type="date"
                    required
                    value={dateOfDeath}
                    onChange={(e) => setDateOfDeath(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Death Certificate No.</label>
                  <input
                    type="text"
                    value={deathCertificateNumber}
                    onChange={(e) => setDeathCertificateNumber(e.target.value)}
                    placeholder="e.g. DC-2026-0012"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Permit Fee (₱) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={burialPermitFee}
                    onChange={(e) => setBurialPermitFee(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Chapel rites standard, reserved plot..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                    Compute Rental Fee
                  </span>
                  <button
                    type="button"
                    onClick={handleComputeRental}
                    disabled={rentalComputing}
                    className="bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-200 text-white disabled:text-slate-500 font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>{rentalComputing ? 'Computing...' : 'Compute'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Contract Type</label>
                    <select
                      value={rentalContractType}
                      onChange={(e) => setRentalContractType(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 cursor-pointer focus:outline-none"
                    >
                      <option value="new">New</option>
                      <option value="renewal">Renewal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Ordinance Period</label>
                    <select
                      value={ordinancePeriod}
                      onChange={(e) => setOrdinancePeriod(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 cursor-pointer focus:outline-none"
                    >
                      <option value="pre_2002">Pre-2002</option>
                      <option value="2002_2013">2002–2013</option>
                      <option value="2013_present">2013–Present</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Lot Type</label>
                    <select
                      value={rentalLotType}
                      onChange={(e) => setRentalLotType(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 cursor-pointer focus:outline-none"
                    >
                      <option value="individual">Individual</option>
                      <option value="family">Family</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Area (sqm)</label>
                    <input
                      type="number"
                      min={0}
                      value={rentalArea}
                      onChange={(e) => setRentalArea(e.target.value)}
                      placeholder="Optional"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                {rentalBreakdown && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] text-emerald-800 font-bold">
                    {rentalBreakdown}
                  </div>
                )}
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
                  className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl shadow-sm"
                >
                  Issue Permit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingPermit && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 text-slate-900 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-lg font-heading italic font-bold text-slate-900">Edit Burial Permit</h3>
              <button onClick={() => setEditingPermit(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleEditPermitSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Deceased Name *</label>
                <input
                  type="text"
                  required
                  value={editDeceasedName}
                  onChange={(e) => setEditDeceasedName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editDateOfBirth}
                    onChange={(e) => setEditDateOfBirth(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Date of Death *</label>
                  <input
                    type="date"
                    required
                    value={editDateOfDeath}
                    onChange={(e) => setEditDateOfDeath(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Death Certificate No.</label>
                  <input
                    type="text"
                    value={editDeathCertificateNumber}
                    onChange={(e) => setEditDeathCertificateNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Permit Fee (₱) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editBurialPermitFee}
                    onChange={(e) => setEditBurialPermitFee(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Status *</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'issued' | 'used' | 'cancelled')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 cursor-pointer focus:outline-none"
                >
                  <option value="issued">Issued</option>
                  <option value="used">Used</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPermit(null)}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-xl shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingPermitId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 space-y-4 text-slate-900 shadow-2xl relative text-center">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Burial Permit?</h3>
              <p className="text-xs text-slate-500 font-medium">
                This will permanently remove this burial permit record. This cannot be undone.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setDeletingPermitId(null)}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => deletingPermitId && handleDeletePermit(deletingPermitId)}
                className="w-1/2 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-xl text-xs transition-all active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingPermit && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 print:bg-white print:static print:p-0">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 space-y-4 text-slate-900 shadow-2xl relative print:shadow-none print:border-0 print:rounded-none print:max-w-none print:p-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 print:hidden">
              <h3 className="text-lg font-heading italic font-bold text-slate-900">View & Print Permit</h3>
              <button onClick={() => setViewingPermit(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="print:text-black">
              <div className="text-center border-b-2 border-slate-900 pb-4">
                <h2 className="text-2xl font-bold uppercase tracking-wide">Himlayan Memorial Park</h2>
                <p className="text-xs mt-1">Republic of the Philippines — Municipal Government</p>
                <p className="text-xs mt-0.5">Burial Permit (AF-58)</p>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-6 text-sm">
                <div className="col-span-2 flex justify-between border-b border-slate-300 pb-2">
                  <span className="font-bold uppercase text-[11px] tracking-wider">Permit No.</span>
                  <span className="font-mono font-extrabold">{viewingPermit.permit_number || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-300 pb-2">
                  <span className="font-bold uppercase text-[11px] tracking-wider">Deceased</span>
                  <span>{viewingPermit.deceased_name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-300 pb-2">
                  <span className="font-bold uppercase text-[11px] tracking-wider">Date of Birth</span>
                  <span>{viewingPermit.date_of_birth ? new Date(viewingPermit.date_of_birth).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-300 pb-2">
                  <span className="font-bold uppercase text-[11px] tracking-wider">Date of Death</span>
                  <span>{new Date(viewingPermit.date_of_death).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between border-b border-slate-300 pb-2">
                  <span className="font-bold uppercase text-[11px] tracking-wider">Death Certificate No.</span>
                  <span>{viewingPermit.death_certificate_number || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-300 pb-2">
                  <span className="font-bold uppercase text-[11px] tracking-wider">Plot</span>
                  <span>{viewingPermit.contract?.plot?.plot_number || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-300 pb-2">
                  <span className="font-bold uppercase text-[11px] tracking-wider">Contract No.</span>
                  <span>{viewingPermit.contract?.contract_number || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-300 pb-2">
                  <span className="font-bold uppercase text-[11px] tracking-wider">Fee</span>
                  <span className="font-extrabold">₱{viewingPermit.burial_permit_fee?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-slate-300 pb-2">
                  <span className="font-bold uppercase text-[11px] tracking-wider">Issued By</span>
                  <span>{issuedByName(viewingPermit)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-300 pb-2">
                  <span className="font-bold uppercase text-[11px] tracking-wider">Issued At</span>
                  <span>{viewingPermit.issued_at ? new Date(viewingPermit.issued_at).toLocaleString() : 'N/A'}</span>
                </div>
                {viewingPermit.notes && (
                  <div className="col-span-2 border-b border-slate-300 pb-2">
                    <span className="font-bold uppercase text-[11px] tracking-wider">Notes</span>
                    <p className="mt-1 italic">"{viewingPermit.notes}"</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-10 mt-12 pb-6 text-center">
                <div>
                  <div className="border-t-2 border-slate-900 pt-2">
                    <span className="font-bold uppercase text-[11px] tracking-wider">Treasurer</span>
                  </div>
                </div>
                <div>
                  <div className="border-t-2 border-slate-900 pt-2">
                    <span className="font-bold uppercase text-[11px] tracking-wider">Mayor</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print Permit</span>
              </button>
              <button
                onClick={() => setViewingPermit(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-6 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

BurialPermitsPage.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
