import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { apiClient } from '../api/client';
import { Send, CheckCircle2, MessageSquare, Phone, Mail, User, MapPin, Tag, ArrowLeft } from 'lucide-react';

export const InquiryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const plotIdParam = searchParams.get('plotId');
  const plotNumberParam = searchParams.get('plotNumber');
  const sectionParam = searchParams.get('section');
  const lotTypeParam = searchParams.get('lotType');
  const priceParam = searchParams.get('price');

  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [section, setSection] = useState(sectionParam || 'A');
  const [lotType, setLotType] = useState(lotTypeParam || 'single');
  const [requestedBurialDate, setRequestedBurialDate] = useState('');
  const [deceasedName, setDeceasedName] = useState('');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submittedInquiryId, setSubmittedInquiryId] = useState<string | null>(null);

  useEffect(() => {
    if (sectionParam) setSection(sectionParam);
    if (lotTypeParam) setLotType(lotTypeParam);
    if (plotNumberParam) {
      setMessage(`I am interested in inquiring and reserving Memorial Lot #${plotNumberParam} in Section ${sectionParam || 'A'} (${lotTypeParam || 'single'}${priceParam ? `, ₱${Number(priceParam).toLocaleString()}` : ''}). Please contact me regarding quotation and payment terms.`);
    }
  }, [plotNumberParam, sectionParam, lotTypeParam, priceParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !contactNumber) return;
    setSubmitting(true);

    try {
      const res = await apiClient.post('/inquiries', {
        full_name: fullName,
        contact_number: contactNumber,
        email,
        plot_id: plotIdParam || undefined,
        requested_burial_date: requestedBurialDate || undefined,
        deceased_name: deceasedName || undefined,
        message: plotNumberParam
          ? `[Lot #${plotNumberParam} - Section ${section} - ${lotType}] ${message}`
          : `[Section ${section} - ${lotType}] ${message}`,
      });

      if (res.data?.success) {
        setSubmittedInquiryId(res.data.data.id);
      }
    } catch (err) {
      console.error('Error submitting inquiry:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-body pt-24 pb-16">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Himlayan Public Service</span>
          <h1 className="text-3xl sm:text-4xl font-heading italic font-bold text-slate-900 mt-1">Submit Memorial Inquiry</h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-2">
            Submit your reservation request, plot quotation request, or general inquiry directly to our RCC Memorial Clerks.
          </p>
        </div>

        {/* Selected Lot Banner or Guidance */}
        {plotNumberParam ? (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm font-heading">
                #{plotNumberParam}
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest block">Selected Memorial Lot Choice</span>
                <h3 className="font-heading italic font-bold text-slate-900 text-base sm:text-lg">
                  Memorial Lot #{plotNumberParam} • Section {sectionParam}
                </h3>
                <p className="text-xs text-slate-600">
                  Type: <span className="font-semibold text-slate-800 capitalize">{lotTypeParam}</span>
                  {priceParam && (
                    <span className="ml-2 font-bold text-emerald-700">
                      • ₱{Number(priceParam).toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/lots')}
              className="text-xs text-emerald-800 hover:text-emerald-900 bg-white border border-emerald-200 hover:border-emerald-400 font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change Choice</span>
            </button>
          </div>
        ) : (
          <div className="mb-6 bg-slate-100 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 flex items-center justify-between gap-3 shadow-2xs">
            <span>Notice: Select a specific lot choice from the catalog to submit an inquiry for that lot.</span>
            <button
              onClick={() => navigate('/lots')}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              Browse Memorial Lots
            </button>
          </div>
        )}

        {submittedInquiryId ? (
          <div className="bg-white border border-emerald-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-heading italic font-bold text-slate-900">Inquiry Submitted Successfully</h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Thank you, <span className="font-bold text-slate-900">{fullName}</span>. Your inquiry reference ID is{' '}
              <span className="font-mono font-bold text-emerald-700">{submittedInquiryId}</span>. Our RCC Memorial Clerk will review your request for {plotNumberParam ? `Lot #${plotNumberParam}` : 'your selected lot'} and contact you via {contactNumber}.
            </p>
            <div className="pt-4 flex justify-center gap-3">
              <button
                onClick={() => {
                  setSubmittedInquiryId(null);
                  setMessage('');
                }}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs px-5 py-2.5 rounded-full font-semibold transition-colors cursor-pointer"
              >
                Submit Another Inquiry
              </button>
              <button
                onClick={() => navigate('/lots')}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-5 py-2.5 rounded-full font-semibold transition-colors cursor-pointer"
              >
                Browse Memorial Lots
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Juanita Reyes"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone Number *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="+63 917 123 4567"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Requested Burial Date & Time (Optional)</label>
                <input
                  type="datetime-local"
                  value={requestedBurialDate}
                  onChange={(e) => setRequestedBurialDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deceased Name (Optional)</label>
                <input
                  type="text"
                  value={deceasedName}
                  onChange={(e) => setDeceasedName(e.target.value)}
                  placeholder="Name of deceased for burial schedule..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Inquiry Message / Request Details</label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="State your preferred lot details, payment plan requirements, or family memorial questions..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting Inquiry...' : plotNumberParam ? `Submit Inquiry for Lot #${plotNumberParam}` : 'Submit Official Inquiry'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
