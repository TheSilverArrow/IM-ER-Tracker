// STAT Monitor Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = { title: '🚨 STAT ORDER ALERT', body: 'New Critical STAT Medical Order Received!' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || 'New STAT Order Requires Immediate Attention!',
    icon: 'siren.svg',
    badge: 'siren.svg',
    vibrate: [300, 100, 300, 100, 300],
    data: data.url || './',
    requireInteraction: true,
    tag: 'stat-alert',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(data.title || '🚨 STAT ORDER ALERT', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data || './');
      }
    })
  );
});
