/**
 * Rūḥ — Service Worker (network-first shell)
 *
 * Stays registered so browsers recognise the app as an installable PWA
 * and can attach it to the manifest/home-screen experience.
 *
 * Uses a network-first strategy with a same-request fallback. This keeps
 * the shell fresh while still allowing the browser to satisfy a request
 * from its own HTTP cache if the user is briefly offline.
 *
 * localStorage (all user data) is never touched.
 */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  // Clear any legacy caches from the old self-destruct SW, then claim clients.
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

self.addEventListener('push', event => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch (_) {
    payload = {
      body: event.data ? event.data.text() : '',
    };
  }

  const title = payload.title || 'Ruh';
  const notificationOptions = {
    body: payload.body || '',
    icon: payload.icon || '/ruh-icon-192.png',
    badge: payload.badge || '/icons/web/icon-192.png',
    tag: payload.tag || payload.id || 'ruh-reminder',
    renotify: true,
    data: {
      url: payload.url || '/?screen=home',
      screen: payload.screen || 'home',
      reminderId: payload.id || null,
    },
  };

  event.waitUntil(self.registration.showNotification(title, notificationOptions));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const targetUrl = event.notification?.data?.url || '/?screen=home';
  const targetScreen = event.notification?.data?.screen || 'home';
  const reminderId = event.notification?.data?.reminderId || null;

  event.waitUntil((async () => {
    const windowClients = await clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });

    for (const client of windowClients) {
      try {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin !== self.location.origin) continue;
      } catch (_) {
        continue;
      }

      if ('focus' in client) {
        await client.focus();
      }

      if ('navigate' in client) {
        try {
          await client.navigate(targetUrl);
        } catch (_) {
          // Ignore navigate failures and fall back to postMessage.
        }
      }

      client.postMessage({
        type: 'OPEN_SCREEN',
        screen: targetScreen,
        reminderId,
        url: targetUrl,
      });
      return;
    }

    await clients.openWindow(targetUrl);
  })());
});
