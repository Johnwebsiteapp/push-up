// Service Worker — obsługuje powiadomienia (lokalne + web push)
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', () => self.clients.claim())

// Wiadomości z głównej apki (lokalne przypomnienia)
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

// Web Push — powiadomienia przychodzące nawet gdy apka zamknięta
self.addEventListener('push', (event) => {
  let data = { title: 'POMPKI ⚡', body: 'Nie zapomnij o pompkach!' }
  if (event.data) {
    try {
      data = event.data.json()
    } catch (e) {
      data.body = event.data.text()
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'POMPKI ⚡', {
      body: data.body || 'Nie zapomnij o pompkach!',
      icon: '/apple-touch-icon.png',
      badge: '/favicon-32.png',
      tag: data.tag || 'pompki-push',
      renotify: true,
      data: { url: data.url || '/' },
    })
  )
})

// Klik w powiadomienie → otwiera apkę
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})
