import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Plus,
  Printer,
  CheckCircle2,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  X,
  FileText,
  DollarSign
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { Payment, Contract } from '../../types';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Add Form State
  const [orNumber, setOrNumber] = useState('');
  const [contractId, setContractId] = useState('');
  const [amount, setAmount] = useState('5000');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');

  // Edit Form State
  const [editOrNumber, setEditOrNumber] = useState('');
  const [editContractId, setEditContractId] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState('cash');
  const [editNotes, setEditNotes] = useState('');

  // Import State
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/payments');
      if (res.data?.success) {
        setPayments(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchContracts = async () => {
    try {
      const res = await apiClient.get('/contracts');
      if (res.data?.success) {
        setContracts(res.data.data);
        if (res.data.data.length > 0) {
          setContractId(res.data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching contracts:', err);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchContracts();
  }, []);

  // Update receipt number generator on modal open
  useEffect(() => {
    if (showAddModal) {
      setOrNumber(`OR-2026-${Math.floor(10000 + Math.random() * 90000)}`);
    }
  }, [showAddModal]);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/payments', {
        contract_id: contractId,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        receipt_number: orNumber,
        notes,
      });

      if (res.data?.success) {
        setShowAddModal(false);
        setAmount('5000');
        setNotes('');
        fetchPayments();
      }
    } catch (err) {
      console.error('Error adding payment:', err);
    }
  };

  // Open Edit Payment Mode
  const handleOpenEdit = (p: Payment) => {
    setEditingPayment(p);
    setEditOrNumber(p.receipt_number || (p as any).or_number || '');
    setEditContractId(p.contract_id);
    setEditAmount(String(p.amount));
    setEditPaymentMethod(p.payment_method);
    setEditNotes(p.notes || '');
  };

  // Update Payment Form Submit
  const handleEditPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;
    try {
      const res = await apiClient.put(`/payments/${editingPayment.id}`, {
        amount: parseFloat(editAmount),
        payment_method: editPaymentMethod,
        receipt_number: editOrNumber,
        notes: editNotes,
      });

      if (res.data?.success) {
        setEditingPayment(null);
        fetchPayments();
      }
    } catch (err) {
      console.error('Error updating payment:', err);
    }
  };

  // Delete Payment Action
  const handleDeletePayment = async (id: string) => {
    try {
      const res = await apiClient.delete(`/payments/${id}`);
      if (res.data?.success) {
        setDeletingPaymentId(null);
        fetchPayments();
      }
    } catch (err) {
      console.error('Error deleting payment:', err);
    }
  };

  // Import Parser CSV
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const lines = text.split('\n');
        if (lines.length < 2) {
          setImportError('Empty CSV file or missing headers');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
        const parsedRows: any[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i]?.trim();
          if (!line) continue;

          const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
          const values = matches.map(v => v.trim().replace(/^"|"$/g, ''));

          const item: any = {};
          headers.forEach((header, index) => {
            const val = values[index] || '';
            if (header.includes('or') || header.includes('receipt') || header.includes('number')) {
              item.receipt_number = val;
            } else if (header.includes('contract') || header.includes('ctr')) {
              item.contract_number = val;
            } else if (header.includes('amount') || header.includes('paid')) {
              item.amount = parseFloat(val);
            } else if (header.includes('method') || header.includes('type')) {
              const lower = val.toLowerCase();
              item.payment_method = lower.includes('check') ? 'check' : lower.includes('transfer') || lower.includes('gcash') ? 'bank_transfer' : lower.includes('installment') ? 'installment' : 'cash';
            } else if (header.includes('notes') || header.includes('remarks')) {
              item.notes = val;
            }
          });

          if (!item.receipt_number) item.receipt_number = `OR-2026-${Math.floor(10000 + Math.random() * 90000)}`;
          if (isNaN(item.amount)) item.amount = 5000;
          if (!item.payment_method) item.payment_method = 'cash';

          // Match contract_number to actual contract id
          const matchedContract = contracts.find(c => (c.contract_number || '').toLowerCase() === (item.contract_number || '').toLowerCase());
          item.contract_id = matchedContract ? matchedContract.id : (contracts[0]?.id || 'contract-01');
          item.contract_number_display = matchedContract ? (matchedContract.contract_number || '') : (item.contract_number || 'Default');

          parsedRows.push(item);
        }

        setImportPreview(parsedRows);
        setImportError(null);
      } catch (err) {
        setImportError('Failed to parse CSV spreadsheet.');
      }
    };

    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    setImportLoading(true);
    try {
      const promises = importPreview.map(async (item) => {
        return apiClient.post('/payments', {
          contract_id: item.contract_id,
          amount: item.amount,
          payment_method: item.payment_method,
          receipt_number: item.receipt_number,
          notes: item.notes || 'Imported Payment Entry'
        });
      });

      await Promise.all(promises);
      setShowImportModal(false);
      setImportPreview([]);
      fetchPayments();
    } catch (err) {
      setImportError('Failed to complete payments import.');
    } finally {
      setImportLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Receipt Number,Contract Number,Amount,Payment Method,Notes\n"
      + "OR-2026-90812,HMC-2026-0001,8500,cash,Cash standard partial payment\n"
      + "OR-2026-90813,HMC-2026-0002,12000,bank_transfer,GCash Direct Transfer ref#2193";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Payments_Import_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportToExcel = () => {
    const headers = ['OR ID', 'OR Number / Receipt', 'Contract Number', 'Client Owner', 'Payment Method', 'Amount Paid', 'Date Logged', 'Notes'];
    const rows = payments.map(p => {
      const receiptNum = p.receipt_number || (p as any).or_number || '';
      return [
        p.id,
        receiptNum,
        p.contract?.contract_number || '',
        p.contract?.client?.full_name || 'N/A',
        p.payment_method,
        p.amount || 0,
        p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '',
        p.notes || ''
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Financial_Payments_Export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Logic
  const filtered = payments.filter((p) => {
    const receiptNum = p.receipt_number || (p as any).or_number || '';
    const matchesSearch =
      receiptNum.toLowerCase().includes(search.toLowerCase()) ||
      (p.contract?.contract_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.contract?.client?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.notes || '').toLowerCase().includes(search.toLowerCase());

    const matchesMethod = methodFilter === 'all' || p.payment_method === methodFilter;

    return matchesSearch && matchesMethod;
  });

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 border border-slate-200/80 rounded-3xl shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Financial Ledger</span>
          <h1 className="text-2xl font-heading italic font-bold text-slate-900 mt-0.5">Official Payments & Receipts</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Audit payment receipts, update installments, and print official receipts for lot purchases.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowImportModal(true)}
            className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-700" />
            <span>Import</span>
          </button>

          <button
            onClick={handleExportToExcel}
            className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Export to Excel</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Log Official Receipt</span>
          </button>
        </div>
      </div>

      {/* Filter and Search toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search OR #, Contract #, or Owner name..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="check">Check</option>
              <option value="bank_transfer">Bank / GCash</option>
              <option value="installment">Installment</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table section */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500 text-xs">
            <div className="animate-spin w-5 h-5 border-2 border-emerald-700 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="font-semibold text-slate-400">Loading ledger data...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs space-y-2">
            <CreditCard className="w-10 h-10 text-slate-200 mx-auto" />
            <p className="font-bold text-slate-500">No payment logs match the active criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                <tr>
                  <th className="p-4 pl-6">OR Number / Ref</th>
                  <th className="p-4">Contract Deed</th>
                  <th className="p-4">Owner / Client</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4">Amount Paid</th>
                  <th className="p-4">Payment Date</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {filtered.map((p) => {
                  const receiptNum = p.receipt_number || (p as any).or_number || p.id;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Receipt number */}
                      <td className="p-4 pl-6 font-mono font-bold text-emerald-700 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-100 text-xs">
                            {receiptNum}
                          </span>
                        </div>
                      </td>

                      {/* Contract */}
                      <td className="p-4 font-mono text-slate-800 font-bold">
                        {p.contract?.contract_number || 'N/A'}
                      </td>

                      {/* Client */}
                      <td className="p-4 font-bold text-slate-950 text-sm">
                        {p.contract?.client?.full_name || 'N/A'}
                        {p.notes && (
                          <span className="block text-[10px] text-slate-400 font-medium italic mt-0.5 truncate max-w-xs">
                            "{p.notes}"
                          </span>
                        )}
                      </td>

                      {/* Method */}
                      <td className="p-4 capitalize text-slate-700">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-extrabold uppercase">
                          {p.payment_method.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="p-4 font-extrabold text-slate-900 text-sm">
                        ₱{p.amount?.toLocaleString()}
                      </td>

                      {/* Date */}
                      <td className="p-4 text-slate-500 font-mono">
                        {p.payment_date ? new Date(p.payment_date).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right pr-6 space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedReceipt(p)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-950 rounded-lg transition-colors cursor-pointer inline-flex border border-slate-150"
                          title="Print Receipt Copy"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-850 rounded-lg transition-colors cursor-pointer inline-flex border border-slate-150"
                          title="Edit Payment Information"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeletingPaymentId(p.id)}
                          className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-lg transition-colors cursor-pointer inline-flex border border-slate-150"
                          title="Delete Payment Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL 1: ADD RECEIPT --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 text-slate-900 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-lg font-heading italic font-bold text-slate-900">Log New Official Receipt</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddPayment} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Receipt Number (OR) *</label>
                <input
                  type="text"
                  required
                  value={orNumber}
                  onChange={(e) => setOrNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Associate Contract Deed *</label>
                <select
                  value={contractId}
                  onChange={(e) => setContractId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 cursor-pointer focus:outline-none"
                >
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.contract_number} — {c.client?.full_name || 'N/A'} (Bal: ₱{c.balance_remaining?.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Payment Method *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 cursor-pointer focus:outline-none"
                  >
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="bank_transfer">Bank Transfer / GCash</option>
                    <option value="installment">Installment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Amount Paid (₱) *</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Office / Clerical Remarks</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Cleared check, partial installment payment, official reservation fee..."
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
                  className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl shadow-sm"
                >
                  Save & Print Copy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: EDIT PAYMENT --- */}
      {editingPayment && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 text-slate-900 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-lg font-heading italic font-bold text-slate-900">Edit Payment Receipt</h3>
              <button onClick={() => setEditingPayment(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleEditPaymentSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Receipt Number (OR) *</label>
                <input
                  type="text"
                  required
                  value={editOrNumber}
                  onChange={(e) => setEditOrNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Payment Method *</label>
                  <select
                    value={editPaymentMethod}
                    onChange={(e) => setEditPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 cursor-pointer"
                  >
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="bank_transfer">Bank / GCash</option>
                    <option value="installment">Installment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Amount Paid (₱) *</label>
                  <input
                    type="number"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Remarks & Clerical Notes</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPayment(null)}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-center"
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

      {/* --- MODAL 3: DELETE CONFIRM --- */}
      {deletingPaymentId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 space-y-4 text-slate-900 shadow-2xl relative text-center">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Void Payment Record?</h3>
              <p className="text-xs text-slate-500 font-medium">
                This will void this official receipt and delete it from the ledger. This cannot be undone.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setDeletingPaymentId(null)}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => deletingPaymentId && handleDeletePayment(deletingPaymentId)}
                className="w-1/2 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-xl text-xs transition-all active:scale-95"
              >
                Void Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 4: PRINT RECEIPT PREVIEW --- */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-8 space-y-6 text-slate-900 shadow-2xl relative">
            <button onClick={() => setSelectedReceipt(null)} className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-lg">
              <X className="w-4 h-4 text-slate-400" />
            </button>

            <div className="text-center border-b border-slate-200 pb-4">
              <h2 className="text-xl font-heading italic font-bold text-slate-900">OFFICIAL RECEIPT</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold">Himlayan Memorial Services</p>
            </div>

            <div className="space-y-3 text-xs bg-slate-50/80 p-4 rounded-xl border border-slate-200 font-semibold text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Receipt OR Number</span>
                <span className="font-mono font-bold text-emerald-800 text-sm">
                  {selectedReceipt.receipt_number || (selectedReceipt as any).or_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Payment Date</span>
                <span className="font-mono text-slate-800">{new Date(selectedReceipt.payment_date).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Contract Deed</span>
                <span className="font-mono text-slate-800">{selectedReceipt.contract?.contract_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Client / Payer</span>
                <span className="text-slate-850">{selectedReceipt.contract?.client?.full_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3">
                <span className="text-slate-500">Amount Received</span>
                <span className="font-extrabold text-slate-950 text-base">₱{selectedReceipt.amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Channel</span>
                <span className="font-extrabold text-emerald-700 capitalize">{selectedReceipt.payment_method.replace('_', ' ')}</span>
              </div>
              {selectedReceipt.notes && (
                <div className="border-t border-slate-200 pt-2 text-[10px] italic text-slate-500">
                  Notes: "{selectedReceipt.notes}"
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Copy</span>
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-6 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 5: IMPORT --- */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-4 text-slate-900 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-lg font-heading italic font-bold text-slate-900">Import Financial Payments</h3>
              <button onClick={() => { setShowImportModal(false); setImportPreview([]); }} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Upload a comma-separated values (.csv) layout matching columns: 
              <span className="font-bold text-slate-800"> Receipt Number, Contract Number, Amount, Payment Method, Notes</span>.
            </p>

            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Starter Layout:</span>
              <button
                onClick={handleDownloadTemplate}
                className="bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg text-[10px] font-bold text-emerald-700 inline-flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Starter CSV</span>
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-200 hover:border-emerald-600 bg-slate-50 hover:bg-emerald-50/5 rounded-2xl p-6 text-center cursor-pointer relative transition-all group">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <FileSpreadsheet className="w-8 h-8 text-slate-300 group-hover:text-emerald-600 mx-auto mb-2 transition-colors" />
              <span className="text-xs font-bold text-slate-700 block">Click or Drag & Drop Excel CSV</span>
              <span className="text-[10px] text-slate-400 font-medium block mt-1">Accepts CSV files up to 5MB</span>
            </div>

            {importError && (
              <div className="p-3.5 bg-rose-50 border border-rose-150 rounded-2xl text-[11px] text-rose-700 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {importPreview.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md">
                  Parsed {importPreview.length} payment entries successfully
                </span>
                <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50/50 p-1">
                  <table className="w-full text-left text-[10px] text-slate-500">
                    <thead className="bg-slate-100 text-slate-500 uppercase text-[8px] tracking-wider font-bold">
                      <tr>
                        <th className="p-2">OR #</th>
                        <th className="p-2">Contract Ref</th>
                        <th className="p-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      {importPreview.slice(0, 4).map((row, index) => (
                        <tr key={index}>
                          <td className="p-2 text-slate-800 font-bold">{row.receipt_number}</td>
                          <td className="p-2 font-mono">{row.contract_number_display}</td>
                          <td className="p-2 text-emerald-700 font-bold">₱{row.amount?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => { setShowImportModal(false); setImportPreview([]); }}
                className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-center cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={importPreview.length === 0 || importLoading}
                onClick={handleConfirmImport}
                className="flex-1 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-100 text-white disabled:text-slate-400 font-bold py-2.5 rounded-xl text-xs text-center shadow-sm"
              >
                {importLoading ? 'Saving Entries...' : 'Confirm & Import Records'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
