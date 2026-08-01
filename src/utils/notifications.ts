export interface NotificationStatus {
  isSupported: boolean;
  permission: NotificationPermission | 'unsupported';
  isStandalone: boolean;
  isServiceWorkerRegistered: boolean;
  isIOS: boolean;
  isAndroid: boolean;
}

let swRegistration: ServiceWorkerRegistration | null = null;

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('./sw.js');
    swRegistration = reg;
    console.log('Service Worker registered successfully:', reg);
    return reg;
  } catch (err) {
    console.warn('Service Worker registration failed:', err);
    return null;
  }
}

export function getNotificationStatus(): NotificationStatus {
  if (typeof window === 'undefined') {
    return {
      isSupported: false,
      permission: 'unsupported',
      isStandalone: false,
      isServiceWorkerRegistered: false,
      isIOS: false,
      isAndroid: false,
    };
  }

  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);

  const isSupported = 'Notification' in window;
  const permission: NotificationPermission | 'unsupported' = isSupported
    ? Notification.permission
    : 'unsupported';

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true;

  return {
    isSupported,
    permission,
    isStandalone,
    isServiceWorkerRegistered: !!swRegistration || !!navigator.serviceWorker?.controller,
    isIOS,
    isAndroid,
  };
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    throw new Error('Notifications are not supported on this browser/device.');
  }

  // Register service worker first
  await registerServiceWorker();

  const permission = await Notification.requestPermission();

  if (permission === 'granted') {
    // Send initial confirmation notification
    sendSystemNotification('🚨 STAT Monitor Connected', {
      body: 'Notifications enabled! You will now receive system alerts for urgent STAT orders.',
      tag: 'stat-welcome',
    });
  }

  return permission;
}

export async function sendSystemNotification(
  title: string,
  options?: NotificationOptions
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    if (!swRegistration && 'serviceWorker' in navigator) {
      swRegistration = await navigator.serviceWorker.ready.catch(() => null);
    }

    if (swRegistration && 'showNotification' in swRegistration) {
      await swRegistration.showNotification(title, {
        icon: 'siren.svg',
        badge: 'siren.svg',
        vibrate: [300, 100, 300, 100, 300],
        requireInteraction: true,
        tag: options?.tag || 'stat-alert',
        renotify: true,
        ...options,
      } as NotificationOptions & { vibrate?: number[]; requireInteraction?: boolean; renotify?: boolean });
      return true;
    }

    // Fallback to standard Notification API
    new Notification(title, {
      icon: '/siren.svg',
      badge: '/siren.svg',
      ...options,
    });
    return true;
  } catch (err) {
    console.warn('Error sending system notification:', err);
    return false;
  }
}
