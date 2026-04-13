// Service Worker — obsługuje powiadomienia push z głównej apki
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', () => self.clients.claim())

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SHOW_REMINDER') {
    self.registration.showNotification(event.data.title, {
      body: event.data.body,
      icon: '/apple-touch-icon.png',
      badge: '/favicon-32.png',
      tag: 'pushup-reminder',
      renotify: true,
    })
  }
})
