import React, { useState, useEffect } from 'react';
import { X, Database, Check, ShieldCheck, RefreshCw, KeyRound, RotateCcw } from 'lucide-react';
import {
  getSupabaseConfig,
  getEnvSupabaseConfig,
  saveSupabaseConfig,
  clearLocalSupabaseConfig,
  resetSupabaseClient,
  isUsingEnvDefaults,
} from '../supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

export const SupabaseSettingsModal: React.FC<Props> = ({ isOpen, onClose, onConnected }) => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [usingEnv, setUsingEnv] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = getSupabaseConfig();
      setUrl(current.url);
      setKey(current.key);
      setSavedSuccess(false);

      const envInfo = isUsingEnvDefaults();
      setUsingEnv(envInfo.isEnvUrl || envInfo.isEnvKey);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(url, key);
    resetSupabaseClient();
    setSavedSuccess(true);

    if (onConnected) {
      onConnected();
    }

    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  const handleResetToDefaults = () => {
    clearLocalSupabaseConfig();
    const envConfig = getEnvSupabaseConfig();
    setUrl(envConfig.url);
    setKey(envConfig.key);
    resetSupabaseClient();
    setUsingEnv(true);
    setSavedSuccess(true);

    if (onConnected) {
      onConnected();
    }

    setTimeout(() => {
      setSavedSuccess(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Supabase Realtime Database
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connect your live Telegram userbot orders table
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <div className="font-bold flex items-center justify-between text-slate-800 dark:text-slate-100">
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Live Render + Supabase Pipeline</span>
              </div>
              {usingEnv && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1">
                  <KeyRound className="w-3 h-3 text-emerald-600" />
                  GitHub Secrets / Env Active
                </span>
              )}
            </div>
            <p>
              Your Python userbot sends Telegram messages directly to Supabase. Environment variables <strong>VITE_SUPABASE_URL</strong> &amp; <strong>VITE_SUPABASE_ANON_KEY</strong> are loaded by default.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Supabase Project URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-project-id.supabase.co"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Supabase Anon Public Key
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Provide these in GitHub Secrets as <code>VITE_SUPABASE_URL</code> &amp; <code>VITE_SUPABASE_ANON_KEY</code> or set them here manually.
            </p>
          </div>

          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Supabase credentials saved & client re-initialized!</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
              title="Clear custom overrides and use GitHub secrets / default .env credentials"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Use Env Defaults</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Save & Connect</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
