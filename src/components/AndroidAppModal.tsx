import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  CheckCircle2,
  Bell,
  Sun,
  ShieldCheck,
  X,
  Download,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Volume2,
} from 'lucide-react';
import {
  enableScreenWakeLock,
  disableScreenWakeLock,
  isWakeLockActive,
  requestNotificationPermission,
  triggerHapticVibration,
} from '../utils/wakeLock';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidAppModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [wakeLockEnabled, setWakeLockEnabled] = useState(() => isWakeLockActive());
  const [notificationState, setNotificationState] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if app is running as standalone PWA
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        'To install STAT Monitor on Android:\n1. Tap the 3 dots menu (⋮) in Chrome.\n2. Tap "Add to Home screen" or "Install app".'
      );
    }
  };

  const handleToggleWakeLock = async () => {
    if (wakeLockEnabled) {
      await disableScreenWakeLock();
      setWakeLockEnabled(false);
    } else {
      const success = await enableScreenWakeLock();
      if (success) {
        setWakeLockEnabled(true);
      } else {
        alert('Screen Wake Lock is not supported or was blocked by device settings.');
      }
    }
  };

  const handleEnableNotifications = async () => {
    const perm = await requestNotificationPermission();
    setNotificationState(perm);
    if (perm === 'granted') {
      triggerHapticVibration([300, 100, 300]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-white/20 backdrop-blur text-white shrink-0">
              <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Android App & Lock Screen Mode</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-white text-emerald-800 uppercase">
                  PWA Ready
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-emerald-100 font-medium">
                Keep alarms sounding even when the phone is idle or screen is locked.
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

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* 1. Install as Android Native App */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Install as Android App</span>
                  {isInstalled && (
                    <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Installed
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                  Adds STAT Monitor to your Android home screen as a standalone full-screen app.
                </p>
              </div>
            </div>

            <button
              onClick={handleInstallClick}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all shrink-0 flex items-center justify-center gap-1.5"
            >
              <Smartphone className="w-4 h-4" />
              <span>{isInstalled ? 'App Ready' : 'Install to Home Screen'}</span>
            </button>
          </div>

          {/* 2. Screen Always-On (Wake Lock) Toggle */}
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Keep Screen Awake (Always-On)
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                  Prevents Android from turning off the display while station monitoring is active.
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleWakeLock}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 ${
                wakeLockEnabled
                  ? 'bg-amber-500 text-white ring-2 ring-amber-400/50'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300'
              }`}
            >
              {wakeLockEnabled ? 'Active (Screen On)' : 'Enable Always-On'}
            </button>
          </div>

          {/* 3. System Lock Screen Notifications & Vibration */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 mt-0.5">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Lock Screen Notifications & Haptic Vibration
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                  Sends system sound notifications and phone vibration when new STAT orders arrive.
                </p>
              </div>
            </div>

            <button
              onClick={handleEnableNotifications}
              disabled={notificationState === 'granted'}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 ${
                notificationState === 'granted'
                  ? 'bg-emerald-600 text-white cursor-default'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {notificationState === 'granted' ? 'Allowed ✓' : 'Allow Notifications'}
            </button>
          </div>

          {/* 4. Critical Android Battery Optimization Tip */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Recommended Android Setting for Uninterrupted Alarms:</span>
            </h4>
            <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 pl-6 list-disc">
              <p>
                To prevent Android OS from putting the app to sleep when screen turns off:
              </p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Go to Android Settings ➔ Apps ➔ STAT Monitor ➔ Battery ➔ Select &quot;Unrestricted&quot;.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>PWA & Service Worker enabled for background mobile alerts.</span>
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 transition-all shadow-xs active:scale-95 shrink-0"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
