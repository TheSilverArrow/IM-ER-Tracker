import React, { useState } from 'react';
import { Siren, Bot, RefreshCw, UserX, ChevronDown, Wrench, Database, BellRing, Volume2, Smartphone } from 'lucide-react';

interface Props {
  onOpenNewOrder?: () => void;
  onOpenSimulator: () => void;
  onOpenManageSenders: () => void;
  onOpenSupabaseSettings?: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  autoRefreshEnabled: boolean;
  onToggleAutoRefresh: () => void;
  blockedSendersCount?: number;
  onTestStatSound?: () => void;
  onOpenSoundSelector?: () => void;
  onOpenPwaNotifications?: () => void;
}

export const Header: React.FC<Props> = ({
  onOpenSimulator,
  onOpenManageSenders,
  onOpenSupabaseSettings,
  onRefresh,
  isRefreshing,
  autoRefreshEnabled,
  onToggleAutoRefresh,
  blockedSendersCount = 0,
  onTestStatSound,
  onOpenSoundSelector,
  onOpenPwaNotifications,
}) => {
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-1.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Title */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-rose-600 to-amber-600 text-white shadow-md shadow-rose-500/20 shrink-0">
            <Siren className="w-4 h-4 sm:w-6 sm:h-6 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap sm:flex-wrap">
              <h1 className="text-sm sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                <span className="sm:hidden">STAT Monitor</span>
                <span className="hidden sm:inline">STAT Monitor</span>
              </h1>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse shrink-0">
                <BellRing className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-600 dark:text-rose-400" />
                <span className="hidden xs:inline sm:inline">STAT Active</span>
                <span className="xs:hidden sm:hidden">Active</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Only <strong>&quot;STAT&quot;</strong> orders alert and display on screen.
            </p>
          </div>
        </div>

        {/* Action Controls Header */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div className="flex items-center rounded-lg sm:rounded-xl bg-rose-600 p-0.5 shadow-xs text-white">
            {onTestStatSound && (
              <button
                onClick={onTestStatSound}
                className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-l-md sm:rounded-l-lg text-[10px] sm:text-xs font-bold hover:bg-rose-700 transition-all active:scale-95"
                title="Test STAT Alarm Audio Tone"
              >
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Test Sound</span>
                <span className="sm:hidden">Test</span>
              </button>
            )}
            {onOpenSoundSelector && (
              <button
                onClick={onOpenSoundSelector}
                className="px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-r-md sm:rounded-r-lg text-[10px] sm:text-xs font-bold bg-rose-700 hover:bg-rose-800 border-l border-rose-500/50 transition-all"
                title="Change STAT Alarm Sound Tone"
              >
                <span className="text-[9px] sm:text-[10px] uppercase font-black bg-white/20 px-1 py-0.5 rounded">
                  <span className="hidden sm:inline">Change</span>
                  <span className="sm:hidden">Tone</span>
                </span>
              </button>
            )}
          </div>

          {/* Auto Refresh indicator & manual refresh */}
          <button
            onClick={onToggleAutoRefresh}
            title={autoRefreshEnabled ? 'Auto-refresh active (5s)' : 'Auto-refresh paused'}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              autoRefreshEnabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefreshEnabled ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
            <span>{autoRefreshEnabled ? 'Live Sync (5s)' : 'Sync Paused'}</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Refresh orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Unified Single Tools & Rules Button */}
          <div className="relative">
            <button
              onClick={() => setIsToolsDropdownOpen(!isToolsDropdownOpen)}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all"
            >
              <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Tools & Rules</span>
              <span className="sm:hidden">Tools</span>
              {blockedSendersCount > 0 && (
                <span className="px-1 py-0.1 rounded-full bg-rose-600 text-white font-bold text-[9px] sm:text-[10px]">
                  {blockedSendersCount}
                </span>
              )}
              <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform ${isToolsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isToolsDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-fadeIn text-slate-800 dark:text-slate-200"
                onClick={() => setIsToolsDropdownOpen(false)}
              >
                {onOpenPwaNotifications && (
                  <button
                    onClick={onOpenPwaNotifications}
                    className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left border-b border-slate-100 dark:border-slate-800 text-rose-600 dark:text-rose-400"
                  >
                    <Smartphone className="w-4 h-4 text-rose-500" />
                    <span>PWA & Lockscreen Settings</span>
                  </button>
                )}

                {onOpenSoundSelector && (
                  <button
                    onClick={onOpenSoundSelector}
                    className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left border-b border-slate-100 dark:border-slate-800"
                  >
                    <Volume2 className="w-4 h-4 text-rose-500" />
                    <span>STAT Sound Selector</span>
                  </button>
                )}

                <button
                  onClick={onOpenManageSenders}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <UserX className="w-4 h-4 text-rose-500" />
                    <span>Muted Senders</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold">
                    {blockedSendersCount}
                  </span>
                </button>

                <button
                  onClick={onOpenSimulator}
                  className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <Bot className="w-4 h-4 text-indigo-500" />
                  <span>Simulate Telegram Order</span>
                </button>
                {onOpenSupabaseSettings && (
                  <button
                    onClick={onOpenSupabaseSettings}
                    className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left border-t border-slate-100 dark:border-slate-800"
                  >
                    <Database className="w-4 h-4 text-emerald-500" />
                    <span>Supabase Live Config</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
