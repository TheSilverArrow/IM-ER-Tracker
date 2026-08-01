// Android Mobile Wake Lock, Haptic Vibration & Background Notification Utilities

let wakeLockSentinel: WakeLockSentinel | null = null;

/**
 * Request Screen Wake Lock so Android phone display stays on (Always-On Display)
 */
export async function enableScreenWakeLock(): Promise<boolean> {
  if (typeof window === 'undefined' || !('wakeLock' in navigator)) {
    console.warn('Wake Lock API not supported on this browser/device.');
    return false;
  }
  try {
    wakeLockSentinel = await navigator.wakeLock.request('screen');
    wakeLockSentinel.addEventListener('release', () => {
      wakeLockSentinel = null;
    });
    return true;
  } catch (err) {
    console.warn('Failed to acquire Wake Lock:', err);
    return false;
  }
}

/**
 * Release active Screen Wake Lock
 */
export async function disableScreenWakeLock(): Promise<void> {
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
    } catch (err) {
      console.warn('Error releasing Wake Lock:', err);
    }
    wakeLockSentinel = null;
  }
}

/**
 * Check if Screen Wake Lock is currently active
 */
export function isWakeLockActive(): boolean {
  return wakeLockSentinel !== null && !wakeLockSentinel.released;
}

/**
 * Trigger Android Phone Haptic Vibration for Emergency STAT Alerts
 */
export function triggerHapticVibration(pattern: number[] = [800, 200, 800, 200, 1000]): void {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      console.warn('Vibration API error:', e);
    }
  }
}

/**
 * Request System Notification Permissions (Required for background alerts when phone screen is off/locked)
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return 'denied';
  }
}

/**
 * Trigger System Notification with sound/vibration info when phone is backgrounded or screen locked
 */
export function sendBackgroundStatNotification(patientName: string, bedNumber: string, itemSummary: string): void {
  const title = `🚨 STAT ALERT: ${patientName.toUpperCase()} (${bedNumber})`;
  const body = `Item: ${itemSummary || 'Emergency Order'} - Tap to view patient order immediately.`;

  // 1. Try Service Worker Notification (Works better on Android background)
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'STAT_ALERT',
      title,
      body,
    });
  } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    // 2. Fallback to standard Notification API
    try {
      new Notification(title, {
        body,
        icon: '/siren.svg',
        tag: 'stat-alert-' + Date.now(),
        requireInteraction: true,
      });
    } catch (e) {
      console.warn('Direct notification error:', e);
    }
  }

  // 3. Always trigger vibration on mobile
  triggerHapticVibration();
}
