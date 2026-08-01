import React, { useState } from 'react';
import { Siren, Bot, Code2, RefreshCw, UserX, ChevronDown, Wrench, Database, BellRing, Volume2 } from 'lucide-react';

interface Props {
  onOpenNewOrder?: () => void;
  onOpenSimulator: () => void;
  onOpenWebhookDocs: () => void;
  onOpenManageSenders: () => void;
  onOpenSupabaseSettings?: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  autoRefreshEnabled: boolean;
  onToggleAutoRefresh: () => void;
  blockedSendersCount?: number;
  onTestStatSound?: () => void;
}

export const Header: React.FC<Props> = ({
  onOpenSimulator,
  onOpenWebhookDocs,
  onOpenManageSenders,
  onOpenSupabaseSettings,
  onRefresh,
  isRefreshing,
  autoRefreshEnabled,
  onToggleAutoRefresh,
  blockedSendersCount = 0,
  onTestStatSound,
}) => {
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-600 to-amber-600 text-white shadow-md shadow-rose-500/20 shrink-0">
            <Siren className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                STAT Emergency Order Monitor
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse">
                <BellRing className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                STAT Alarm Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Strict Filter: Only exact standalone <strong>&quot;STAT&quot;</strong> orders alert and display on screen.
            </p>
          </div>
        </div>

        {/* Action Controls Header */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onTestStatSound && (
            <button
              onClick={onTestStatSound}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all active:scale-95"
              title="Test STAT Alarm Audio Tone"
            >
              <Volume2 className="w-4 h-4" />
              <span>Test STAT Sound</span>
            </button>
          )}

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
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Refresh orders"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Unified Single Tools & Rules Button */}
          <div className="relative">
            <button
              onClick={() => setIsToolsDropdownOpen(!isToolsDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all"
            >
              <Wrench className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Tools & Rules</span>
              {blockedSendersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-bold text-[10px]">
                  {blockedSendersCount}
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isToolsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isToolsDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-fadeIn text-slate-800 dark:text-slate-200"
                onClick={() => setIsToolsDropdownOpen(false)}
              >
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

                <button
                  onClick={onOpenWebhookDocs}
                  className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <Code2 className="w-4 h-4 text-emerald-500" />
                  <span>Webhook API Docs</span>
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
