// Rejestracja Service Workera, subskrypcja Web Push i helpery do powiadomień
import { supabase } from './supabaseClient'

const THROTTLE_MS = 4 * 60 * 60 * 1000 // 4 godziny dla lokalnych przypomnień

// VAPID public key — safe to commit (publiczny z definicji)
const VAPID_PUBLIC_KEY =
  'BKzGN9DVQwStWkZaV9didVdfkk0V0fMkHHfLsayJ4tEd2XDwLNQXjSK4WfXYIYdAAc0hWE32CgcNmOODyFLaj7k'

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('SW registration failed:', err)
    })
  }
}

export function getNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission // 'default' | 'granted' | 'denied'
}

export function pushSupported() {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

// Konwersja base64url → Uint8Array dla applicationServerKey
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

// Główna funkcja — prosi o zgodę i zapisuje subskrypcję do bazy
export async function enablePushNotifications(userId) {
  if (!pushSupported()) {
    throw new Error('Przeglądarka nie obsługuje powiadomień push')
  }

  // 1. Zgoda (user gesture required na iOS)
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Brak zgody na powiadomienia')
  }

  // 2. Czekamy aż SW będzie ready
  const reg = await navigator.serviceWorker.ready

  // 3. Subscribe push manager
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }

  // 4. Zapis do Supabase
  const p256dhKey = sub.getKey('p256dh')
  const authKey = sub.getKey('auth')
  if (!p256dhKey || !authKey) {
    throw new Error('Błąd pobrania kluczy subskrypcji')
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: sub.endpoint,
      p256dh: arrayBufferToBase64(p256dhKey),
      auth: arrayBufferToBase64(authKey),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,endpoint' }
  )

  if (error) throw new Error('Błąd zapisu subskrypcji: ' + error.message)
  return sub
}

export async function disablePushNotifications(userId) {
  if (!pushSupported()) return
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (sub) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', sub.endpoint)
    await sub.unsubscribe()
  }
}

export async function isSubscribed() {
  if (!pushSupported()) return false
  if (Notification.permission !== 'granted') return false
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    return !!sub
  } catch {
    return false
  }
}

// Lokalne przypomnienia (gdy apka otwarta) — throttle 4h
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

  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_REMINDER',
      title,
      body,
    })
    return
  }

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

// Pozostawiam dla kompatybilności — ale teraz requestNotificationPermission
// jest wewnątrz enablePushNotifications (wymaga user gesture)
export function requestNotificationPermission() {
  // no-op: permission request musi być wywołany z user gesture (np. kliknięcia)
}
