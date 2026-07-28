import React, { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Calendar,
  Eye,
  MapPin,
  User,
  FileText,
  Edit,
  Trash2,
  Download,
  Upload,
  Filter,
  X,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  Clock,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiClient } from '../../api/client';
import { Burial, Plot } from '../../types';

export const DeceasedRecordsPage: React.FC = () => {
  const [burials, setBurials] = useState<Burial[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');

  // Modal State
  const [selectedBurial, setSelectedBurial] = useState<Burial | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBurial, setEditingBurial] = useState<Burial | null>(null);
  const [deletingBurialId, setDeletingBurialId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Add Form State
  const [deceasedName, setDeceasedName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('1950-01-01');
  const [dateOfDeath, setDateOfDeath] = useState('2026-01-01');
  const [burialDate, setBurialDate] = useState('2026-07-28T10:00');
  const [plotId, setPlotId] = useState('plot-01');
  const [notes, setNotes] = useState('');

  // Edit Form State
  const [editDeceasedName, setEditDeceasedName] = useState('');
  const [editDateOfBirth, setEditDateOfBirth] = useState('');
  const [editDateOfDeath, setEditDateOfDeath] = useState('');
  const [editBurialDate, setEditBurialDate] = useState('');
  const [editBurialStatus, setEditBurialStatus] = useState<'scheduled' | 'completed' | 'cancelled'>('scheduled');
  const [editPlotId, setEditPlotId] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Import State
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  const fetchBurials = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/burials');
      if (res.data?.success) {
        setBurials(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching burials:', err);
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
    fetchBurials();
    fetchPlots();
  }, []);

  // Handle Edit Activation
  const handleOpenEdit = (b: Burial) => {
    setEditingBurial(b);
    setEditDeceasedName(b.deceased_name);
    setEditDateOfBirth(b.date_of_birth || '');
    setEditDateOfDeath(b.date_of_death);
    // Format burial date for datetime-local
    const bDate = new Date(b.burial_date);
    const year = bDate.getFullYear();
    const month = String(bDate.getMonth() + 1).padStart(2, '0');
    const day = String(bDate.getDate()).padStart(2, '0');
    const hours = String(bDate.getHours()).padStart(2, '0');
    const minutes = String(bDate.getMinutes()).padStart(2, '0');
    setEditBurialDate(`${year}-${month}-${day}T${hours}:${minutes}`);
    setEditBurialStatus(b.burial_status);
    setEditPlotId(b.plot_id);
    setEditNotes(b.notes || '');
  };

  // Create Burial Action
  const handleAddBurial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/burials', {
        plot_id: plotId,
        deceased_name: deceasedName,
        date_of_birth: dateOfBirth,
        date_of_death: dateOfDeath,
        burial_date: burialDate,
        notes,
      });

      if (res.data?.success) {
        setShowAddModal(false);
        // Reset form fields
        setDeceasedName('');
        setNotes('');
        fetchBurials();
      }
    } catch (err) {
      console.error('Error adding burial:', err);
    }
  };

  // Update Burial Action
  const handleEditBurialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBurial) return;
    try {
      const res = await apiClient.put(`/burials/${editingBurial.id}`, {
        deceased_name: editDeceasedName,
        date_of_birth: editDateOfBirth,
        date_of_death: editDateOfDeath,
        burial_date: editBurialDate,
        burial_status: editBurialStatus,
        plot_id: editPlotId,
        notes: editNotes,
      });

      if (res.data?.success) {
        setEditingBurial(null);
        fetchBurials();
      }
    } catch (err) {
      console.error('Error updating record:', err);
    }
  };

  // Delete Burial Action
  const handleDeleteBurial = async (id: string) => {
    try {
      const res = await apiClient.delete(`/burials/${id}`);
      if (res.data?.success) {
        setDeletingBurialId(null);
        fetchBurials();
      }
    } catch (err) {
      console.error('Error deleting burial:', err);
    }
  };

  // CSV Import File Parser
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

          // Split by comma, taking care of quoted values
          const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
          const values = matches.map(v => v.trim().replace(/^"|"$/g, ''));

          const item: any = {};
          headers.forEach((header, index) => {
            const val = values[index] || '';
            // normalize header mappings
            if (header.includes('name') || header === 'deceased') {
              item.deceased_name = val;
            } else if (header.includes('birth') || header === 'dob') {
              item.date_of_birth = val;
            } else if (header.includes('death') || header === 'dod') {
              item.date_of_death = val;
            } else if (header.includes('burial') || header === 'date') {
              item.burial_date = val;
            } else if (header.includes('status')) {
              item.burial_status = val.toLowerCase() === 'completed' ? 'completed' : 'scheduled';
            } else if (header.includes('notes')) {
              item.notes = val;
            } else if (header.includes('plot') || header.includes('lot')) {
              item.plot_number = val;
            }
          });

          // Fallbacks for empty required values
          if (!item.deceased_name) item.deceased_name = `Imported Deceased #${i}`;
          if (!item.date_of_death) item.date_of_death = new Date().toISOString().split('T')[0];
          if (!item.burial_date) item.burial_date = new Date().toISOString();
          if (!item.burial_status) item.burial_status = 'scheduled';

          // Match plot_number to actual plot id
          const matchedPlot = plots.find(p => p.plot_number.toLowerCase() === (item.plot_number || '').toLowerCase());
          item.plot_id = matchedPlot ? matchedPlot.id : (plots[0]?.id || 'plot-01');
          item.plot_number_display = matchedPlot ? matchedPlot.plot_number : (item.plot_number || 'A-01');

          parsedRows.push(item);
        }

        setImportPreview(parsedRows);
        setImportError(null);
      } catch (err) {
        setImportError('Failed to parse CSV file. Ensure it is comma-separated.');
      }
    };

    reader.readAsText(file);
  };

  // Submit Parsed CSV Rows to backend
  const handleConfirmImport = async () => {
    setImportLoading(true);
    try {
      const promises = importPreview.map(async (item) => {
        return apiClient.post('/burials', {
          plot_id: item.plot_id,
          deceased_name: item.deceased_name,
          date_of_birth: item.date_of_birth || '1950-01-01',
          date_of_death: item.date_of_death,
          burial_date: item.burial_date.includes('T') ? item.burial_date : `${item.burial_date}T10:00`,
          notes: item.notes || 'Imported via CSV template.'
        });
      });

      await Promise.all(promises);
      setShowImportModal(false);
      setImportPreview([]);
      fetchBurials();
    } catch (err) {
      setImportError('Some records failed to import. Please check your data and retry.');
    } finally {
      setImportLoading(false);
    }
  };

  // Download Sample Excel CSV Template
  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Deceased Name,Date of Birth,Date of Death,Burial Date,Notes,Plot Number\n"
      + "John Doe,1960-05-15,2026-06-10,2026-07-28T10:00,Chapel rites standard,A-01\n"
      + "Jane Smith,1948-11-20,2026-07-02,2026-07-30T13:30,Family honor service,A-02";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Deceased_Records_Import_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to CSV/Excel Action
  const handleExportToExcel = () => {
    const headers = ['ID', 'Deceased Name', 'Plot Number', 'Section', 'Date of Birth', 'Date of Death', 'Burial Date', 'Burial Status', 'Notes'];
    const rows = burials.map(b => [
      b.id,
      b.deceased_name,
      b.plot?.plot_number || b.plot_id || '',
      b.plot?.section || 'A',
      b.date_of_birth || '',
      b.date_of_death || '',
      b.burial_date ? new Date(b.burial_date).toLocaleString() : '',
      b.burial_status,
      b.notes || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Deceased_Records_Registry_Export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Logic
  const filtered = burials.filter((b) => {
    const matchesSearch =
      b.deceased_name.toLowerCase().includes(search.toLowerCase()) ||
      (b.plot?.plot_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.notes || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || b.burial_status === statusFilter;
    const matchesSection = sectionFilter === 'all' || b.plot?.section === sectionFilter;

    return matchesSearch && matchesStatus && matchesSection;
  });

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 border border-slate-200/80 rounded-3xl shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Memorial Records</span>
          <h1 className="text-2xl font-heading italic font-bold text-slate-900 mt-0.5">Deceased Records Registry</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Administer historical interments, update medical & chapel records, and audit lot listings.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowImportModal(true)}
            className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Import Excel or CSV dataset"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-700" />
            <span>Import</span>
          </button>

          <button
            onClick={handleExportToExcel}
            className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Export registry to Excel friendly CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Export to Excel</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Deceased Record</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, notes, or lot..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
          />
        </div>

        {/* Dropdowns filters */}
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Records Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500 text-xs">
            <div className="animate-spin w-5 h-5 border-2 border-emerald-700 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="font-semibold text-slate-400">Syncing registry records...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs space-y-2">
            <FileSpreadsheet className="w-10 h-10 text-slate-200 mx-auto" />
            <p className="font-bold text-slate-500">No records match the active criteria.</p>
            <p className="text-slate-400 text-[11px]">Refine your search or filter options.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                <tr>
                  <th className="p-4 pl-6">Deceased Individual</th>
                  <th className="p-4">Plot Location</th>
                  <th className="p-4">Date of Birth</th>
                  <th className="p-4">Date of Death</th>
                  <th className="p-4">Burial Date</th>
                  <th className="p-4">Burial Status</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Name */}
                    <td className="p-4 pl-6 font-bold text-slate-900 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[11px] text-slate-700 uppercase shrink-0">
                          {b.deceased_name.substring(0, 2)}
                        </div>
                        <div>
                          <span>{b.deceased_name}</span>
                          {b.notes && (
                            <span className="block text-[10px] text-slate-400 italic max-w-xs truncate font-medium mt-0.5">
                              "{b.notes}"
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Lot location */}
                    <td className="p-4 text-emerald-700 font-bold text-xs">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Lot #{b.plot?.plot_number || b.plot_id || 'N/A'} (Sec {b.plot?.section || 'A'})</span>
                      </div>
                    </td>

                    {/* DOB */}
                    <td className="p-4 text-slate-500">{b.date_of_birth || 'N/A'}</td>

                    {/* DOD */}
                    <td className="p-4 text-slate-500">{b.date_of_death}</td>

                    {/* Burial Date */}
                    <td className="p-4 font-mono text-slate-600">
                      <div className="text-slate-800">{new Date(b.burial_date).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-sans">
                        {new Date(b.burial_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                          b.burial_status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : b.burial_status === 'scheduled'
                            ? 'bg-amber-100 text-amber-850 border border-amber-300'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {b.burial_status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right pr-6 space-x-1.5 shrink-0 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedBurial(b)}
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer inline-flex border border-slate-150"
                        title="View Record Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenEdit(b)}
                        className="p-1.5 bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-800 rounded-lg transition-colors cursor-pointer inline-flex border border-slate-150"
                        title="Edit Record"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeletingBurialId(b.id)}
                        className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-lg transition-colors cursor-pointer inline-flex border border-slate-150"
                        title="Delete Record"
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

      {/* --- MODAL 1: VIEW DETAILS --- */}
      {selectedBurial && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 text-slate-900 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-600" />
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-lg font-heading italic font-bold text-slate-900">Deceased Record Card</h3>
              <button onClick={() => setSelectedBurial(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-150">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 font-extrabold text-sm uppercase">
                  {selectedBurial.deceased_name.substring(0, 2)}
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">Deceased Full Name</div>
                  <div className="font-extrabold text-slate-900 text-sm mt-0.5">{selectedBurial.deceased_name}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150">
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Date of Birth</span>
                  <span className="text-slate-800 block font-bold mt-1">{selectedBurial.date_of_birth || 'N/A'}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150">
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Date of Death</span>
                  <span className="text-slate-800 block font-bold mt-1">{selectedBurial.date_of_death}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-150 space-y-2">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Allotted Lot Placement</span>
                  <span className="font-bold text-emerald-700 text-sm block mt-1">
                    Lot #{selectedBurial.plot?.plot_number || selectedBurial.plot_id} (Section {selectedBurial.plot?.section || 'A'})
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Type: {selectedBurial.plot?.lot_type.replace('_', ' ') || 'Single Lawn'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Interment Ceremony</span>
                  <span className="text-slate-800 font-bold block mt-1">
                    {new Date(selectedBurial.burial_date).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              {selectedBurial.notes && (
                <div className="bg-amber-50/40 p-3 rounded-2xl border border-amber-100">
                  <span className="text-amber-700 text-[10px] uppercase tracking-wider block font-bold">Registry Notes & Instructions</span>
                  <p className="text-slate-600 font-medium italic mt-1 font-sans">
                    "{selectedBurial.notes}"
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedBurial(null)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Close Record Detail
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL 2: ADD RECORD --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 text-slate-900 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-lg font-heading italic font-bold text-slate-900">Add Deceased Record</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddBurial} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Deceased Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={deceasedName}
                    onChange={(e) => setDeceasedName(e.target.value)}
                    placeholder="e.g. Fernando Poe"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Date of Death *</label>
                  <input
                    type="date"
                    required
                    value={dateOfDeath}
                    onChange={(e) => setDateOfDeath(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Burial Ceremony Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={burialDate}
                  onChange={(e) => setBurialDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Target Lot Location *</label>
                <select
                  value={plotId}
                  onChange={(e) => setPlotId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium cursor-pointer"
                >
                  {plots.length > 0 ? (
                    plots.map((p) => (
                      <option key={p.id} value={p.id}>
                        Lot #{p.plot_number} (Section {p.section}) — {p.lot_type.replace('_', ' ')}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="plot-01">Lot A-01 (Single Lawn)</option>
                      <option value="plot-02">Lot A-02 (Single Lawn)</option>
                      <option value="plot-03">Lot B-01 (Family Mausoleum)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Operational & Chapel Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Chapel rites standard, priest contact, canopy setup..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium"
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
                  className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  Schedule Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: EDIT RECORD --- */}
      {editingBurial && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 text-slate-900 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-lg font-heading italic font-bold text-slate-900">Edit Deceased Record</h3>
              <button onClick={() => setEditingBurial(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleEditBurialSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Deceased Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={editDeceasedName}
                    onChange={(e) => setEditDeceasedName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editDateOfBirth}
                    onChange={(e) => setEditDateOfBirth(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Date of Death *</label>
                  <input
                    type="date"
                    required
                    value={editDateOfDeath}
                    onChange={(e) => setEditDateOfDeath(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Burial Ceremony Date *</label>
                  <input
                    type="datetime-local"
                    required
                    value={editBurialDate}
                    onChange={(e) => setEditBurialDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Burial Status *</label>
                  <select
                    value={editBurialStatus}
                    onChange={(e) => setEditBurialStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium cursor-pointer"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Target Lot Location *</label>
                <select
                  value={editPlotId}
                  onChange={(e) => setEditPlotId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium cursor-pointer"
                >
                  {plots.map((p) => (
                    <option key={p.id} value={p.id}>
                      Lot #{p.plot_number} (Section {p.section}) — {p.lot_type.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Operational & Chapel Notes</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBurial(null)}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: DELETE CONFIRM --- */}
      {deletingBurialId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 space-y-4 text-slate-900 shadow-2xl relative text-center">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Are you absolutely sure?</h3>
              <p className="text-xs text-slate-500 font-medium">
                This will delete the deceased record. This action cannot be undone and will decrement plot occupancy.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setDeletingBurialId(null)}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                No, Keep
              </button>
              <button
                onClick={() => deletingBurialId && handleDeleteBurial(deletingBurialId)}
                className="w-1/2 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-xl text-xs transition-all cursor-pointer active:scale-95"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 5: IMPORT EXCEL / CSV --- */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-4 text-slate-900 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-lg font-heading italic font-bold text-slate-900">Import Deceased Records</h3>
              <button onClick={() => { setShowImportModal(false); setImportPreview([]); }} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Upload a comma-separated values (.csv) spreadsheet file matching Excel columns: 
              <span className="font-bold text-slate-800"> Deceased Name, Date of Birth, Date of Death, Burial Date, Notes, Plot Number</span>.
            </p>

            {/* Template download & Select */}
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Download Starter Template:</span>
              <button
                onClick={handleDownloadTemplate}
                className="bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg text-[10px] font-bold text-emerald-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Template</span>
              </button>
            </div>

            {/* File Dropzone Input */}
            <div className="border-2 border-dashed border-slate-200 hover:border-emerald-600 bg-slate-50 hover:bg-emerald-50/5 rounded-2xl p-6 text-center cursor-pointer relative transition-all group">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <FileSpreadsheet className="w-8 h-8 text-slate-300 group-hover:text-emerald-600 mx-auto mb-2 transition-colors" />
              <span className="text-xs font-bold text-slate-700 block">Click or Drag & Drop Excel CSV</span>
              <span className="text-[10px] text-slate-400 font-medium block mt-1">Accepts strictly formatted .csv file up to 5MB</span>
            </div>

            {/* Parsing error display */}
            {importError && (
              <div className="p-3.5 bg-rose-50 border border-rose-150 rounded-2xl text-[11px] text-rose-700 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {/* Parsing success preview table */}
            {importPreview.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md">
                    Parsed {importPreview.length} records successfully
                  </span>
                </div>
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50/50 p-1">
                  <table className="w-full text-left text-[10px] text-slate-500">
                    <thead className="bg-slate-100 text-slate-500 uppercase text-[8px] tracking-wider font-bold">
                      <tr>
                        <th className="p-2">Name</th>
                        <th className="p-2">DoD</th>
                        <th className="p-2">Lot</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      {importPreview.slice(0, 5).map((row, index) => (
                        <tr key={index}>
                          <td className="p-2 text-slate-800 font-bold">{row.deceased_name}</td>
                          <td className="p-2">{row.date_of_death}</td>
                          <td className="p-2 text-emerald-700 font-semibold">{row.plot_number_display}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importPreview.length > 5 && (
                    <div className="text-center text-[9px] text-slate-400 font-bold py-1.5 border-t border-slate-200">
                      and {importPreview.length - 5} other rows...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer triggers */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => { setShowImportModal(false); setImportPreview([]); }}
                className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                disabled={importPreview.length === 0 || importLoading}
                onClick={handleConfirmImport}
                className="flex-1 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-100 text-white disabled:text-slate-400 font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-sm active:scale-95 text-center"
              >
                {importLoading ? 'Importing Dataset...' : 'Confirm & Save Records'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
