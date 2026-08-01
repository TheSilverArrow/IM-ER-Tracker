import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  Smartphone,
  Share,
  PlusSquare,
  CheckCircle2,
  AlertTriangle,
  X,
  Play,
  HelpCircle,
  ChevronRight,
  ShieldAlert,
  Info,
  ExternalLink,
} from 'lucide-react';
import {
  getNotificationStatus,
  requestNotificationPermission,
  sendSystemNotification,
  NotificationStatus,
} from '../utils/notifications';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const PwaNotificationModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<NotificationStatus>(getNotificationStatus);
  const [isRequesting, setIsRequesting] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStatus(getNotificationStatus());
      setErrorMsg(null);
      setTestSent(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    setErrorMsg(null);
    try {
      const perm = await requestNotificationPermission();
      setStatus(getNotificationStatus());
      if (perm === 'denied') {
        setErrorMsg(
          'Notification permission was blocked in your browser. Please tap the lock icon in your address bar or browser site settings to allow notifications.'
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to request notification permission');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSendTestNotification = async () => {
    const success = await sendSystemNotification('🚨 STAT ORDER ALERT (TEST)', {
      body: 'This is a test notification from STAT Monitor! If you see this, lockscreen alerts are working.',
      tag: 'stat-test-banner',
    });
    if (success) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 4000);
    } else {
      setErrorMsg('Could not send system notification. Make sure permissions are granted first.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur text-white shrink-0">
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>PWA & System Notifications</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-rose-100 font-medium">
                Enable lockscreen alerts & see STAT Monitor in your phone settings.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 space-y-4">
          {/* Why it's not showing explanation banner */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                Why is the app not showing in phone Notification Settings?
              </p>
              <p className="leading-relaxed">
                Mobile operating systems (iOS & Android) <strong>hide web apps and PWAs</strong> from system Notification Settings until two conditions are met:
              </p>
              <ol className="list-decimal list-inside space-y-0.5 font-medium text-slate-800 dark:text-slate-200 pt-1">
                <li>Permission is explicitly requested in the app (button below).</li>
                <li>The app is added to your mobile <strong>Home Screen</strong> (required for iOS).</li>
              </ol>
            </div>
          </div>

          {/* Diagnostic Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Permission Card */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Notification Permission
              </span>
              <div className="flex items-center gap-2">
                {status.permission === 'granted' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Granted</span>
                  </>
                ) : status.permission === 'denied' ? (
                  <>
                    <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Blocked</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Not Prompted Yet</span>
                  </>
                )}
              </div>
            </div>

            {/* Display Mode Card */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                PWA Home Screen
              </span>
              <div className="flex items-center gap-2">
                {status.isStandalone ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Installed PWA</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Browser Tab</span>
                  </>
                )}
              </div>
            </div>

            {/* Service Worker Card */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Background Engine
              </span>
              <div className="flex items-center gap-2">
                {status.isServiceWorkerRegistered ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Active SW</span>
                  </>
                ) : (
                  <>
                    <Info className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-500">Ready to Register</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Error Message if any */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Direct Actions */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 shadow-md">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <Bell className="w-4 h-4" />
              <span>Step 1: Request Permission & Test</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={isRequesting || status.permission === 'granted'}
                onClick={handleRequestPermission}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs ${
                  status.permission === 'granted'
                    ? 'bg-emerald-600 text-white cursor-default'
                    : 'bg-rose-600 hover:bg-rose-700 active:scale-95 text-white'
                }`}
              >
                {status.permission === 'granted' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Permission Granted</span>
                  </>
                ) : (
                  <>
                    <BellRing className={`w-4 h-4 ${isRequesting ? 'animate-spin' : ''}`} />
                    <span>{isRequesting ? 'Requesting...' : 'Enable System Notifications'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={status.permission !== 'granted'}
                onClick={handleSendTestNotification}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white transition-all flex items-center justify-center gap-2 border border-slate-700"
              >
                <Play className="w-3.5 h-3.5 text-amber-400 fill-current" />
                <span>{testSent ? 'Notification Sent!' : 'Send Test Banner Alert'}</span>
              </button>
            </div>
          </div>

          {/* Platform Specific How-To Instructions */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-indigo-500" />
              <span>Step 2: Add to Home Screen (How to see in Phone Settings)</span>
            </h3>

            {/* iOS Guide */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-black">iOS</span>
                  <span>iPhone & iPad (Safari)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">iOS 16.4+ Required</span>
              </div>
              <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-decimal list-inside pl-1">
                <li>
                  Tap the <Share className="w-3.5 h-3.5 inline text-indigo-500 mx-1" /> <strong>Share button</strong> in Safari toolbar.
                </li>
                <li>
                  Scroll down & tap <PlusSquare className="w-3.5 h-3.5 inline text-indigo-500 mx-1" /> <strong>&quot;Add to Home Screen&quot;</strong>.
                </li>
                <li>Launch <strong>STAT Monitor</strong> directly from your Home Screen.</li>
                <li>Tap <strong>&quot;Enable System Notifications&quot;</strong> above.</li>
                <li className="text-emerald-600 dark:text-emerald-400 font-bold">
                  Now &quot;STAT Monitor&quot; will appear in <u>iOS Settings &gt; Notifications &gt; STAT Monitor</u>!
                </li>
              </ol>
            </div>

            {/* Android Guide */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-black">Android</span>
                  <span>Android (Chrome / Samsung)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">WebAPK Native App</span>
              </div>
              <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-decimal list-inside pl-1">
                <li>Tap Chrome&apos;s <strong>3 Dots Menu (⋮)</strong> top right.</li>
                <li>Tap <strong>&quot;Add to Home screen&quot;</strong> or <strong>&quot;Install app&quot;</strong>.</li>
                <li>Open the app and tap <strong>&quot;Enable System Notifications&quot;</strong>.</li>
                <li className="text-emerald-600 dark:text-emerald-400 font-bold">
                  Now &quot;STAT Monitor&quot; will appear in <u>Android Settings &gt; Apps &gt; STAT Monitor &gt; Notifications</u>!
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>PWA notifications require user permission per web security standards.</span>
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 transition-all shadow-xs shrink-0"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
