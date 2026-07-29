import React from 'react';
import { FilterState, OrderStatus } from '../types';
import {
  LayoutDashboard,
  Clock,
  CheckCircle2,
  Activity,
  Bot,
  Code2,
  Building2,
  RotateCcw,
  UserX,
} from 'lucide-react';

interface Props {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onOpenSimulator: () => void;
  onOpenWebhookDocs: () => void;
  onOpenManageSenders: () => void;
  onResetSeedData: () => void;
  totalOrdersCount: number;
  pendingCount: number;
  blockedSendersCount: number;
}

export const Sidebar: React.FC<Props> = ({
  filters,
  onFilterChange,
  onOpenSimulator,
  onOpenWebhookDocs,
  onOpenManageSenders,
  onResetSeedData,
  totalOrdersCount,
  pendingCount,
  blockedSendersCount,
}) => {
  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 min-h-[calc(100vh-61px)]">
      {/* Ward Information */}
      <div className="mb-6 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
          <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Inpatient Rounds</span>
        </div>
        <div className="text-sm font-black text-slate-900 dark:text-white">
          Floor 3 Ward Rounds
        </div>
        <div className="text-xs text-slate-500 mt-2 flex justify-between font-medium">
          <span>Total Tiles: {totalOrdersCount}</span>
          <span className="font-bold text-amber-600 dark:text-amber-400">
            {pendingCount} Pending
          </span>
        </div>
      </div>

      {/* Main Status Views */}
      <div className="space-y-6 flex-1">
        <div>
          <h3 className="px-2 text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Status Views
          </h3>
          <nav className="space-y-1">
            <button
              onClick={() => onFilterChange({ status: 'All' })}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                filters.status === 'All'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" />
                <span>All Patient Tiles</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold">
                {totalOrdersCount}
              </span>
            </button>

            <button
              onClick={() => onFilterChange({ status: 'Pending' })}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                filters.status === 'Pending'
                  ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Pending Approval</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 font-extrabold">
                {pendingCount}
              </span>
            </button>

            <button
              onClick={() => onFilterChange({ status: 'In Progress' })}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                filters.status === 'In Progress'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                <span>In Progress</span>
              </div>
            </button>

            <button
              onClick={() => onFilterChange({ status: 'Done' })}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                filters.status === 'Done'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Completed Tiles</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Integration Tools */}
        <div>
          <h3 className="px-2 text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Integration & Sender Rules
          </h3>
          <div className="space-y-1.5">
            <button
              onClick={onOpenManageSenders}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                <UserX className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Muted Senders</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200 font-extrabold">
                {blockedSendersCount}
              </span>
            </button>

            <button
              onClick={onOpenSimulator}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors"
            >
              <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Simulate Telegram Message</span>
            </button>

            <button
              onClick={onOpenWebhookDocs}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Code2 className="w-4 h-4 text-slate-500" />
              <span>Webhook API Spec</span>
            </button>

            <button
              onClick={onResetSeedData}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Sample Round Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
        <p className="font-mono">POST /api/orders</p>
        <p className="mt-0.5 text-slate-500 font-semibold">Gemini 3.6 Flash Parser Active</p>
      </div>
    </aside>
  );
};
