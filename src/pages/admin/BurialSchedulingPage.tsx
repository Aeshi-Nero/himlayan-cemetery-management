import React, { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  CheckCircle2,
  User,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Inbox,
  CalendarDays,
  Grid,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiClient } from '../../api/client';
import { Burial, Plot } from '../../types';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const BurialSchedulingPage: React.FC = () => {
  const [burials, setBurials] = useState<Burial[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Calendar Navigation State
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6); // Default to July (index 6)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 6, 28));

  // Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [deceasedName, setDeceasedName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('1950-01-01');
  const [dateOfDeath, setDateOfDeath] = useState('2026-01-01');
  const [burialDate, setBurialDate] = useState('2026-07-28T10:00');
  const [plotId, setPlotId] = useState('plot-01');
  const [notes, setNotes] = useState('');

  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

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

  // Automatically focus calendar on the first scheduled or latest burial's month
  useEffect(() => {
    if (burials.length > 0) {
      const scheduledOnly = burials.filter(b => b.burial_status === 'scheduled');
      const referenceBurial = scheduledOnly.length > 0 ? scheduledOnly[0] : burials[0];
      const refDate = new Date(referenceBurial.burial_date);
      setCurrentYear(refDate.getFullYear());
      setCurrentMonth(refDate.getMonth());
      setSelectedDate(refDate);
    }
  }, [burials]);

  const handleAddBurial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/burials', {
        deceased_name: deceasedName,
        date_of_birth: dateOfBirth,
        date_of_death: dateOfDeath,
        burial_date: burialDate,
        plot_id: plotId,
        notes,
      });

      if (res.data?.success) {
        setShowAddModal(false);
        // Clear form fields
        setDeceasedName('');
        setNotes('');
        fetchBurials();
      }
    } catch (err) {
      console.error('Error scheduling burial:', err);
    }
  };

  const handleUpdateStatus = async (burialId: string, newStatus: 'completed' | 'cancelled') => {
    setUpdatingStatusId(burialId);
    try {
      const res = await apiClient.put(`/burials/${burialId}`, {
        burial_status: newStatus,
      });
      if (res.data?.success) {
        fetchBurials();
      }
    } catch (err) {
      console.error('Error updating burial status:', err);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Calendar Helper Logic
  const getCalendarDays = (year: number, month: number): CalendarDay[] => {
    const days: CalendarDay[] = [];
    const today = new Date();

    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay();

    const prevMonthLast = new Date(year, month, 0).getDate();

    // Padding previous month days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLast - i);
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday:
          d.getDate() === today.getDate() &&
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear(),
      });
    }

    // Current month days
    const currentMonthLast = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= currentMonthLast; i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        isCurrentMonth: true,
        isToday:
          d.getDate() === today.getDate() &&
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear(),
      });
    }

    // Padding next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday:
          d.getDate() === today.getDate() &&
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear(),
      });
    }

    return days;
  };

  const getBurialsForDay = (dayDate: Date) => {
    return burials.filter((b) => {
      const burialDateObj = new Date(b.burial_date);
      return (
        burialDateObj.getFullYear() === dayDate.getFullYear() &&
        burialDateObj.getMonth() === dayDate.getMonth() &&
        burialDateObj.getDate() === dayDate.getDate()
      );
    });
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(today);
  };

  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T10:00`;
  };

  const calendarDays = getCalendarDays(currentYear, currentMonth);
  const selectedDayBurials = getBurialsForDay(selectedDate);

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 border border-slate-200/80 rounded-3xl shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Field Operations</span>
          <h1 className="text-2xl font-heading italic font-bold text-slate-900 mt-0.5">Burial Service Calendar & Schedule</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Organize plot placements, schedule ceremonies, and audit reserved interments.
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          {/* Segmented View Control */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center shrink-0">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendar Grid</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Table List</span>
            </button>
          </div>

          <button
            onClick={() => {
              setBurialDate(formatDateTimeLocal(selectedDate || new Date()));
              setShowAddModal(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm cursor-pointer transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Burial</span>
          </button>
        </div>
      </div>

      {loading && burials.length === 0 ? (
        <div className="p-16 text-center bg-white border border-slate-200 rounded-3xl">
          <div className="animate-spin w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading burials workspace...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === 'calendar' ? (
            <motion.div
              key="calendar-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Left Column: Interactive Month Grid */}
              <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
                {/* Calendar Navigator */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevMonth}
                      className="p-1.5 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-600 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <h2 className="text-base font-heading italic font-bold text-slate-800 px-2 min-w-[140px] text-center">
                      {MONTH_NAMES[currentMonth]} {currentYear}
                    </h2>
                    <button
                      onClick={handleNextMonth}
                      className="p-1.5 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-600 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={handleGoToToday}
                    className="px-3 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-lg transition-all cursor-pointer bg-slate-50"
                  >
                    Today
                  </button>
                </div>

                {/* Grid Container */}
                <div className="space-y-1">
                  {/* Weekday Labels */}
                  <div className="grid grid-cols-7 gap-1 text-center pb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                      <div key={d} className="text-[10px] font-bold uppercase tracking-wider text-slate-400 py-1">
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-1.5">
                    {calendarDays.map((day, idx) => {
                      const dayBurials = getBurialsForDay(day.date);
                      const hasScheduled = dayBurials.some((b) => b.burial_status === 'scheduled');
                      const isSelected =
                        selectedDate.getDate() === day.date.getDate() &&
                        selectedDate.getMonth() === day.date.getMonth() &&
                        selectedDate.getFullYear() === day.date.getFullYear();

                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedDate(day.date)}
                          className={`min-h-[100px] p-2 border rounded-xl flex flex-col justify-between transition-all cursor-pointer relative group ${
                            day.isCurrentMonth ? 'bg-white' : 'bg-slate-50/50 text-slate-300'
                          } ${
                            isSelected
                              ? 'border-emerald-600 ring-2 ring-emerald-600/10'
                              : 'border-slate-150 hover:border-slate-300'
                          } ${
                            day.isToday && !isSelected ? 'ring-1.5 ring-slate-200 bg-emerald-50/10' : ''
                          }`}
                        >
                          {/* Day Number Header */}
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-extrabold px-1.5 py-0.5 rounded-md ${
                                day.isToday
                                  ? 'bg-emerald-700 text-white'
                                  : isSelected
                                  ? 'bg-slate-100 text-slate-800'
                                  : day.isCurrentMonth
                                  ? 'text-slate-800'
                                  : 'text-slate-300'
                              }`}
                            >
                              {day.date.getDate()}
                            </span>

                            {/* Hover Plus Button for quick add */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setBurialDate(formatDateTimeLocal(day.date));
                                setSelectedDate(day.date);
                                setShowAddModal(true);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 rounded-md transition-all cursor-pointer"
                              title="Quick schedule burial on this day"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Day Events Indicator */}
                          <div className="mt-1.5 space-y-1 overflow-y-auto max-h-[64px] scrollbar-none">
                            {dayBurials.slice(0, 2).map((b) => {
                              const isSched = b.burial_status === 'scheduled';
                              return (
                                <div
                                  key={b.id}
                                  className={`text-[9px] px-1.5 py-0.5 rounded-md truncate font-bold ${
                                    isSched
                                      ? 'bg-amber-100 border border-amber-200 text-amber-900 shadow-2xs'
                                      : b.burial_status === 'completed'
                                      ? 'bg-emerald-50 border border-emerald-100 text-emerald-800'
                                      : 'bg-slate-100 border border-slate-200 text-slate-600'
                                  }`}
                                  title={`${b.deceased_name} (${b.burial_status})`}
                                >
                                  {new Date(b.burial_date).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false,
                                  })}{' '}
                                  {b.deceased_name.split(' ')[0]}
                                </div>
                              );
                            })}
                            {dayBurials.length > 2 && (
                              <div className="text-[8px] font-bold text-slate-400 pl-1">
                                + {dayBurials.length - 2} more
                              </div>
                            )}

                            {/* Bottom colored dot representing "scheduled" in yellow if not displayed */}
                            {hasScheduled && dayBurials.length === 0 && (
                              <span className="w-2 h-2 rounded-full bg-amber-400 absolute bottom-1 right-1" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Detailed Day Operations Console */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Selected Date Details</h3>
                    <h2 className="text-sm font-bold text-slate-800 mt-0.5">
                      {selectedDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </h2>
                  </div>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                    {selectedDayBurials.length} Events
                  </span>
                </div>

                <div className="space-y-4">
                  {selectedDayBurials.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50/30">
                      <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-semibold">No services scheduled on this date.</p>
                      <button
                        onClick={() => {
                          setBurialDate(formatDateTimeLocal(selectedDate));
                          setShowAddModal(true);
                        }}
                        className="mt-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-4 rounded-lg text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Schedule Interment</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                      {selectedDayBurials.map((b) => (
                        <div
                          key={b.id}
                          className={`p-4 rounded-2xl border bg-white shadow-2xs space-y-3.5 transition-all hover:shadow-xs relative overflow-hidden ${
                            b.burial_status === 'scheduled'
                              ? 'border-amber-250 ring-1 ring-amber-100 bg-gradient-to-br from-white to-amber-50/10'
                              : b.burial_status === 'completed'
                              ? 'border-emerald-250 bg-gradient-to-br from-white to-emerald-50/5'
                              : 'border-slate-200 bg-slate-50'
                          }`}
                        >
                          {b.burial_status === 'scheduled' && (
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
                          )}
                          {b.burial_status === 'completed' && (
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600" />
                          )}

                          <div className="flex items-start justify-between gap-2 pl-1">
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm">{b.deceased_name}</h4>
                              <div className="flex items-center gap-1.5 text-slate-500 text-[10px] mt-1 font-medium">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>
                                  {new Date(b.burial_date).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                b.burial_status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : b.burial_status === 'scheduled'
                                  ? 'bg-amber-100 text-amber-850 border border-amber-300 font-extrabold'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {b.burial_status}
                            </span>
                          </div>

                          <div className="space-y-1.5 text-xs font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-150 pl-4 ml-1">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>
                                Lot #{b.plot?.plot_number || b.plot_id || 'N/A'} (Section {b.plot?.section || 'A'})
                              </span>
                            </div>
                            {b.notes && (
                              <p className="text-[11px] text-slate-500 italic mt-2 pl-3 border-l-2 border-slate-200 font-medium">
                                "{b.notes}"
                              </p>
                            )}
                          </div>

                          {/* Operational Clerk Actions */}
                          {b.burial_status === 'scheduled' && (
                            <div className="grid grid-cols-2 gap-2 pt-1 ml-1">
                              <button
                                disabled={updatingStatusId !== null}
                                onClick={() => handleUpdateStatus(b.id, 'completed')}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 rounded-xl text-[10px] uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                              >
                                {updatingStatusId === b.id ? 'Updating...' : 'Mark Done'}
                              </button>
                              <button
                                disabled={updatingStatusId !== null}
                                onClick={() => handleUpdateStatus(b.id, 'cancelled')}
                                className="bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 font-bold py-1.5 rounded-xl text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      ))}

                      <button
                        onClick={() => {
                          setBurialDate(formatDateTimeLocal(selectedDate));
                          setShowAddModal(true);
                        }}
                        className="w-full border-2 border-dashed border-slate-250 hover:border-emerald-600 text-slate-500 hover:text-emerald-700 font-bold py-3 rounded-2xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 bg-slate-50/50 hover:bg-white"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Service on this Date</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="list-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-4 pl-6">Deceased Individual</th>
                      <th className="p-4">Plot Location</th>
                      <th className="p-4">Scheduled Date & Time</th>
                      <th className="p-4">Burial Status</th>
                      <th className="p-4">Operational Notes</th>
                      <th className="p-4 text-right pr-6">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {burials.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 pl-6 font-bold text-slate-900 text-sm">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-bold uppercase shrink-0 text-slate-700">
                              {b.deceased_name.substring(0, 2)}
                            </div>
                            <span>{b.deceased_name}</span>
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-emerald-700">
                          Lot #{b.plot?.plot_number || b.plot_id || 'N/A'} (Section {b.plot?.section || 'A'})
                        </td>
                        <td className="p-4 font-mono text-slate-600">
                          <div className="font-bold text-slate-800">
                            {new Date(b.burial_date).toLocaleDateString()}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(b.burial_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              b.burial_status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : b.burial_status === 'scheduled'
                                ? 'bg-amber-100 text-amber-850 border border-amber-300 font-extrabold'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {b.burial_status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 max-w-xs truncate italic">{b.notes || '—'}</td>
                        <td className="p-4 text-right pr-6">
                          {b.burial_status === 'scheduled' && (
                            <button
                              disabled={updatingStatusId !== null}
                              onClick={() => handleUpdateStatus(b.id, 'completed')}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              Complete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-lg font-heading italic font-bold text-slate-900">Schedule Burial Service</h3>
              <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded-md">
                Clerk Portal
              </span>
            </div>

            <form onSubmit={handleAddBurial} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Deceased Full Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={deceasedName}
                    onChange={(e) => setDeceasedName(e.target.value)}
                    placeholder="e.g. Fernando Poe"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Date of Death *</label>
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
                <label className="block text-xs font-bold text-slate-600 mb-1">Scheduled Burial Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={burialDate}
                  onChange={(e) => setBurialDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Target Lot Location *</label>
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
                <label className="block text-xs font-bold text-slate-600 mb-1">Operational & Chapel Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Chapel rites, priest details, special canopy setup..."
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
    </div>
  );
};

