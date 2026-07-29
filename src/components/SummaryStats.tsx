import React from 'react';
import { SummaryStats } from '../types';
import { Clock, Activity, CheckCircle2, ClipboardList } from 'lucide-react';

interface Props {
  stats: SummaryStats;
  onSelectStatus?: (status: string) => void;
  activeStatus?: string;
}

export const SummaryStatsWidget: React.FC<Props> = ({
  stats,
  onSelectStatus,
  activeStatus = 'All',
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      {/* Total Pending */}
      <div
        onClick={() => onSelectStatus?.('Pending')}
        className={`cursor-pointer transition-all duration-200 rounded-2xl p-4 border bg-white dark:bg-slate-900 ${
          activeStatus === 'Pending'
            ? 'ring-2 ring-amber-500 border-amber-500 shadow-md'
            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Pending Approval
          </span>
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {stats.totalPending}
          </span>
          <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Triage</span>
        </div>
      </div>

      {/* In Progress */}
      <div
        onClick={() => onSelectStatus?.('In Progress')}
        className={`cursor-pointer transition-all duration-200 rounded-2xl p-4 border bg-white dark:bg-slate-900 ${
          activeStatus === 'In Progress'
            ? 'ring-2 ring-blue-500 border-blue-500 shadow-md'
            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            In Progress
          </span>
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {stats.inProgress}
          </span>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Active</span>
        </div>
      </div>

      {/* Done */}
      <div
        onClick={() => onSelectStatus?.('Done')}
        className={`cursor-pointer transition-all duration-200 rounded-2xl p-4 border bg-white dark:bg-slate-900 ${
          activeStatus === 'Done'
            ? 'ring-2 ring-emerald-500 border-emerald-500 shadow-md'
            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Completed
          </span>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {stats.completedToday}
          </span>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Fulfilled</span>
        </div>
      </div>
    </div>
  );
};
