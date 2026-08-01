import React from 'react';
import { SummaryStats } from '../types';
import { Clock, Activity, CheckCircle2, Layers } from 'lucide-react';

interface Props {
  stats: SummaryStats;
  onSelectStatus?: (status: string) => void;
  activeStatus?: string;
  totalCount?: number;
}

export const SummaryStatsWidget: React.FC<Props> = ({
  stats,
  onSelectStatus,
  activeStatus = 'All',
  totalCount = 0,
}) => {
  return (
    <div className="grid grid-cols-4 gap-1.5 sm:flex sm:flex-wrap sm:gap-2 mb-3 sm:mb-4">
      {/* All Orders Pill */}
      <button
        type="button"
        onClick={() => onSelectStatus?.('All')}
        className={`px-1 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center sm:justify-start gap-0.5 sm:gap-2 border ${
          activeStatus === 'All'
            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
        <span className="hidden sm:inline">All Orders</span>
        <span className="sm:hidden">All</span>
        <span
          className={`px-1 py-0.1 sm:px-1.5 sm:py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold shrink-0 ${
            activeStatus === 'All'
              ? 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900'
              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          {totalCount}
        </span>
      </button>

      {/* Pending Counter */}
      <button
        type="button"
        onClick={() => onSelectStatus?.('Pending')}
        className={`px-1 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center sm:justify-start gap-0.5 sm:gap-2 border ${
          activeStatus === 'Pending'
            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
            : 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800'
        }`}
      >
        <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
        <span>Pending</span>
        <span
          className={`px-1 py-0.1 sm:px-1.5 sm:py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold shrink-0 ${
            activeStatus === 'Pending'
              ? 'bg-white text-amber-800'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
          }`}
        >
          {stats.totalPending}
        </span>
      </button>

      {/* In Progress Counter */}
      <button
        type="button"
        onClick={() => onSelectStatus?.('In Progress')}
        className={`px-1 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center sm:justify-start gap-0.5 sm:gap-2 border ${
          activeStatus === 'In Progress'
            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
            : 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800'
        }`}
      >
        <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500 dark:text-blue-400 animate-pulse shrink-0" />
        <span className="hidden sm:inline">In Progress</span>
        <span className="sm:hidden">Progress</span>
        <span
          className={`px-1 py-0.1 sm:px-1.5 sm:py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold shrink-0 ${
            activeStatus === 'In Progress'
              ? 'bg-white text-blue-800'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
          }`}
        >
          {stats.inProgress}
        </span>
      </button>

      {/* Completed Counter */}
      <button
        type="button"
        onClick={() => onSelectStatus?.('Done')}
        className={`px-1 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center sm:justify-start gap-0.5 sm:gap-2 border ${
          activeStatus === 'Done'
            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
            : 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800'
        }`}
      >
        <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
        <span className="hidden sm:inline">Completed</span>
        <span className="sm:hidden">Done</span>
        <span
          className={`px-1 py-0.1 sm:px-1.5 sm:py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold shrink-0 ${
            activeStatus === 'Done'
              ? 'bg-white text-emerald-800'
              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
          }`}
        >
          {stats.completedToday}
        </span>
      </button>
    </div>
  );
};
