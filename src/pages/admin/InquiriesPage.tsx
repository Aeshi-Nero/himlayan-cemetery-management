import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Filter,
  Check,
  X,
  FileText,
  User,
  Phone,
  Mail,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  MapPin,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { Inquiry, Plot } from '../../types';

export const InquiriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal State
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInquiry, setEditingInquiry] = useState<Inquiry | null>(null);
  const [deletingInquiryId, setDeletingInquiryId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Form State (Add)
  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [plotId, setPlotId] = useState('');
  const [deceasedName, setDeceasedName] = useState('');
  const [requestedBurialDate, setRequestedBurialDate] = useState('');
  const [message, setMessage] = useState('');

  // Form State (Edit)
  const [editFullName, setEditFullName] = useState('');
  const [editContactNumber, setEditContactNumber] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPlotId, setEditPlotId] = useState('');
  const [editDeceasedName, setEditDeceasedName] = useState('');
  const [editRequestedBurialDate, setEditRequestedBurialDate] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [editStatus, setEditStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');

  // Import State
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/inquiries');
      if (res.data?.success) {
        setInquiries(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching inquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlots = async () => {
    try {
      const res = await apiClient.get('/plots');
      if (res.data?.success) {
        setPlots(res.data.data);
        if (res.data.data.length > 0) {
          setPlotId(res.data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching plots:', err);
    }
  };

  useEffect(() => {
    fetchInquiries();
    fetchPlots();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await apiClient.patch(`/inquiries/${id}`, { status });
      if (res.data?.success) {
        // Dispatch event to notify map & engineer screens
        window.dispatchEvent(new CustomEvent('himlayan_plots_updated'));
        localStorage.setItem('himlayan_plots_updated_at', Date.now().toString());
        fetchInquiries();
      }
    } catch (err) {
      console.error('Error updating inquiry status:', err);
    }
  };

  // Add Inquiry Action
  const handleAddInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/inquiries', {
        full_name: fullName,
        contact_number: contactNumber,
        email,
        plot_id: plotId || undefined,
        message,
        requested_burial_date: requestedBurialDate || undefined,
        deceased_name: deceasedName || undefined,
      });

      if (res.data?.success) {
        setShowAddModal(false);
        setFullName('');
        setContactNumber('');
        setEmail('');
        setMessage('');
        setDeceasedName('');
        setRequestedBurialDate('');
        fetchInquiries();
      }
    } catch (err) {
      console.error('Error adding inquiry:', err);
    }
  };

  // Open Edit Dialog
  const handleOpenEdit = (inq: Inquiry) => {
    setEditingInquiry(inq);
    setEditFullName(inq.full_name || '');
    setEditContactNumber(inq.contact_number || '');
    setEditEmail(inq.email || '');
    setEditPlotId(inq.plot_id || '');
    setEditDeceasedName(inq.deceased_name || '');
    setEditRequestedBurialDate(inq.requested_burial_date || '');
    setEditMessage(inq.message || '');
    setEditStatus(inq.status);
  };

  // Save/Update Inquiry Action
  const handleEditInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInquiry) return;
    try {
      const res = await apiClient.put(`/inquiries/${editingInquiry.id}`, {
        full_name: editFullName,
        contact_number: editContactNumber,
        email: editEmail || undefined,
        plot_id: editPlotId || undefined,
        deceased_name: editDeceasedName || undefined,
        requested_burial_date: editRequestedBurialDate || undefined,
        message: editMessage || undefined,
        status: editStatus,
      });

      if (res.data?.success) {
        setEditingInquiry(null);
        fetchInquiries();
      }
    } catch (err) {
      console.error('Error updating inquiry:', err);
    }
  };

  // Delete Action
  const handleDeleteInquiry = async (id: string) => {
    try {
      const res = await apiClient.delete(`/inquiries/${id}`);
      if (res.data?.success) {
        setDeletingInquiryId(null);
        fetchInquiries();
      }
    } catch (err) {
      console.error('Error deleting inquiry:', err);
    }
  };

  // Import File CSV Handlers
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
            if (header.includes('name') || header === 'client') {
              item.full_name = val;
            } else if (header.includes('phone') || header.includes('contact')) {
              item.contact_number = val;
            } else if (header.includes('email')) {
              item.email = val;
            } else if (header.includes('message') || header.includes('details')) {
              item.message = val;
            } else if (header.includes('deceased')) {
              item.deceased_name = val;
            } else if (header.includes('burial') || header.includes('date')) {
              item.requested_burial_date = val;
            } else if (header.includes('plot') || header.includes('lot')) {
              item.plot_number = val;
            }
          });

          if (!item.full_name) item.full_name = `Imported Inquirer #${i}`;
          if (!item.contact_number) item.contact_number = '0917-000-0000';

          const matchedPlot = plots.find(p => p.plot_number.toLowerCase() === (item.plot_number || '').toLowerCase());
          item.plot_id = matchedPlot ? matchedPlot.id : (plots[0]?.id || '');
          item.plot_number_display = matchedPlot ? matchedPlot.plot_number : (item.plot_number || 'None');

          parsedRows.push(item);
        }

        setImportPreview(parsedRows);
        setImportError(null);
      } catch (err) {
        setImportError('Failed to parse CSV file.');
      }
    };

    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    setImportLoading(true);
    try {
      const promises = importPreview.map(async (item) => {
        return apiClient.post('/inquiries', {
          full_name: item.full_name,
          contact_number: item.contact_number,
          email: item.email || undefined,
          plot_id: item.plot_id || undefined,
          message: item.message || 'Imported via CSV system.',
          deceased_name: item.deceased_name || undefined,
          requested_burial_date: item.requested_burial_date || undefined,
        });
      });

      await Promise.all(promises);
      setShowImportModal(false);
      setImportPreview([]);
      fetchInquiries();
    } catch (err) {
      setImportError('Failed to save imported records.');
    } finally {
      setImportLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Full Name,Contact Number,Email,Message,Deceased Name,Requested Burial Date,Plot Number\n"
      + "Arthur Pendragon,0917-123-4567,arthur@camelot.com,Looking for family plot lawn type,Uther Pendragon,2026-08-15,A-01\n"
      + "Gwen Stacy,0922-987-6543,gwen@empire.com,Urgent service,George Stacy,2026-08-20,A-02";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Inquiries_Import_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportToExcel = () => {
    const headers = ['ID', 'Client Name', 'Contact Number', 'Email', 'Selected Lot', 'Deceased Name', 'Burial Date', 'Message', 'Status', 'Date Submitted'];
    const rows = inquiries.map(i => [
      i.id,
      i.full_name,
      i.contact_number,
      i.email || '',
      i.plot?.plot_number || i.plot_id || 'None',
      i.deceased_name || '',
      i.requested_burial_date || '',
      i.message || '',
      i.status,
      i.createdAt ? new Date(i.createdAt).toLocaleDateString() : ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Reservation_Inquiries_Export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtering
  const filtered = inquiries.filter((inq) => {
    const matchesSearch =
      (inq.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (inq.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (inq.contact_number || '').includes(search) ||
      (inq.message || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || inq.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 border border-slate-200/80 rounded-3xl shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Public Service Desk</span>
          <h1 className="text-2xl font-heading italic font-bold text-slate-900 mt-0.5">Plot Reservation Inquiries</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Process inquiries from portal reservations, update clients, and coordinate plot reservations.
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
            <span>Add Inquiry</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inquirer name, email, phone..."
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
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500 text-xs">
            <div className="animate-spin w-5 h-5 border-2 border-emerald-700 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="font-semibold text-slate-400">Loading reservation inquiries...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs space-y-2">
            <MessageSquare className="w-10 h-10 text-slate-200 mx-auto" />
            <p className="font-bold text-slate-500">No inquiries match the active criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                <tr>
                  <th className="p-4 pl-6">Client Name</th>
                  <th className="p-4">Contact Information</th>
                  <th className="p-4">Requested Lot / Deceased</th>
                  <th className="p-4">Inquiry Message</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {filtered.map((inq) => (
                  <tr key={inq.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Name */}
                    <td className="p-4 pl-6 font-bold text-slate-900 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[11px] text-slate-700 uppercase shrink-0">
                          {(inq.full_name || '').substring(0, 2)}
                        </div>
                        <div>
                          <span>{inq.full_name || ''}</span>
                          {inq.createdAt && (
                            <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
                              Submitted {new Date(inq.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="p-4 text-slate-600 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>{inq.contact_number || ''}</span>
                      </div>
                      {inq.email && (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          <span>{inq.email}</span>
                        </div>
                      )}
                    </td>

                    {/* Requested Plot / Deceased */}
                    <td className="p-4 space-y-1 text-slate-600">
                      {inq.plot_id ? (
                        <div className="flex items-center gap-1 text-emerald-700 font-bold">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Lot #{inq.plot?.plot_number || inq.plot_id}</span>
                        </div>
                      ) : (
                        <div className="text-slate-400 italic">No Plot Selected</div>
                      )}

                      {inq.deceased_name && (
                        <div className="text-[10px] text-slate-500 font-medium">
                          Deceased: <span className="font-bold text-slate-700">{inq.deceased_name}</span>
                        </div>
                      )}
                    </td>

                    {/* Message Details */}
                    <td className="p-4 max-w-xs text-slate-500 font-medium truncate italic" title={inq.message}>
                      "{inq.message || 'No remarks provided.'}"
                    </td>

                    {/* Status badge */}
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                          inq.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : inq.status === 'rejected'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-100 text-amber-850 border border-amber-350'
                        }`}
                      >
                        {inq.status}
                      </span>
                    </td>

                    {/* Action Columns */}
                    <td className="p-4 text-right pr-6 space-x-1.5 whitespace-nowrap shrink-0">
                      {/* Interactive approval triggers */}
                      {inq.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(inq.id, 'approved')}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors cursor-pointer inline-flex"
                            title="Approve & Reserve Lot"
                          >
                            <Check className="w-3.5 h-3.5 font-bold" />
                          </button>

                          <button
                            onClick={() => handleStatusChange(inq.id, 'rejected')}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors cursor-pointer inline-flex"
                            title="Reject Inquiry"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => setSelectedInquiry(inq)}
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer inline-flex border border-slate-150"
                        title="View Full Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenEdit(inq)}
                        className="p-1.5 bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-800 rounded-lg transition-colors cursor-pointer inline-flex border border-slate-150"
                        title="Edit Details"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeletingInquiryId(inq.id)}
                        className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-lg transition-colors cursor-pointer inline-flex border border-slate-150"
                        title="Delete Inquiry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Convert to Contract */}
                      <button
                        onClick={() => navigate('/admin/contracts')}
                        className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-150 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                        title="Initiate Contract Deed"
                      >
                        <FileText className="w-3 h-3 text-emerald-700" />
                        <span>Deed</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL 1: VIEW DETAILS --- */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 text-slate-900 shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-600" />
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-lg font-heading italic font-bold text-slate-900">Inquiry Specifications</h3>
              <button onClick={() => setSelectedInquiry(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Prospect Client</span>
                <div className="text-sm font-extrabold text-slate-900">{selectedInquiry.full_name || ''}</div>
                <div className="text-slate-500 text-[11px] font-mono mt-1">📞 {selectedInquiry.contact_number || ''}</div>
                {selectedInquiry.email && <div className="text-slate-500 text-[11px] font-mono">✉️ {selectedInquiry.email}</div>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150">
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Assigned Plot</span>
                  <span className="font-bold text-emerald-700 block mt-1">
                    {selectedInquiry.plot_id ? `Lot #${selectedInquiry.plot?.plot_number || selectedInquiry.plot_id}` : 'Unassigned'}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150">
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Inquiry Status</span>
                  <span className="font-extrabold text-amber-800 block uppercase mt-1 text-[10px]">
                    {selectedInquiry.status}
                  </span>
                </div>
              </div>

              {selectedInquiry.deceased_name && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150">
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Deceased Individual</span>
                  <span className="font-bold text-slate-800 block mt-1">{selectedInquiry.deceased_name}</span>
                  {selectedInquiry.requested_burial_date && (
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Requested Date: {selectedInquiry.requested_burial_date}
                    </span>
                  )}
                </div>
              )}

              <div className="bg-amber-50/40 p-3.5 rounded-2xl border border-amber-100">
                <span className="text-amber-700 text-[10px] uppercase tracking-wider block font-bold">Client Comments</span>
                <p className="text-slate-600 font-medium italic mt-1 font-sans">
                  "{selectedInquiry.message || 'No comments attached.'}"
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedInquiry(null)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Close Inquiry Card
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL 2: ADD INQUIRY --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 text-slate-900 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-lg font-heading italic font-bold text-slate-900">Add Reservation Inquiry</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddInquiry} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Prospect Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Leonor Rivera"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Contact Number *</label>
                  <input
                    type="text"
                    required
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="0917-000-0000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Target Lot Designation</label>
                <select
                  value={plotId}
                  onChange={(e) => setPlotId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 cursor-pointer focus:outline-none"
                >
                  <option value="">-- No Specific Lot --</option>
                  {plots.map((p) => (
                    <option key={p.id} value={p.id}>
                      Lot #{p.plot_number} (Section {p.section}) — {p.lot_type.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Deceased Name</label>
                  <input
                    type="text"
                    value={deceasedName}
                    onChange={(e) => setDeceasedName(e.target.value)}
                    placeholder="Optional Name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Proposed Burial Date</label>
                  <input
                    type="date"
                    value={requestedBurialDate}
                    onChange={(e) => setRequestedBurialDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Inquiry Specifications & Message</label>
                <textarea
                  rows={2}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter details of what lot specifications the prospect client is looking for..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm"
                >
                  Save Inquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: EDIT INQUIRY --- */}
      {editingInquiry && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 text-slate-900 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-lg font-heading italic font-bold text-slate-900">Edit Inquiry Information</h3>
              <button onClick={() => setEditingInquiry(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleEditInquirySubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Prospect Full Name *</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Contact Number *</label>
                  <input
                    type="text"
                    required
                    value={editContactNumber}
                    onChange={(e) => setEditContactNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Target Lot</label>
                  <select
                    value={editPlotId}
                    onChange={(e) => setEditPlotId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                  >
                    <option value="">None</option>
                    {plots.map((p) => (
                      <option key={p.id} value={p.id}>
                        Lot #{p.plot_number} (Section {p.section})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Process Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Deceased Name</label>
                  <input
                    type="text"
                    value={editDeceasedName}
                    onChange={(e) => setEditDeceasedName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Burial Date</label>
                  <input
                    type="date"
                    value={editRequestedBurialDate}
                    onChange={(e) => setEditRequestedBurialDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Inquiry Remarks</label>
                <textarea
                  rows={2}
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingInquiry(null)}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: DELETE CONFIRM --- */}
      {deletingInquiryId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 space-y-4 text-slate-900 shadow-2xl relative text-center">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Are you sure?</h3>
              <p className="text-xs text-slate-500 font-medium">
                This will delete the reservation inquiry permanently. This cannot be reverted.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setDeletingInquiryId(null)}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deletingInquiryId && handleDeleteInquiry(deletingInquiryId)}
                className="w-1/2 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-xl text-xs transition-all active:scale-95"
              >
                Yes, Delete
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
              <h3 className="text-lg font-heading italic font-bold text-slate-900">Import Reservation Inquiries</h3>
              <button onClick={() => { setShowImportModal(false); setImportPreview([]); }} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Upload a comma-separated value (.csv) spreadsheet matchable parameters:
              <span className="font-bold text-slate-800"> Full Name, Contact Number, Email, Message, Deceased Name, Requested Burial Date, Plot Number</span>.
            </p>

            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Download Starter Layout:</span>
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
                  Parsed {importPreview.length} inquiries successfully
                </span>
                <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50/50 p-1">
                  <table className="w-full text-left text-[10px] text-slate-500">
                    <thead className="bg-slate-100 text-slate-500 uppercase text-[8px] tracking-wider font-bold">
                      <tr>
                        <th className="p-2">Name</th>
                        <th className="p-2">Phone</th>
                        <th className="p-2">Plot Code</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      {importPreview.slice(0, 4).map((row, index) => (
                        <tr key={index}>
                          <td className="p-2 text-slate-800 font-bold">{row.full_name}</td>
                          <td className="p-2">{row.contact_number}</td>
                          <td className="p-2 text-emerald-700 font-semibold">{row.plot_number_display}</td>
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
                className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-xs text-center"
              >
                Cancel
              </button>
              <button
                disabled={importPreview.length === 0 || importLoading}
                onClick={handleConfirmImport}
                className="flex-1 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-100 text-white disabled:text-slate-400 font-bold py-2.5 rounded-xl text-xs text-center shadow-sm"
              >
                {importLoading ? 'Saving...' : 'Confirm & Import Records'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
