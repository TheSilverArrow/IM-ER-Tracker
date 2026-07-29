import React, { useState } from 'react';
import { ClinicalOrder, OrderStatus } from '../types';
import { timeAgo } from '../utils/formatters';
import {
  CheckCircle,
  XCircle,
  Clock,
  MessageSquareText,
  User,
  UserCheck,
  Calendar,
  Bed,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

interface Props {
  pendingOrders: ClinicalOrder[];
  onUpdateStatus: (id: string, status: OrderStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const PendingQueueTriage: React.FC<Props> = ({
  pendingOrders,
  onUpdateStatus,
  onDelete,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (pendingOrders.length === 0) return null;

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await onUpdateStatus(id, 'In Progress');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      await onDelete(id);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="mb-8 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-900/5 dark:from-amber-500/20 dark:via-slate-900 dark:to-slate-900 border-2 border-amber-400/60 dark:border-amber-500/40 p-4 sm:p-5 shadow-xs">
      {/* Triage Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-amber-200/80 dark:border-amber-900/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
            <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 dark:text-amber-100 tracking-tight">
                Pending Message Approval Queue
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white shadow-2xs">
                {pendingOrders.length} Pending
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Incoming Telegram round messages grouped into single tiles — approve to move to In Progress
            </p>
          </div>
        </div>
      </div>

      {/* Pending Tiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {pendingOrders.map((order) => {
          const isProcessing = processingId === order.id;

          return (
            <div
              key={order.id}
              className="relative flex flex-col justify-between p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all"
            >
              <div>
                {/* Header Bed & Patient */}
                <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 font-mono font-black text-lg text-slate-900 dark:text-white">
                    <Bed className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>{order.bed_number}</span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {timeAgo(order.timestamp)}
                  </span>
                </div>

                {/* Patient Demographics */}
                <div className="space-y-1 mb-3 text-xs">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    <span>{order.patient_name}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    <div>
                      Ordered: <strong className="text-slate-700 dark:text-slate-300">{order.ordered_by}</strong>
                    </div>
                    <div>
                      Age/Sex: <strong className="text-slate-700 dark:text-slate-300">{order.age_sex}</strong>
                    </div>
                    <div>
                      DOB: <strong className="text-slate-700 dark:text-slate-300">{order.birthday}</strong>
                    </div>
                    <div>
                      Case: <strong className="text-blue-600 dark:text-blue-400">{order.case_number}</strong>
                    </div>
                  </div>
                </div>

                {/* Extracted Checklist Preview */}
                <div className="mb-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Orders in Message ({order.items.length}):
                  </span>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-300 list-disc list-inside">
                    {order.items.map((it) => (
                      <li key={it.id} className="truncate">
                        {it.item_text}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Raw Telegram message preview toggle */}
                {order.raw_text && (
                  <div className="mb-3">
                    <button
                      onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400"
                    >
                      <MessageSquareText className="w-3 h-3" />
                      <span>{expandedId === order.id ? 'Hide Raw Telegram' : 'View Telegram Text'}</span>
                      {expandedId === order.id ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                    {expandedId === order.id && (
                      <div className="mt-1 p-2 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] leading-relaxed border border-slate-800">
                        &quot;{order.raw_text}&quot;
                        {order.topic_id && (
                          <div className="mt-0.5 text-[10px] text-blue-400">
                            Topic ID: #{order.topic_id}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  disabled={isProcessing}
                  onClick={() => handleApprove(order.id)}
                  className="py-2 px-3 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                  title="Approve order tile and move to In Progress"
                >
                  {isProcessing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5" />
                  )}
                  <span>Approve Order Tile</span>
                </button>

                <button
                  disabled={isProcessing}
                  onClick={() => handleReject(order.id)}
                  className="py-2 px-3 rounded-xl text-xs font-black bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-700 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                  title="Reject and discard order"
                >
                  {isProcessing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )}
                  <span>Reject / Discard</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
