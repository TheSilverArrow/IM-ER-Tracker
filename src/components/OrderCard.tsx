import React, { useState } from 'react';
import { ClinicalOrder, OrderStatus } from '../types';
import { timeAgo } from '../utils/formatters';
import {
  UserCheck,
  User,
  Calendar,
  Bed,
  FileCheck,
  Clock,
  CheckCircle2,
  Circle,
  CheckCheck,
  MessageSquareText,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  Activity,
} from 'lucide-react';

interface Props {
  order: ClinicalOrder;
  onUpdateStatus: (id: string, status: OrderStatus) => Promise<void>;
  onToggleItem: (orderId: string, itemId: string, isCompleted: boolean) => Promise<void>;
  onCompleteAllItems: (orderId: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const OrderCard: React.FC<Props> = ({
  order,
  onUpdateStatus,
  onToggleItem,
  onCompleteAllItems,
  onDelete,
}) => {
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [isCompletingAll, setIsCompletingAll] = useState(false);
  const [showRawText, setShowRawText] = useState(false);

  const completedCount = order.items.filter((i) => i.is_completed).length;
  const totalItems = order.items.length;
  const isAllCompleted = totalItems > 0 && completedCount === totalItems;

  const handleStatusChange = async (newStatus: OrderStatus) => {
    setLoadingStatus(newStatus);
    try {
      await onUpdateStatus(order.id, newStatus);
    } finally {
      setLoadingStatus(null);
    }
  };

  const handleCheckItem = async (itemId: string, currentVal: boolean) => {
    setLoadingItemId(itemId);
    try {
      await onToggleItem(order.id, itemId, !currentVal);
    } finally {
      setLoadingItemId(null);
    }
  };

  const handleCheckAll = async () => {
    setIsCompletingAll(true);
    try {
      await onCompleteAllItems(order.id);
    } finally {
      setIsCompletingAll(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Remove clinical order tile for ${order.patient_name}?`)) {
      setLoadingStatus('delete');
      try {
        await onDelete(order.id);
      } finally {
        setLoadingStatus(null);
      }
    }
  };

  // Status Badge Helper
  const getStatusBadge = () => {
    switch (order.status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Approval</span>
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            <Activity className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
            <span>In Progress</span>
          </span>
        );
      case 'Done':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Done ({completedCount}/{totalItems})</span>
          </span>
        );
    }
  };

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-200 p-4 sm:p-5 shadow-xs hover:shadow-md ${
        order.status === 'Pending'
          ? 'border-amber-300 dark:border-amber-800/80 ring-2 ring-amber-500/10'
          : order.status === 'In Progress'
          ? 'border-blue-200 dark:border-slate-800 ring-1 ring-blue-500/20'
          : 'border-slate-200 dark:border-slate-800 opacity-90 hover:opacity-100'
      }`}
    >
      <div>
        {/* Top Header: Location/Bed & Status Badge */}
        <div className="flex items-start justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400">
              <Bed className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                {order.bed_number}
              </span>
              <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{timeAgo(order.timestamp)}</span>
              </div>
            </div>
          </div>

          <div>{getStatusBadge()}</div>
        </div>

        {/* Structured Patient Demographics Grid arranged by Gemini */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 mb-4 grid grid-cols-2 gap-2 text-xs">
          {/* Patient Name */}
          <div className="col-span-2 flex items-center gap-2 font-bold text-slate-900 dark:text-white pb-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
            <User className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-sm font-black truncate">{order.patient_name}</span>
          </div>

          {/* Ordered By */}
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400">Ordered:</span>
            <span className="font-bold truncate">{order.ordered_by}</span>
          </div>

          {/* Age / Sex */}
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="text-slate-400">Age/Sex:</span>
            <span className="font-bold font-mono">{order.age_sex}</span>
          </div>

          {/* Birthday */}
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400">DOB:</span>
            <span className="font-bold font-mono">{order.birthday}</span>
          </div>

          {/* Case Number */}
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <FileCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400">Case #:</span>
            <span className="font-bold font-mono text-blue-600 dark:text-blue-400">{order.case_number}</span>
          </div>
        </div>

        {/* Orders Checklist Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Clinical Orders Checklist ({completedCount}/{totalItems})
            </span>

            {/* Check All / Complete All Button */}
            {!isAllCompleted && (
              <button
                disabled={isCompletingAll}
                onClick={handleCheckAll}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs active:scale-95 transition-all disabled:opacity-50"
                title="Mark all orders in this tile as completed at once"
              >
                {isCompletingAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5" />
                )}
                <span>Check Everything</span>
              </button>
            )}
          </div>

          {/* Checklist Items List */}
          <div className="space-y-1.5">
            {order.items.map((item) => {
              const isItemLoading = loadingItemId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => !isItemLoading && handleCheckItem(item.id, item.is_completed)}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                    item.is_completed
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-slate-500 dark:text-slate-400'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                >
                  <button
                    type="button"
                    className="mt-0.5 shrink-0 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {isItemLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    ) : item.is_completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </button>
                  <span
                    className={`text-xs sm:text-sm font-semibold leading-snug break-words ${
                      item.is_completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                    }`}
                  >
                    {item.item_text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Optional Raw Telegram Text Viewer */}
        {order.raw_text && (
          <div className="mb-4">
            <button
              onClick={() => setShowRawText(!showRawText)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <MessageSquareText className="w-3 h-3" />
              <span>{showRawText ? 'Hide Raw Telegram Text' : 'View Raw Telegram Text'}</span>
              {showRawText ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showRawText && (
              <div className="mt-1.5 p-2.5 rounded-xl bg-slate-900 text-slate-300 font-mono text-xs leading-relaxed border border-slate-800">
                &quot;{order.raw_text}&quot;
                {order.topic_id && (
                  <div className="mt-1 text-[10px] text-blue-400 font-sans">
                    Topic ID: #{order.topic_id}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Toolbar Bottom */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
        {/* If pending, highlight approve/reject */}
        {order.status === 'Pending' ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              disabled={loadingStatus !== null}
              onClick={() => handleStatusChange('In Progress')}
              className="py-2 px-3 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              {loadingStatus === 'In Progress' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>Approve Order Tile</span>
            </button>
            <button
              disabled={loadingStatus !== null}
              onClick={handleDelete}
              className="py-2 px-3 rounded-xl text-xs font-black bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 dark:bg-slate-800 dark:hover:bg-rose-950/60 dark:text-slate-300 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-700 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reject / Delete</span>
            </button>
          </div>
        ) : (
          /* Standard status selector pills & delete */
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
              <button
                disabled={loadingStatus !== null}
                onClick={() => handleStatusChange('Pending')}
                className={`px-2 py-1 rounded-lg text-[11px] font-extrabold transition-all ${
                  order.status === 'Pending'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Pending
              </button>
              <button
                disabled={loadingStatus !== null}
                onClick={() => handleStatusChange('In Progress')}
                className={`px-2 py-1 rounded-lg text-[11px] font-extrabold transition-all ${
                  order.status === 'In Progress'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                In Progress
              </button>
              <button
                disabled={loadingStatus !== null}
                onClick={() => handleStatusChange('Done')}
                className={`px-2 py-1 rounded-lg text-[11px] font-extrabold transition-all ${
                  order.status === 'Done'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Done
              </button>
            </div>

            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              title="Delete tile"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
