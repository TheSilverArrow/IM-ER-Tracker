import React from 'react';
import { LayoutDashboard, Bot, Plus, RefreshCw } from 'lucide-react';

interface Props {
  onOpenNewOrder: () => void;
  onOpenSimulator: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  activeTab: 'dashboard' | 'simulator';
  setActiveTab: (tab: 'dashboard' | 'simulator') => void;
  pendingCount: number;
}

export const BottomNav: React.FC<Props> = ({
  onOpenNewOrder,
  onOpenSimulator,
  onRefresh,
  isRefreshing,
  activeTab,
  setActiveTab,
  pendingCount,
}) => {
  return (
    <>
      {/* Floating Action Button (+ Log Order) for Mobile */}
      <div className="fixed bottom-20 right-4 z-40 sm:hidden">
        <button
          onClick={onOpenNewOrder}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-600/40 active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          <span>New Order</span>
        </button>
      </div>

      {/* Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 lg:hidden px-2 py-1.5 shadow-lg">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {/* Dashboard Tab */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'dashboard'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <div className="relative">
              <LayoutDashboard className="w-5 h-5" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-2 px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-amber-500 text-white">
                  {pendingCount}
                </span>
              )}
            </div>
            <span className="mt-1 text-[10px]">Dashboard</span>
          </button>

          {/* Simulate Telegram Webhook Tab */}
          <button
            onClick={() => {
              setActiveTab('simulator');
              onOpenSimulator();
            }}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'simulator'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <Bot className="w-5 h-5 text-indigo-500" />
            <span className="mt-1 text-[10px]">Telegram AI</span>
          </button>

          {/* Refresh Action */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex flex-col items-center justify-center p-1.5 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
            <span className="mt-1 text-[10px]">Sync</span>
          </button>
        </div>
      </nav>
    </>
  );
};
