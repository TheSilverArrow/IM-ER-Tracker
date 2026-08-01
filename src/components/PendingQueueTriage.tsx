import React, { useState } from 'react';
import { ClinicalOrder } from '../types';
import { timeAgo } from '../utils/formatters';
import {
  Check,
  XCircle,
  Clock,
  User,
  UserX,
  MessageSquareText,
  Loader2,
  Inbox,
  Trash2,
} from 'lucide-react';

interface Props {
  pendingOrders: ClinicalOrder[];
  onApproveAndParse: (id: string) => Promise<void>;
  onDismiss: (id: string) => Promise<void>;
  onMuteSender: (senderName: string) => void;
  onDeleteAllPending?: () => Promise<void>;
}

export const PendingQueueTriage: React.FC<Props> = ({
  pendingOrders,
  onApproveAndParse,
  onDismiss,
  onMuteSender,
  onDeleteAllPending,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  if (pendingOrders.length === 0) {
    return (
      <div className="mb-8 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 text-center">
        <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            <Inbox className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
            Raw Pending Inbox (0 Items)
          </p>
          <p className="text-[11px] text-slate-400">
            New incoming STAT messages will appear here. Non-STAT messages are auto-deleted.
          </p>
        </div>
      </div>
    );
  }

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await onApproveAndParse(id);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDismiss = async (id: string) => {
    setProcessingId(id);
    try {
      await onDismiss(id);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!onDeleteAllPending || pendingOrders.length === 0) return;
    setIsDeletingAll(true);
    try {
      await onDeleteAllPending();
    } catch (err) {
      console.error('Error deleting all pending orders:', err);
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <div className="mb-8 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-900/5 dark:from-amber-500/20 dark:via-slate-900 dark:to-slate-900 border-2 border-amber-400/60 dark:border-amber-500/40 p-4 sm:p-5 shadow-xs">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-amber-200/80 dark:border-amber-900/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 dark:text-amber-100 tracking-tight">
                Pending Inbox (Raw Feed)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white shadow-2xs">
                {pendingOrders.length} Pending
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Raw incoming STAT messages. Click Approve to display on the board as is.
            </p>
          </div>
        </div>

        {/* Header Actions: Delete All Button */}
        {onDeleteAllPending && (
          <button
            type="button"
            disabled={isDeletingAll}
            onClick={handleDeleteAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all disabled:opacity-50"
            title="Delete all pending messages in inbox"
          >
            {isDeletingAll ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting All...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete All Pending</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Raw Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {pendingOrders.map((order) => {
          const isProcessing = processingId === order.id;
          const rawMessage = order.raw_text || order.patient_name || 'No raw message text';
          const senderName = order.ordered_by || 'Telegram User';

          return (
            <div
              key={order.id}
              className="relative flex flex-col justify-between p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all"
            >
              <div>
                {/* Header: Sender, Mute Button, & Time Sent */}
                <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <User className="w-3.5 h-3.5 text-amber-500" />
                    <span>Sender: <strong className="text-slate-900 dark:text-white">{senderName}</strong></span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onMuteSender(senderName)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-colors"
                      title={`Mute all future messages from "${senderName}"`}
                    >
                      <UserX className="w-3 h-3" />
                      <span>Mute</span>
                    </button>

                    <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{timeAgo(order.timestamp)}</span>
                    </div>
                  </div>
                </div>

                {/* Message Text ONLY (Raw, original format exactly as sent) */}
                <div className="mb-4 p-3 rounded-xl bg-slate-900 text-slate-100 dark:bg-slate-950 font-mono text-xs leading-relaxed border border-slate-800 shadow-inner">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-amber-400 font-sans font-bold mb-1.5">
                    <MessageSquareText className="w-3 h-3" />
                    <span>Raw Message Text</span>
                  </div>
                  <p className="whitespace-pre-wrap break-words">
                    &quot;{rawMessage}&quot;
                  </p>
                  {order.topic_id && (
                    <div className="mt-2 text-[10px] text-blue-400 font-sans">
                      Topic ID: #{order.topic_id}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: [ ✅ Approve & Display ], [ 🔇 Mute ], and [ ❌ Dismiss ] */}
              <div className="grid grid-cols-12 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  disabled={isProcessing}
                  onClick={() => handleApprove(order.id)}
                  className="col-span-7 py-2.5 px-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  title="Approve and display message as-is on the active board"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Approving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Approve & Display</span>
                    </>
                  )}
                </button>

                <button
                  disabled={isProcessing}
                  onClick={() => onMuteSender(senderName)}
                  className="col-span-3 py-2.5 px-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                  title={`Mute sender "${senderName}"`}
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Mute</span>
                </button>

                <button
                  disabled={isProcessing}
                  onClick={() => handleDismiss(order.id)}
                  className="col-span-2 py-2.5 px-1 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all disabled:opacity-50 flex items-center justify-center"
                  title="Dismiss and remove message"
                >
                  {isProcessing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
