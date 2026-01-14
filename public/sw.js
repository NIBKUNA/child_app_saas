/**
 * Zarada Service Worker
 * Handles background notifications and caching strategies.
 */

self.addEventListener('install', (event) => {
    self.skipWaiting();
    console.log('[SW] Installed');
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
    console.log('[SW] Activated');
});

// Handle messages from client (AppLayout.tsx)
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const { title, body } = event.data;
        self.registration.showNotification(title, {
            body: body,
            icon: '/favicon.ico', // Fallback icon
            vibrate: [200, 100, 200],
            tag: 'zarada-alert',
            data: {
                url: '/app/consultations'
            }
        });
    }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Focus existing window if open
            for (const client of clientList) {
                if (client.url.includes('/app/consultations') && 'focus' in client) {
                    return client.focus();
                }
            }
            // Open new window if not open
            if (clients.openWindow) {
                return clients.openWindow('/app/consultations');
            }
        })
    );
});
