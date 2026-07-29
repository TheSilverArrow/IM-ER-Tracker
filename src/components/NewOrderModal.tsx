import React, { useState } from 'react';
import { X, Plus, Loader2, Stethoscope, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmitOrderText: (text: string) => Promise<void>;
}

export const NewOrderModal: React.FC<Props> = ({ isOpen, onClose, onSubmitOrderText }) => {
  const [rawText, setRawText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) {
      setError('Please paste or type the clinical round message.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await onSubmitOrderText(rawText.trim());
      setRawText('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to parse and submit order message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Log Round Message</h2>
              <p className="text-xs text-slate-500">Paste Telegram round text — Gemini AI will arrange patient tile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Clinical Telegram Message *
            </label>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={4}
              placeholder="e.g. Bed 302A Jonathan Doe 58M DOB 03/14/1968 STAT CBC, CMP, Blood cultures x2 for fever 38.9C, plus 12-lead ECG - Dr. Vance"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
              required
            />
            <p className="mt-1.5 text-[11px] text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-500 shrink-0" />
              <span>Gemini AI will extract Doctor, Patient Name, Age/Sex, Birthday, Bed #, Case # & Checklist items into one tile.</span>
            </p>
          </div>

          {/* Preset Buttons for Quick Test */}
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Or Click Quick Sample Message:
            </span>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() =>
                  setRawText(
                    'Bed 302A Jonathan Doe 58M DOB 03/14/1968 STAT CBC, CMP, Blood cultures x2 for fever 38.9C, plus 12-lead ECG - Dr. Vance'
                  )
                }
                className="w-full text-left p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 text-xs font-mono truncate"
              >
                Bed 302A Jonathan Doe 58M STAT CBC, CMP, Blood cultures x2...
              </button>
              <button
                type="button"
                onClick={() =>
                  setRawText(
                    'Bed 412 Maria Santos 42F DOB 09/22/1984 Portable CXR ETT placement check, ABG stat - Dr. Chen'
                  )
                }
                className="w-full text-left p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 text-xs font-mono truncate"
              >
                Bed 412 Maria Santos 42F Portable CXR ETT placement check...
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs active:scale-95 transition-all"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 stroke-[3]" />
              )}
              <span>Create Order Tile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
