import React, { useEffect, useRef, useState } from 'react';
import {
  FileText,
  Plus,
  Printer,
  CreditCard,
  Eye,
  CheckCircle2,
  Search,
  Filter,
  Edit,
  Trash2,
  Download,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  X,
  User,
  MapPin,
  Calendar,
  Layers,
  ChevronDown,
  Stamp,
  BadgeCheck
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Contract, Client, Plot, PreNeedPlan, ColumbaryNiche } from '@/types';
import AdminLayout from '@/Layouts/AdminLayout';

const CONTRACT_STATUS_BADGE: Record<string, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'bg-slate-100 text-slate-600 border border-slate-300',
  },
  permit_issued: {
    label: 'Permit Issued',
    className: 'bg-violet-50 text-violet-700 border border-violet-200',
  },
  rental_computed: {
    label: 'Rental Computed',
    className: 'bg-sky-50 text-sky-700 border border-sky-200',
  },
  paid: {
    label: 'Paid',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  pending_approval: {
    label: 'Pending Approval',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  approved: {
    label: 'Approved',
    className: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
  released: {
    label: 'Released',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-rose-50 text-rose-700 border border-rose-200',
  },
};

const CONTRACT_STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'permit_issued', label: 'Permit Issued' },
  { value: 'rental_computed', label: 'Rental Computed' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'released', label: 'Released' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [deletingContractId, setDeletingContractId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Add Form State
  const [contractNumber, setContractNumber] = useState('');
  const [clientId, setClientId] = useState('');
  const [plotId, setPlotId] = useState('');
  const [contractType, setContractType] = useState('standard');
  const [totalAmount, setTotalAmount] = useState('15000');
  const [amountPaid, setAmountPaid] = useState('0');
  const [paymentType, setPaymentType] = useState('cash');
  const [deathCertificateNumber, setDeathCertificateNumber] = useState('');

  // Quick Client Creation State (within Contract modal)
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');

  // Edit Form State
  const [editContractType, setEditContractType] = useState('standard');
  const [editTotalAmount, setEditTotalAmount] = useState('');
  const [editAmountPaid, setEditAmountPaid] = useState('');
  const [editPaymentType, setEditPaymentType] = useState('cash');
  const [editStatus, setEditStatus] = useState<Contract['status']>('draft');
  const [editDeathCertificateNumber, setEditDeathCertificateNumber] = useState('');

  // Import State
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  const [preNeedPlans, setPreNeedPlans] = useState<PreNeedPlan[]>([]);
  const [columbaryNiches, setColumbaryNiches] = useState<ColumbaryNiche[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const toastTimer = useRef<number | null>(null);
  const [showRccDetails, setShowRccDetails] = useState(false);

  const [preNeedPlanId, setPreNeedPlanId] = useState('');
  const [columbaryNicheId, setColumbaryNicheId] = useState('');
  const [ordinancePeriod, setOrdinancePeriod] = useState('');
  const [lotType, setLotType] = useState('');
  const [lotArea, setLotArea] = useState('');
  const [dimension, setDimension] = useState('');
  const [af51Number, setAf51Number] = useState('');
  const [af51Date, setAf51Date] = useState('');
  const [installments, setInstallments] = useState(12);

  const [editPreNeedPlanId, setEditPreNeedPlanId] = useState('');
  const [editColumbaryNicheId, setEditColumbaryNicheId] = useState('');
  const [editOrdinancePeriod, setEditOrdinancePeriod] = useState('');
  const [editLotType, setEditLotType] = useState('');
  const [editLotArea, setEditLotArea] = useState('');
  const [editDimension, setEditDimension] = useState('');
  const [editAf51Number, setEditAf51Number] = useState('');
  const [editAf51Date, setEditAf51Date] = useState('');
  const [editInstallments, setEditInstallments] = useState(12);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const res = await window.axios.get('/api/contracts');
      if (res.data?.success) {
        setContracts(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientsAndPlots = async () => {
    try {
      const [clientsRes, plotsRes] = await Promise.all([
        window.axios.get('/api/clients'),
        window.axios.get('/api/plots'),
      ]);

      if (clientsRes.data?.success) {
        setClients(clientsRes.data.data);
        if (clientsRes.data.data.length > 0) {
          setClientId(clientsRes.data.data[0].id);
        }
      }

      if (plotsRes.data?.success) {
        // filter available or reserved plots for leasing
        setPlots(plotsRes.data.data);
        if (plotsRes.data.data.length > 0) {
          setPlotId(plotsRes.data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching auxiliary data:', err);
    }
  };

  const fetchRccOptions = async () => {
    try {
      const [plansRes, nichesRes] = await Promise.all([
        window.axios.get('/api/pre-need-plans'),
        window.axios.get('/api/columbary-niches'),
      ]);

      if (plansRes.data?.success) setPreNeedPlans(plansRes.data.data);
      if (nichesRes.data?.success) setColumbaryNiches(nichesRes.data.data);
    } catch (err) {
      console.error('Error fetching RCC options:', err);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchContracts();
    fetchClientsAndPlots();
    fetchRccOptions();
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  // Update contract number suggestion on modal trigger
  useEffect(() => {
    if (showAddModal) {
      setContractNumber(`HMC-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  }, [showAddModal]);

  // Handle Quick Client Creation
  const handleQuickClientSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientPhone) {
      alert('Client Name and Phone are required.');
      return;
    }

    try {
      const res = await window.axios.post('/api/clients', {
        full_name: newClientName,
        contact_number: newClientPhone,
        email: newClientEmail || undefined,
      });

      if (res.data?.success) {
        const created = res.data.data;
        setClients((prev) => [created, ...prev]);
        setClientId(created.id);
        setShowNewClientForm(false);
        setNewClientName('');
        setNewClientPhone('');
        setNewClientEmail('');
      }
    } catch (err) {
      console.error('Error creating quick client:', err);
    }
  };

  // Add Contract Form Action
  const handleAddContract = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await window.axios.post('/api/contracts', {
        client_id: clientId,
        plot_id: plotId,
        pre_need_plan_id: preNeedPlanId || null,
        columbary_niche_id: columbaryNicheId || null,
        contract_type: contractType,
        ordinance_period: ordinancePeriod || null,
        lot_type: lotType || null,
        lot_area: lotArea ? parseFloat(lotArea) : null,
        dimension: dimension || null,
        total_amount: parseFloat(totalAmount),
        payment_type: paymentType,
        installments: paymentType === 'installment' ? installments : undefined,
        death_certificate_number: deathCertificateNumber || undefined,
        af_51_number: af51Number || null,
        af_51_date: af51Date || null,
      });

      if (res.data?.success) {
        const addedContract = res.data.data;

        // If amountPaid was set, immediately post a payment record for this contract
        // (only allowed once rental computation has moved the contract past draft).
        const parsedPaid = parseFloat(amountPaid);
        if (parsedPaid > 0 && addedContract.status !== 'draft') {
          await window.axios.post('/api/payments', {
            contract_id: addedContract.id,
            amount: parsedPaid,
            payment_method: paymentType,
            receipt_number: `OR-2026-${Math.floor(10000 + Math.random() * 90000)}`,
            notes: 'Initial deposit logged during deed registration.',
          });
        }

        // Dispatch plots update event to reload dashboards
        window.dispatchEvent(new CustomEvent('himlayan_plots_updated'));
        localStorage.setItem('himlayan_plots_updated_at', Date.now().toString());

        setShowAddModal(false);
        setTotalAmount('15000');
        setAmountPaid('0');
        setDeathCertificateNumber('');
        setPreNeedPlanId('');
        setColumbaryNicheId('');
        setOrdinancePeriod('');
        setLotType('');
        setLotArea('');
        setDimension('');
        setAf51Number('');
        setAf51Date('');
        setInstallments(12);
        fetchContracts();
      }
    } catch (err) {
      console.error('Error creating contract:', err);
    }
  };

  // Open Edit Dialog
  const handleOpenEdit = (ctr: Contract) => {
    setEditingContract(ctr);
    setEditContractType(ctr.contract_type);
    setEditTotalAmount(String(ctr.total_amount || 15000));
    setEditAmountPaid(String(ctr.amount_paid || 0));
    setEditPaymentType(ctr.payment_type || 'cash');
    setEditStatus(ctr.status as any);
    setEditDeathCertificateNumber(ctr.death_certificate_number || '');
    setEditPreNeedPlanId(ctr.pre_need_plan_id || '');
    setEditColumbaryNicheId(ctr.columbary_niche_id || '');
    setEditOrdinancePeriod(ctr.ordinance_period || '');
    setEditLotType(ctr.lot_type || '');
    setEditLotArea(ctr.lot_area != null ? String(ctr.lot_area) : '');
    setEditDimension(ctr.dimension || '');
    setEditAf51Number(ctr.af_51_number || '');
    setEditAf51Date(ctr.af_51_date || '');
    setEditInstallments(ctr.installment_schedules?.length || 12);
  };

  // Edit Submit Form Action
  const handleEditContractSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContract) return;

    try {
      const remaining = parseFloat(editTotalAmount) - parseFloat(editAmountPaid);
      const res = await window.axios.put(`/api/contracts/${editingContract.id}`, {
        pre_need_plan_id: editPreNeedPlanId || null,
        columbary_niche_id: editColumbaryNicheId || null,
        contract_type: editContractType,
        ordinance_period: editOrdinancePeriod || null,
        lot_type: editLotType || null,
        lot_area: editLotArea ? parseFloat(editLotArea) : null,
        dimension: editDimension || null,
        total_amount: parseFloat(editTotalAmount),
        amount_paid: parseFloat(editAmountPaid),
        balance_remaining: remaining >= 0 ? remaining : 0,
        payment_type: editPaymentType,
        installments: editPaymentType === 'installment' ? editInstallments : undefined,
        status: editStatus,
        death_certificate_number: editDeathCertificateNumber || undefined,
        af_51_number: editAf51Number || null,
        af_51_date: editAf51Date || null,
      });

      if (res.data?.success) {
        setEditingContract(null);
        fetchContracts();
      }
    } catch (err) {
      console.error('Error updating contract:', err);
    }
  };

  // Delete Action
  const handleDeleteContract = async (id: string) => {
    try {
      const res = await window.axios.delete(`/api/contracts/${id}`);
      if (res.data?.success) {
        setDeletingContractId(null);
        fetchContracts();
      }
    } catch (err) {
      console.error('Error deleting contract:', err);
    }
  };

  const handleApproveTreasurer = async () => {
    if (!selectedContract) return;
    try {
      const res = await window.axios.post(`/api/contracts/${selectedContract.id}/approve-treasurer`);
      if (res.data?.success) {
        setSelectedContract({ ...selectedContract, ...res.data.data });
        fetchContracts();
        showToast('success', 'Treasurer verification recorded.');
      }
    } catch (err) {
      console.error('Error approving treasurer:', err);
      showToast('error', 'Failed to record treasurer verification.');
    }
  };

  const handleApproveMayor = async () => {
    if (!selectedContract) return;
    try {
      const res = await window.axios.post(`/api/contracts/${selectedContract.id}/approve-mayor`);
      if (res.data?.success) {
        setSelectedContract({ ...selectedContract, ...res.data.data });
        fetchContracts();
        showToast('success', 'Mayor verification recorded.');
      }
    } catch (err) {
      console.error('Error approving mayor:', err);
      showToast('error', 'Failed to record mayor verification.');
    }
  };

  const handleGenerateContract = async () => {
    if (!selectedContract) return;
    try {
      const res = await window.axios.post(`/api/contracts/${selectedContract.id}/generate`);
      if (res.data?.success) {
        setSelectedContract({ ...selectedContract, ...res.data.data });
        fetchContracts();
        showToast('success', 'Contract generated from payment and submitted for approval.');
      }
    } catch (err) {
      console.error('Error generating contract:', err);
      showToast('error', 'Failed to generate contract from payment.');
    }
  };

  const handleReleaseContract = async () => {
    if (!selectedContract) return;
    try {
      const res = await window.axios.post(`/api/contracts/${selectedContract.id}/release`);
      if (res.data?.success) {
        setSelectedContract({ ...selectedContract, ...res.data.data });
        fetchContracts();
        showToast('success', 'Contract released to client.');
      }
    } catch (err) {
      console.error('Error releasing contract:', err);
      showToast('error', 'Failed to release contract.');
    }
  };

  // Import CSV Parser
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
            if (header.includes('contract') || header.includes('number')) {
              item.contract_number = val;
            } else if (header.includes('client') || header.includes('name')) {
              item.client_name = val;
            } else if (header.includes('phone') || header.includes('contact')) {
              item.client_phone = val;
            } else if (header.includes('plot') || header.includes('lot')) {
              item.plot_number = val;
            } else if (header.includes('type') || header.includes('contract_type')) {
              item.contract_type = val.toLowerCase();
            } else if (header.includes('amount') || header.includes('total')) {
              item.total_amount = parseFloat(val);
            } else if (header.includes('payment') || header.includes('method')) {
              item.payment_type = val.toLowerCase();
            }
          });

          if (!item.contract_number) item.contract_number = `HMC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
          if (!item.client_name) item.client_name = `Client Prospect #${i}`;
          if (!item.client_phone) item.client_phone = '0917-111-2222';
          if (!item.contract_type) item.contract_type = 'standard';
          if (isNaN(item.total_amount)) item.total_amount = 15000;
          if (!item.payment_type) item.payment_type = 'cash';

          // Match plot_number
          const matchedPlot = plots.find(p => p.plot_number.toLowerCase() === (item.plot_number || '').toLowerCase());
          item.plot_id = matchedPlot ? matchedPlot.id : (plots[0]?.id || 'plot-01');
          item.plot_number_display = matchedPlot ? matchedPlot.plot_number : (item.plot_number || 'Default');

          parsedRows.push(item);
        }

        setImportPreview(parsedRows);
        setImportError(null);
      } catch (err) {
        setImportError('Failed to parse CSV spreadsheet file.');
      }
    };

    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    setImportLoading(true);
    try {
      for (const item of importPreview) {
        // Register Client first
        let client = clients.find(c => c.full_name.toLowerCase() === item.client_name.toLowerCase() || c.contact_number === item.client_phone);
        if (!client) {
          const clientRes = await window.axios.post('/api/clients', {
            full_name: item.client_name,
            contact_number: item.client_phone,
          });
          if (clientRes.data?.success) {
            client = clientRes.data.data;
          }
        }

        const cid = client ? client.id : (clients[0]?.id || 'client-01');

        // Register contract deed
        await window.axios.post('/api/contracts', {
          client_id: cid,
          plot_id: item.plot_id,
          contract_type: item.contract_type,
          total_amount: item.total_amount,
          payment_type: item.payment_type,
        });
      }

      setShowImportModal(false);
      setImportPreview([]);
      fetchContracts();
    } catch (err) {
      setImportError('Failed to complete import process.');
    } finally {
      setImportLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Contract Number,Client Name,Contact Number,Plot Number,Contract Type,Total Amount,Payment Type\n"
      + "HMC-2026-9011,Cassandra Webb,0915-098-7654,A-04,standard,15000,cash\n"
      + "HMC-2026-9012,Peter Parker,0917-234-5678,A-05,pre-need,35000,installment";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Contracts_Import_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportToExcel = () => {
    const headers = ['Deed ID', 'Contract Number', 'Client Name', 'Contact Number', 'Plot Ref', 'Section', 'Contract Type', 'Total Price', 'Paid Balance', 'Remaining Balance', 'Payment Option', 'Deed Status', 'Issue Date'];
    const rows = contracts.map(c => [
      c.id,
      c.contract_number,
      c.client?.full_name || 'N/A',
      c.client?.contact_number || '',
      c.plot?.plot_number || '',
      c.plot?.section || '',
      c.contract_type,
      c.total_amount || 0,
      c.amount_paid || 0,
      c.balance_remaining || 0,
      c.payment_type,
      c.status,
      c.contract_date ? new Date(c.contract_date).toLocaleDateString() : ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Memorial_Deed_Contracts_Export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter & Search Matcher
  const filtered = contracts.filter((c) => {
    const matchesSearch =
      (c.contract_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.client?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.client?.contact_number || '').includes(search) ||
      (c.plot?.plot_number || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 border border-slate-200/80 rounded-3xl shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Deed Administration</span>
          <h1 className="text-2xl font-heading italic font-bold text-slate-900 mt-0.5">Memorial Deed Contracts</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Register deed of sales, assign owners to reserved plots, track billing balances, and print luxury paper deeds.
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
            <span>Create Draft Contract</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contract #, owner, phone, or plot..."
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
              {CONTRACT_STATUS_FILTERS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table section */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500 text-xs">
            <div className="animate-spin w-5 h-5 border-2 border-emerald-700 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="font-semibold text-slate-400">Loading contracts list...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs space-y-2">
            <FileText className="w-10 h-10 text-slate-200 mx-auto" />
            <p className="font-bold text-slate-500">No contracts match the active criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 font-semibold">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                <tr>
                  <th className="p-4 pl-6">Contract #</th>
                  <th className="p-4">Client / Owner</th>
                  <th className="p-4">Assigned Plot</th>
                  <th className="p-4">Plan</th>
                  <th className="p-4">Niche</th>
                  <th className="p-4">Contract type</th>
                  <th className="p-4">Pricing Specs</th>
                  <th className="p-4">Deed Status</th>
                  <th className="p-4">Approvals</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Number */}
                    <td className="p-4 pl-6 font-mono font-bold text-emerald-700 text-sm">
                      {c.contract_number}
                    </td>

                    {/* Owner */}
                    <td className="p-4 font-bold text-slate-900 text-sm">
                      <div>
                        <span>{c.client?.full_name || 'N/A'}</span>
                        <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
                          📞 {c.client?.contact_number}
                        </span>
                      </div>
                    </td>

                    {/* Plot */}
                    <td className="p-4 text-slate-800 font-bold">
                      <div className="flex items-center gap-1.5 text-emerald-800">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Lot #{c.plot?.plot_number} (Sec {c.plot?.section})</span>
                      </div>
                    </td>

                    <td className="p-4">
                      {c.pre_need_plan?.name ? (
                        <span className="px-2 py-0.5 rounded bg-violet-50 text-violet-700 text-[10px] font-bold border border-violet-200">
                          {c.pre_need_plan.name}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-[10px]">—</span>
                      )}
                    </td>

                    <td className="p-4">
                      {c.columbary_niche?.niche_number ? (
                        <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 text-[10px] font-bold border border-sky-200">
                          Niche #{c.columbary_niche.niche_number}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-[10px]">—</span>
                      )}
                    </td>

                    <td className="p-4 capitalize text-slate-600 font-bold">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] uppercase border border-slate-200">
                        {c.contract_type}
                      </span>
                    </td>

                    {/* Financial breakdowns */}
                    <td className="p-4 space-y-1">
                      <div className="text-slate-900 font-bold">Total: ₱{c.total_amount?.toLocaleString()}</div>
                      <div className="flex gap-2 text-[10px] font-medium text-slate-500">
                        <span>Paid: <span className="font-bold text-emerald-750">₱{c.amount_paid?.toLocaleString()}</span></span>
                        <span>Bal: <span className="font-bold text-amber-700">₱{c.balance_remaining?.toLocaleString()}</span></span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                          CONTRACT_STATUS_BADGE[c.status]?.className ||
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {CONTRACT_STATUS_BADGE[c.status]?.label ?? c.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${c.approved_by_treasurer_at ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                          Treasurer {c.approved_by_treasurer_at ? '✓' : '—'}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${c.approved_by_mayor_at ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                          Mayor {c.approved_by_mayor_at ? '✓' : '—'}
                        </span>
                      </div>
                    </td>

                    <td className="p-4 text-right pr-6 space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedContract(c)}
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-950 rounded-lg transition-colors cursor-pointer inline-flex border border-slate-150"
                        title="Print Luxury Deed"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="p-1.5 bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-800 rounded-lg transition-colors cursor-pointer inline-flex border border-slate-150"
                        title="Edit Deed Specifications"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeletingContractId(c.id)}
                        className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-lg transition-colors cursor-pointer inline-flex border border-slate-150"
                        title="Delete Deed Record"
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

      {/* --- MODAL 1: CREATE CONTRACT --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 text-slate-900 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-lg font-heading italic font-bold text-slate-900">Create Draft Contract</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddContract} className="space-y-4 text-xs font-semibold">
              {/* Client Selection Row */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-150 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-600">Select Owner/Client *</span>
                  <button
                    type="button"
                    onClick={() => setShowNewClientForm(!showNewClientForm)}
                    className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {showNewClientForm ? 'Select Existing Client' : '+ New Client'}
                  </button>
                </div>

                {showNewClientForm ? (
                  <div className="space-y-2 pt-1 border-t border-slate-200">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Full Name</label>
                      <input
                        type="text"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        placeholder="e.g. Maria Clara"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">Contact Phone</label>
                        <input
                          type="text"
                          value={newClientPhone}
                          onChange={(e) => setNewClientPhone(e.target.value)}
                          placeholder="0917-000-0000"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">Email (Optional)</label>
                        <input
                          type="email"
                          value={newClientEmail}
                          onChange={(e) => setNewClientEmail(e.target.value)}
                          placeholder="maria@domain.com"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleQuickClientSubmit}
                      className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-1.5 rounded-lg text-[11px] mt-1 text-center"
                    >
                      Save Client Profile
                    </button>
                  </div>
                ) : (
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 cursor-pointer"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} ({c.contact_number})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Plot Assignment */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Assign Plot Code *</label>
                <select
                  value={plotId}
                  onChange={(e) => setPlotId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 cursor-pointer focus:outline-none"
                >
                  {plots.map((p) => (
                    <option key={p.id} value={p.id}>
                      Lot #{p.plot_number} (Sec {p.section}) — {p.lot_type} [Status: {p.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Contract Type *</label>
                  <select
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 cursor-pointer"
                  >
                    <option value="standard">Standard</option>
                    <option value="pre-need">Pre-Need Lease</option>
                    <option value="at-need">At-Need Direct</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Payment Scheme *</label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 cursor-pointer"
                  >
                    <option value="cash">Cash Full</option>
                    <option value="installment">Installment Plan</option>
                    <option value="check">Post-Dated Check</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Total Agreed Price (₱) *</label>
                  <input
                    type="number"
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Initial Downpayment (₱)</label>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Death Certificate Number (For At-Need)</label>
                <input
                  type="text"
                  value={deathCertificateNumber}
                  onChange={(e) => setDeathCertificateNumber(e.target.value)}
                  placeholder="e.g. 10291-C8"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none"
                />
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowRccDetails(!showRccDetails)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-left cursor-pointer transition-colors"
                >
                  <span className="text-[11px] font-bold text-slate-600">RCC Details</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showRccDetails ? 'rotate-180' : ''}`} />
                </button>

                {showRccDetails && (
                  <div className="space-y-3 p-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Pre-Need Plan</label>
                      <select
                        value={preNeedPlanId}
                        onChange={(e) => setPreNeedPlanId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 cursor-pointer focus:outline-none"
                      >
                        <option value="">No Pre-Need Plan</option>
                        {preNeedPlans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — ₱{p.price.toLocaleString()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Columbary Niche</label>
                      <select
                        value={columbaryNicheId}
                        onChange={(e) => setColumbaryNicheId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 cursor-pointer focus:outline-none"
                      >
                        <option value="">No Columbary Niche</option>
                        {columbaryNiches.map((n) => (
                          <option key={n.id} value={n.id}>
                            Niche #{n.niche_number} (Sec {n.section || 'N/A'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Ordinance Period</label>
                        <select
                          value={ordinancePeriod}
                          onChange={(e) => setOrdinancePeriod(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 cursor-pointer focus:outline-none"
                        >
                          <option value="">Not Set</option>
                          <option value="pre_2002">Pre-2002</option>
                          <option value="2002_2013">2002 – 2013</option>
                          <option value="2013_present">2013 – Present</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Lot Type</label>
                        <select
                          value={lotType}
                          onChange={(e) => setLotType(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 cursor-pointer focus:outline-none"
                        >
                          <option value="">Not Set</option>
                          <option value="individual">Individual</option>
                          <option value="family">Family</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Lot Area (sqm)</label>
                        <input
                          type="number"
                          min={0}
                          value={lotArea}
                          onChange={(e) => setLotArea(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Dimension</label>
                        <input
                          type="text"
                          value={dimension}
                          onChange={(e) => setDimension(e.target.value)}
                          placeholder="e.g. 5m x 10m"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">AF-51 Number</label>
                        <input
                          type="text"
                          value={af51Number}
                          onChange={(e) => setAf51Number(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">AF-51 Date</label>
                        <input
                          type="date"
                          value={af51Date}
                          onChange={(e) => setAf51Date(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                        />
                      </div>
                    </div>

                    {paymentType === 'installment' && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Number of Installments</label>
                        <input
                          type="number"
                          min={2}
                          max={60}
                          value={installments}
                          onChange={(e) => setInstallments(Math.min(60, Math.max(2, Number(e.target.value) || 12)))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                        />
                      </div>
                    )}
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
                  Create Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: EDIT CONTRACT --- */}
      {editingContract && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 text-slate-900 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-lg font-heading italic font-bold text-slate-900">Edit Contract Deed</h3>
              <button onClick={() => setEditingContract(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleEditContractSubmit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Contract Type *</label>
                  <select
                    value={editContractType}
                    onChange={(e) => setEditContractType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900"
                  >
                    <option value="standard">Standard</option>
                    <option value="pre-need">Pre-Need Lease</option>
                    <option value="at-need">At-Need Direct</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Deed Status *</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 cursor-pointer"
                  >
                    <option value="draft">Draft</option>
                    <option value="permit_issued">Permit Issued</option>
                    <option value="rental_computed">Rental Computed</option>
                    <option value="paid">Paid</option>
                    <option value="pending_approval">Pending Approval</option>
                    <option value="approved">Approved</option>
                    <option value="released">Released</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Total Agreed Price (₱) *</label>
                  <input
                    type="number"
                    required
                    value={editTotalAmount}
                    onChange={(e) => setEditTotalAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Amount Paid (₱) *</label>
                  <input
                    type="number"
                    required
                    value={editAmountPaid}
                    onChange={(e) => setEditAmountPaid(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Payment Method Option</label>
                  <select
                    value={editPaymentType}
                    onChange={(e) => setEditPaymentType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 cursor-pointer"
                  >
                    <option value="cash">Cash</option>
                    <option value="installment">Installment</option>
                    <option value="check">Check</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Death Certificate Ref</label>
                  <input
                    type="text"
                    value={editDeathCertificateNumber}
                    onChange={(e) => setEditDeathCertificateNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"
                  />
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowRccDetails(!showRccDetails)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-left cursor-pointer transition-colors"
                >
                  <span className="text-[11px] font-bold text-slate-600">RCC Details</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showRccDetails ? 'rotate-180' : ''}`} />
                </button>

                {showRccDetails && (
                  <div className="space-y-3 p-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Pre-Need Plan</label>
                      <select
                        value={editPreNeedPlanId}
                        onChange={(e) => setEditPreNeedPlanId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 cursor-pointer focus:outline-none"
                      >
                        <option value="">No Pre-Need Plan</option>
                        {preNeedPlans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — ₱{p.price.toLocaleString()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Columbary Niche</label>
                      <select
                        value={editColumbaryNicheId}
                        onChange={(e) => setEditColumbaryNicheId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 cursor-pointer focus:outline-none"
                      >
                        <option value="">No Columbary Niche</option>
                        {columbaryNiches.map((n) => (
                          <option key={n.id} value={n.id}>
                            Niche #{n.niche_number} (Sec {n.section || 'N/A'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Ordinance Period</label>
                        <select
                          value={editOrdinancePeriod}
                          onChange={(e) => setEditOrdinancePeriod(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 cursor-pointer focus:outline-none"
                        >
                          <option value="">Not Set</option>
                          <option value="pre_2002">Pre-2002</option>
                          <option value="2002_2013">2002 – 2013</option>
                          <option value="2013_present">2013 – Present</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Lot Type</label>
                        <select
                          value={editLotType}
                          onChange={(e) => setEditLotType(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 cursor-pointer focus:outline-none"
                        >
                          <option value="">Not Set</option>
                          <option value="individual">Individual</option>
                          <option value="family">Family</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Lot Area (sqm)</label>
                        <input
                          type="number"
                          min={0}
                          value={editLotArea}
                          onChange={(e) => setEditLotArea(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Dimension</label>
                        <input
                          type="text"
                          value={editDimension}
                          onChange={(e) => setEditDimension(e.target.value)}
                          placeholder="e.g. 5m x 10m"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">AF-51 Number</label>
                        <input
                          type="text"
                          value={editAf51Number}
                          onChange={(e) => setEditAf51Number(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">AF-51 Date</label>
                        <input
                          type="date"
                          value={editAf51Date}
                          onChange={(e) => setEditAf51Date(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                        />
                      </div>
                    </div>

                    {editPaymentType === 'installment' && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Number of Installments</label>
                        <input
                          type="number"
                          min={2}
                          max={60}
                          value={editInstallments}
                          onChange={(e) => setEditInstallments(Math.min(60, Math.max(2, Number(e.target.value) || 12)))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingContract(null)}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-xl shadow-sm"
                >
                  Save Deed Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: DELETE CONFIRM --- */}
      {deletingContractId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 space-y-4 text-slate-900 shadow-2xl relative text-center">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Revoke / Delete Deed?</h3>
              <p className="text-xs text-slate-500 font-medium">
                This will delete the Deed contract record from the register database. Linked plots will revert status.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setDeletingContractId(null)}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => deletingContractId && handleDeleteContract(deletingContractId)}
                className="w-1/2 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-xl text-xs transition-all active:scale-95"
              >
                Yes, Revoke
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 4: DEED PREVIEW / PRINT (Luxury Custom Copy) --- */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-8 space-y-6 text-slate-900 max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button onClick={() => setSelectedContract(null)} className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-lg">
              <X className="w-4 h-4 text-slate-400" />
            </button>

            <div className="text-center border-b border-slate-200 pb-4">
              <h2 className="text-2xl font-heading italic font-bold text-slate-900">HIMLAYAN MEMORIAL PARK DEED</h2>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Himlayan Memorial Service Administration</p>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div className="flex justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Contract Ref Number:</span>
                  <span className="font-mono font-bold text-emerald-700 text-base">{selectedContract.contract_number}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Date Issued:</span>
                  <span className="font-bold text-slate-900">{new Date(selectedContract.contract_date).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="text-slate-500 font-bold block uppercase text-[10px]">Client / Owner Details</span>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>Name: <span className="font-bold text-slate-900">{selectedContract.client?.full_name}</span></div>
                  <div>Phone: <span className="font-bold text-slate-900">{selectedContract.client?.contact_number}</span></div>
                  <div>Email: <span className="font-bold text-slate-900">{selectedContract.client?.email || 'N/A'}</span></div>
                  <div>Address: <span className="font-bold text-slate-900">{selectedContract.client?.address || 'N/A'}</span></div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="text-slate-500 font-bold block uppercase text-[10px]">Plot Reserved</span>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>Plot Number: <span className="font-bold text-emerald-700">#{selectedContract.plot?.plot_number}</span></div>
                  <div>Section: <span className="font-bold text-slate-900">Section {selectedContract.plot?.section}</span></div>
                  <div>Lot Type: <span className="font-bold text-slate-900 capitalize">{selectedContract.plot?.lot_type}</span></div>
                  <div>Capacity: <span className="font-bold text-slate-900">{selectedContract.plot?.capacity} Occupants</span></div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="text-slate-500 block">Total Agreed Price:</span>
                  <span className="font-bold text-slate-900 text-base">₱{selectedContract.total_amount?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Amount Paid:</span>
                  <span className="font-bold text-emerald-700 text-base">₱{selectedContract.amount_paid?.toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Remaining Balance:</span>
                  <span className="font-bold text-amber-700 text-base">₱{selectedContract.balance_remaining?.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="text-slate-500 font-bold block uppercase text-[10px]">RCC Details</span>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>Pre-Need Plan: <span className="font-bold text-slate-900">{selectedContract.pre_need_plan?.name || 'N/A'}</span></div>
                  <div>Columbary Niche: <span className="font-bold text-slate-900">#{selectedContract.columbary_niche?.niche_number || 'N/A'}</span></div>
                  <div>Ordinance Period: <span className="font-bold text-slate-900 capitalize">{selectedContract.ordinance_period?.replace('_', ' ') || 'N/A'}</span></div>
                  <div>Lot Type: <span className="font-bold text-slate-900 capitalize">{selectedContract.lot_type || 'N/A'}</span></div>
                  <div>Lot Area: <span className="font-bold text-slate-900">{selectedContract.lot_area ? `${selectedContract.lot_area} sqm` : 'N/A'}</span></div>
                  <div>Dimension: <span className="font-bold text-slate-900">{selectedContract.dimension || 'N/A'}</span></div>
                  <div>AF-51 #: <span className="font-bold text-slate-900">{selectedContract.af_51_number || 'N/A'}</span></div>
                  <div>AF-51 Date: <span className="font-bold text-slate-900">{selectedContract.af_51_date ? new Date(selectedContract.af_51_date).toLocaleDateString() : 'N/A'}</span></div>
                </div>
              </div>

              {selectedContract.installment_schedules && selectedContract.installment_schedules.length > 0 ? (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-slate-500 font-bold block uppercase text-[10px]">Installment Schedule</span>
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-[10px]">
                      <thead className="bg-slate-100 text-slate-500 uppercase text-[8px] tracking-wider font-bold">
                        <tr>
                          <th className="p-2">Due Date</th>
                          <th className="p-2">Amount Due</th>
                          <th className="p-2">Amount Paid</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {selectedContract.installment_schedules.map((s) => (
                          <tr key={s.id}>
                            <td className="p-2 text-slate-700">{new Date(s.due_date).toLocaleDateString()}</td>
                            <td className="p-2 font-bold text-slate-900">₱{s.amount_due.toLocaleString()}</td>
                            <td className="p-2 text-emerald-700 font-bold">₱{s.amount_paid.toLocaleString()}</td>
                            <td className="p-2">
                              <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase border ${
                                s.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                s.status === 'partial' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                s.status === 'overdue' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                'bg-slate-100 text-slate-500 border-slate-200'
                              }`}>
                                {s.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-bold block uppercase text-[10px]">Installment Schedule</span>
                  <p className="text-slate-400 text-[11px] mt-1">No installment schedules recorded for this contract.</p>
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="text-slate-500 font-bold block uppercase text-[10px]">Approvals</span>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Treasurer</span>
                    <span className="font-bold text-slate-900">{selectedContract.approved_by_treasurer_at ? new Date(selectedContract.approved_by_treasurer_at).toLocaleString() : 'Not yet verified'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Mayor</span>
                    <span className="font-bold text-slate-900">{selectedContract.approved_by_mayor_at ? new Date(selectedContract.approved_by_mayor_at).toLocaleString() : 'Not yet verified'}</span>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <button
                    onClick={handleApproveTreasurer}
                    disabled={!!selectedContract.approved_by_treasurer_at || selectedContract.status !== 'pending_approval'}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold py-2 rounded-lg text-[11px] transition-colors cursor-pointer disabled:cursor-default"
                  >
                    {selectedContract.approved_by_treasurer_at ? <BadgeCheck className="w-3.5 h-3.5" /> : <Stamp className="w-3.5 h-3.5" />}
                    {selectedContract.approved_by_treasurer_at ? 'Verified' : 'Verify Treasurer'}
                  </button>
                  <button
                    onClick={handleApproveMayor}
                    disabled={!!selectedContract.approved_by_mayor_at || selectedContract.status !== 'pending_approval' || !selectedContract.approved_by_treasurer_at}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold py-2 rounded-lg text-[11px] transition-colors cursor-pointer disabled:cursor-default"
                  >
                    {selectedContract.approved_by_mayor_at ? <BadgeCheck className="w-3.5 h-3.5" /> : <BadgeCheck className="w-3.5 h-3.5" />}
                    {selectedContract.approved_by_mayor_at ? 'Verified' : 'Verify Mayor'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              {selectedContract.status === 'paid' && (
                <button
                  onClick={handleGenerateContract}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Generate Contract</span>
                </button>
              )}

              {selectedContract.status === 'approved' && (
                <button
                  onClick={handleReleaseContract}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Release Contract</span>
                </button>
              )}

              <button
                onClick={() => window.print()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Copy</span>
              </button>
              <button
                onClick={() => setSelectedContract(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-6 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close
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
              <h3 className="text-lg font-heading italic font-bold text-slate-900">Import Deed Contracts</h3>
              <button onClick={() => { setShowImportModal(false); setImportPreview([]); }} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Upload a comma-separated values (.csv) layout matching columns: 
              <span className="font-bold text-slate-800"> Contract Number, Client Name, Contact Number, Plot Number, Contract Type, Total Amount, Payment Type</span>.
            </p>

            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Starter Layout:</span>
              <button
                onClick={handleDownloadTemplate}
                className="bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg text-[10px] font-bold text-emerald-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
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
                  Parsed {importPreview.length} deed contracts successfully
                </span>
                <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50/50 p-1">
                  <table className="w-full text-left text-[10px] text-slate-500">
                    <thead className="bg-slate-100 text-slate-500 uppercase text-[8px] tracking-wider font-bold">
                      <tr>
                        <th className="p-2">Contract #</th>
                        <th className="p-2">Client Name</th>
                        <th className="p-2">Assigned Plot</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      {importPreview.slice(0, 4).map((row, index) => (
                        <tr key={index}>
                          <td className="p-2 text-slate-800 font-bold">{row.contract_number}</td>
                          <td className="p-2">{row.client_name}</td>
                          <td className="p-2 text-emerald-700 font-bold">{row.plot_number_display}</td>
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
                {importLoading ? 'Importing Deeds...' : 'Confirm & Import Records'}
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

ContractsPage.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
