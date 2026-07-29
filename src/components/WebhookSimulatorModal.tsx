import React, { useState } from 'react';
import { ClinicalOrder } from '../types';
import { orderService } from '../services/orderService';
import { X, Bot, Send, Sparkles, CheckCircle2, Loader2, MessageSquare, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOrderSimulated: (order: ClinicalOrder) => void;
}

export const WebhookSimulatorModal: React.FC<Props> = ({ isOpen, onClose, onOrderSimulated }) => {
  const [textInput, setTextInput] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastResult, setLastResult] = useState<{
    simulated_text: string;
    order: ClinicalOrder;
  } | null>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const sampleMessages = [
    'Bed 302A Jonathan Doe 58M DOB 03/14/1968 STAT CBC, CMP, Blood cultures x2 for fever 38.9C, plus 12-lead ECG - Dr. Vance',
    'Bed 412 Maria Santos 42F DOB 09/22/1984 Portable CXR ETT placement check, ABG stat - Dr. Chen',
    '205B Arthur Reed 67M DOB 11/05/1959 Specimen cup for UA and C&S pre-op - Dr. Lopez',
    'ICU 02 David K. 71M DOB 01/30/1955 STAT IV Furosemide 40mg push, ABG stat, repeat troponin - Dr. Miller',
  ];

  const handleSimulate = async (textToSend?: string) => {
    const rawText = textToSend || textInput;
    if (!rawText.trim()) {
      setError('Please type or select a Telegram message prompt.');
      return;
    }

    setError('');
    setIsSimulating(true);
    try {
      const data = await orderService.simulateWebhook(rawText.trim());
      setLastResult(data);
      onOrderSimulated(data.order);
      setTextInput('');
    } catch (err: any) {
      setError(err?.message || 'Error executing webhook simulation');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                Telegram Webhook AI Parser
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-semibold">
                  Gemini 3.6 Flash
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Simulate raw incoming Telegram messages sent to <code>POST /api/orders</code>
              </p>
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
          <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Input area */}
        <div className="mt-4 space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Raw Telegram Message Text
          </label>
          <div className="relative">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              rows={3}
              placeholder='e.g. Bed 302A Jonathan Doe 58M DOB 03/14/1968 STAT CBC, CMP, Blood cultures x2 - Dr. Vance'
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              disabled={isSimulating}
              onClick={() => handleSimulate()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs active:scale-95 transition-all"
            >
              {isSimulating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Send Webhook POST</span>
            </button>
            <span className="text-[11px] text-slate-400">Endpoint: POST /api/orders</span>
          </div>
        </div>

        {/* Sample Prompts */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Quick Clinical Sample Prompts:
          </span>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {sampleMessages.map((msg, idx) => (
              <button
                key={idx}
                disabled={isSimulating}
                onClick={() => {
                  setTextInput(msg);
                  handleSimulate(msg);
                }}
                className="w-full text-left p-2 rounded-lg text-xs font-medium bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800/60 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-300 border border-slate-200/80 dark:border-slate-700/60 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 shrink-0" />
                  <span className="truncate">&quot;{msg}&quot;</span>
                </div>
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
              </button>
            ))}
          </div>
        </div>

        {/* Gemini Output Result Card */}
        {lastResult && (
          <div className="mt-5 p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Parsed & Created Order Tile Successfully</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-emerald-200/60 dark:border-emerald-900">
                <span className="text-slate-400 block text-[10px]">Bed Number:</span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {lastResult.order.bed_number}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-emerald-200/60 dark:border-emerald-900">
                <span className="text-slate-400 block text-[10px]">Patient Name:</span>
                <span className="font-extrabold text-blue-600 dark:text-blue-400">
                  {lastResult.order.patient_name}
                </span>
              </div>
              <div className="col-span-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-emerald-200/60 dark:border-emerald-900">
                <span className="text-slate-400 block text-[10px]">Extracted Order Checklist ({lastResult.order.items.length}):</span>
                <ul className="text-slate-800 dark:text-slate-200 font-sans list-disc list-inside mt-1">
                  {lastResult.order.items.map((it) => (
                    <li key={it.id}>{it.item_text}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
