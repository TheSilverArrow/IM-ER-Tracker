import React, { useState } from 'react';
import { X, UserX, UserCheck, Plus, ShieldAlert, VolumeX, CheckCircle2, Info } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  blockedSenders: string[];
  onBlockSender: (sender: string) => void;
  onUnblockSender: (sender: string) => void;
  showBlockedOrders: boolean;
  onToggleShowBlockedOrders: (val: boolean) => void;
}

export const ManageBlockedSendersModal: React.FC<Props> = ({
  isOpen,
  onClose,
  blockedSenders,
  onBlockSender,
  onUnblockSender,
  showBlockedOrders,
  onToggleShowBlockedOrders,
}) => {
  const [newSenderInput, setNewSenderInput] = useState('');

  if (!isOpen) return null;

  const handleAddSender = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSenderInput.trim()) return;
    onBlockSender(newSenderInput.trim());
    setNewSenderInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Sender Filter Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mute order messages from interns or specific clinicians
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-5 overflow-y-auto flex-1 text-xs sm:text-sm">
          {/* Information box */}
          <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong>Filtering Intern Messages:</strong> Muted senders won't clutter your round board. You can unblock them anytime to allow messages again.
            </div>
          </div>

          {/* Add New Blocked Sender Input */}
          <form onSubmit={handleAddSender} className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Mute / Block Doctor or Role Name:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSenderInput}
                onChange={(e) => setNewSenderInput(e.target.value)}
                placeholder="e.g. Dr. Intern Smith, Intern, Medical Student..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newSenderInput.trim()}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Mute</span>
              </button>
            </div>
          </form>

          {/* Toggle: Show/Hide Blocked Orders */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Show muted messages on dashboard
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                {showBlockedOrders ? 'Currently showing with a muted tag' : 'Currently hidden completely'}
              </span>
            </div>
            <button
              onClick={() => onToggleShowBlockedOrders(!showBlockedOrders)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showBlockedOrders ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showBlockedOrders ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* List of Muted Senders */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <VolumeX className="w-4 h-4 text-rose-500" />
              Muted Senders List ({blockedSenders.length})
            </h3>

            {blockedSenders.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500">
                No senders muted. All round order messages will appear on your board.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {blockedSenders.map((sender) => (
                  <div
                    key={sender}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                        {sender}
                      </span>
                    </div>
                    <button
                      onClick={() => onUnblockSender(sender)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-emerald-300 transition-all"
                      title="Allow this sender to send orders again"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Allow Messages Again</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
