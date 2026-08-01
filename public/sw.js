// Service Worker for STAT Clinical Monitor Android PWA

const CACHE_NAME = 'stat-monitor-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle background notification triggers
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// Listen for messages from frontend to play alarm / show notification
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'STAT_ALERT') {
    const { title, body } = event.data;
    if (self.registration && self.registration.showNotification) {
      self.registration.showNotification(title || '🚨 EMERGENCY STAT ORDER!', {
        body: body || 'New high priority STAT order arrived!',
        icon: '/siren.svg',
        badge: '/siren.svg',
        vibrate: [800, 200, 800, 200, 1000],
        tag: 'stat-alert-' + Date.now(),
        renotify: true,
        requireInteraction: true,
        data: { url: '/' }
      });
    }
  }
});
