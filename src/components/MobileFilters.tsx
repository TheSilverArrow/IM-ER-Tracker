import React from 'react';
import { FilterState, OrderStatus } from '../types';
import { Search, X, SlidersHorizontal } from 'lucide-react';

interface Props {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  totalCount: number;
  filteredCount: number;
}

export const MobileFilters: React.FC<Props> = ({
  filters,
  onFilterChange,
  totalCount,
  filteredCount,
}) => {
  const statusOptions: (OrderStatus | 'All')[] = ['All', 'Pending', 'In Progress', 'Done'];

  return (
    <div className="space-y-3 mb-4">
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
          placeholder="Search by Patient Name, Bed, Doctor, Case #..."
          className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
        />
        {filters.searchQuery && (
          <button
            onClick={() => onFilterChange({ searchQuery: '' })}
            className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Horizontal Scrolling Status Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none no-scrollbar text-xs font-semibold">
        <div className="flex items-center gap-1 text-slate-400 font-medium whitespace-nowrap pl-0.5">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filter:</span>
        </div>
        {statusOptions.map((st) => (
          <button
            key={st}
            onClick={() => onFilterChange({ status: st })}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full transition-all border font-bold ${
              filters.status === st
                ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            {st === 'All' ? 'All Tiles' : st}
          </button>
        ))}
      </div>

      {/* Filter result count summary line */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          Showing <strong className="text-slate-800 dark:text-slate-200">{filteredCount}</strong> of{' '}
          <strong className="text-slate-800 dark:text-slate-200">{totalCount}</strong> patient tiles
        </span>
        {(filters.status !== 'All' || filters.searchQuery) && (
          <button
            onClick={() =>
              onFilterChange({
                status: 'All',
                searchQuery: '',
              })
            }
            className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
};
