// Rejestracja Service Workera i helper do powiadomień-przypomnień

const THROTTLE_MS = 4 * 60 * 60 * 1000 // 4 godziny

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('SW registration failed:', err)
    })
  }
}

export function requestNotificationPermission() {
  if (!('Notification' in window)) return
  if (Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

export function canShowReminder() {
  if (!('Notification' in window)) return false
  if (Notification.permission !== 'granted') return false
  const last = localStorage.getItem('pompki-last-reminder')
  if (last && Date.now() - parseInt(last, 10) < THROTTLE_MS) return false
  return true
}

export function showReminder(title, body) {
  if (!canShowReminder()) return

  localStorage.setItem('pompki-last-reminder', String(Date.now()))

  // Próbuj przez Service Worker (działa w tle PWA)
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_REMINDER',
      title,
      body,
    })
    return
  }

  // Fallback — zwykłe Notification API (tylko foreground)
  try {
    new Notification(title, {
      body,
      icon: '/apple-touch-icon.png',
      tag: 'pushup-reminder',
    })
  } catch (e) {
    console.warn('Notification failed:', e)
  }
}
