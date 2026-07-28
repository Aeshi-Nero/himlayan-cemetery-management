import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Image as ImageIcon, Sparkles, Loader2, CheckCircle2, FileText } from 'lucide-react';
import { apiClient } from '../api/client';

interface GeminiImageAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GeminiImageAnalyzerModal: React.FC<GeminiImageAnalyzerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [prompt, setPrompt] = useState<string>(
    'Analyze this cemetery plot / monument / headstone photo. Provide a detailed assessment of plot section features, physical condition, lettering readability, and recommended administrative record notes.'
  );
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileChange = (file: File) => {
    if (!file) return;
    setMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setBase64Data(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!base64Data || loading) return;
    setLoading(true);
    setAnalysis(null);

    try {
      const res = await apiClient.post('/gemini/analyze-image', {
        imageBase64: base64Data,
        mimeType,
        prompt,
      });

      if (res.data?.success) {
        setAnalysis(res.data.data.analysis);
      } else {
        setAnalysis('Unable to analyze image. Please try another clear photo.');
      }
    } catch (err: any) {
      console.error('Image analysis error:', err);
      setAnalysis('Error connecting to Gemini Vision API. Please verify server status.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white max-h-[85vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-600/30 border border-amber-400/40 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-heading italic font-bold text-lg text-white flex items-center gap-2">
                  Gemini Photo & Document Analyzer
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </h3>
                <p className="text-xs text-slate-400">Model: gemini-3.1-pro-preview • Vision Intelligence</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-6">
            {/* Upload Area */}
            {!imagePreview ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 bg-slate-950/60 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  className="hidden"
                  id="plot-photo-upload"
                />
                <label htmlFor="plot-photo-upload" className="cursor-pointer flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-amber-950/60 border border-amber-500/30 flex items-center justify-center mb-3 text-amber-400">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="font-heading font-semibold text-white mb-1">Upload Plot Photo or Document</h4>
                  <p className="text-xs text-slate-400 max-w-sm mb-4">
                    Drag and drop or browse headstone photos, memorial plot condition photos, or official documents.
                  </p>
                  <span className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-full text-xs transition-colors">
                    Browse File
                  </span>
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 max-h-60 flex items-center justify-center">
                  <img src={imagePreview} alt="Selected plot" className="max-h-60 object-contain" />
                  <button
                    onClick={() => {
                      setImagePreview(null);
                      setBase64Data(null);
                      setAnalysis(null);
                    }}
                    className="absolute top-2 right-2 bg-slate-900/80 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Analysis Focus Prompt</label>
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Gemini Pro is analyzing image...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Analyze Photo with Gemini 3.1 Pro</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Analysis Result */}
            {analysis && (
              <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-heading font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Gemini Vision Analysis Output</span>
                </div>
                <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-body">
                  {analysis}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
