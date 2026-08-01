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
  return (
    <div className="space-y-2 mb-3 sm:hidden">
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
          placeholder="Search patient, bed, doctor, items..."
          className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
        />
        {filters.searchQuery && (
          <button
            onClick={() => onFilterChange({ searchQuery: '' })}
            className="absolute right-2.5 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter result count summary line */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-0.5">
        <span>
          Showing <strong className="text-slate-800 dark:text-slate-200">{filteredCount}</strong> of{' '}
          <strong className="text-slate-800 dark:text-slate-200">{totalCount}</strong> tiles
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
            Reset
          </button>
        )}
      </div>
    </div>
  );
};
