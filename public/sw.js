/**
 * Zarada Service Worker v2
 * - Offline shell caching (App Shell strategy)
 * - Runtime cache for API/assets
 * - SW update management with client notification
 */

const CACHE_VERSION = 'zarada-v2';
const OFFLINE_URL = '/offline.html';

// App Shell: 오프라인에서도 앱이 열리도록 캐시할 핵심 파일들
const APP_SHELL = [
    '/',
    '/offline.html',
    '/favicon.ico',
    '/favicon.png',
    '/pwa-192x192.png',
    '/pwa-512x512.png',
    '/manifest.json',
];

// ─── INSTALL ────────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then((cache) => {
            console.log('[SW] Caching app shell');
            // addAll은 하나라도 실패하면 전체 실패하므로, 개별 처리
            return Promise.allSettled(
                APP_SHELL.map((url) =>
                    cache.add(url).catch((err) => {
                        console.warn(`[SW] Failed to cache: ${url}`, err);
                    })
                )
            );
        })
    );
    // 새 SW가 즉시 활성화되도록 (업데이트 시 대기하지 않음)
    self.skipWaiting();
    console.log('[SW] Installed');
});

// ─── ACTIVATE ───────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_VERSION)
                    .map((name) => {
                        console.log(`[SW] Deleting old cache: ${name}`);
                        return caches.delete(name);
                    })
            );
        }).then(() => {
            // 새 SW가 모든 클라이언트를 즉시 컨트롤
            return self.clients.claim();
        }).then(() => {
            // 모든 열린 탭에 업데이트 알림 전송
            return self.clients.matchAll({ type: 'window' }).then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
                });
            });
        })
    );
    console.log('[SW] Activated');
});

// ─── FETCH (Network-first for navigation, Cache-first for assets) ───
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip Supabase API, analytics, chrome-extension, etc.
    const url = new URL(request.url);
    if (
        url.origin !== self.location.origin ||
        url.pathname.startsWith('/auth/') ||
        url.pathname.startsWith('/rest/') ||
        url.pathname.startsWith('/realtime/')
    ) {
        return;
    }

    // HTML navigation requests → Network-first with offline fallback
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // 성공하면 캐시에 저장 (SPA이므로 index.html)
                    const responseClone = response.clone();
                    caches.open(CACHE_VERSION).then((cache) => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // 오프라인이면 캐시된 페이지 또는 offline.html 반환
                    return caches.match(request).then((cached) => {
                        return cached || caches.match(OFFLINE_URL);
                    });
                })
        );
        return;
    }

    // Static assets (JS, CSS, images, fonts) → Stale-while-revalidate
    if (
        request.destination === 'script' ||
        request.destination === 'style' ||
        request.destination === 'image' ||
        request.destination === 'font'
    ) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                const fetchPromise = fetch(request)
                    .then((networkResponse) => {
                        // 유효한 응답만 캐시
                        if (networkResponse && networkResponse.status === 200) {
                            const responseClone = networkResponse.clone();
                            caches.open(CACHE_VERSION).then((cache) => {
                                cache.put(request, responseClone);
                            });
                        }
                        return networkResponse;
                    })
                    .catch(() => cachedResponse);

                return cachedResponse || fetchPromise;
            })
        );
        return;
    }
});

// ─── WEB PUSH (서버에서 받는 실제 푸시) ────────────
self.addEventListener('push', (event) => {
    if (!event.data) return;

    let payload;
    try {
        payload = event.data.json();
    } catch {
        payload = {
            title: '자라다 알림',
            body: event.data.text(),
            url: '/',
        };
    }

    const options = {
        body: payload.body || '',
        icon: '/pwa-192x192.png',
        badge: '/favicon.png',
        vibrate: [200, 100, 200],
        tag: payload.tag || 'zarada-push',
        renotify: true,
        data: {
            url: payload.url || '/',
        },
    };

    event.waitUntil(
        self.registration.showNotification(payload.title || '자라다', options)
    );
});

// ─── PUSH NOTIFICATIONS (클라이언트에서 보내는 로컬 알림) ────
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const { title, body } = event.data;
        self.registration.showNotification(title, {
            body: body,
            icon: '/pwa-192x192.png',
            badge: '/favicon.png',
            vibrate: [200, 100, 200],
            tag: 'zarada-alert',
            renotify: true,
            data: {
                url: '/app/consultations',
            },
        });
    }

    // 클라이언트에서 캐시 초기화 요청
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.keys().then((names) => {
            names.forEach((name) => caches.delete(name));
        });
    }
});

// ─── NOTIFICATION CLICK ─────────────────────────
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients
            .matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // 이미 열린 탭이 있으면 포커스
                for (const client of clientList) {
                    if ('focus' in client) {
                        client.navigate(event.notification.data?.url || '/app/consultations');
                        return client.focus();
                    }
                }
                // 없으면 새 창 열기
                if (clients.openWindow) {
                    return clients.openWindow(event.notification.data?.url || '/app/consultations');
                }
            })
    );
});
