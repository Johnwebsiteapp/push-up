// Daily reminder Edge Function — wysyła powiadomienia push do użytkowników
// którzy jeszcze nie osiągnęli swojego celu dziennego.
// Wywoływana przez pg_cron codziennie o 18:00.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import webpush from 'npm:web-push@3.6.7'

const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT =
  Deno.env.get('VAPID_SUBJECT') ||
  'mailto:johnwebsiteapp@users.noreply.github.com'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)

function todayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Wszystkie subskrypcje z nickiem i celem dziennym
  const { data: subs, error: subsErr } = await supabase
    .from('push_subscriptions')
    .select('user_id, endpoint, p256dh, auth')

  if (subsErr) {
    return new Response(JSON.stringify({ error: subsErr.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const today = todayISO()
  let sent = 0
  let skipped = 0
  let removed = 0

  for (const sub of subs || []) {
    // Pobierz cel dzienny użytkownika
    const { data: profile } = await supabase
      .from('profiles')
      .select('daily_goal, nick')
      .eq('user_id', sub.user_id)
      .maybeSingle()

    const dailyGoal = profile?.daily_goal ?? 30
    if (dailyGoal <= 0) {
      skipped++
      continue
    }

    // Pompki dzisiaj
    const { data: workouts } = await supabase
      .from('workouts')
      .select('count')
      .eq('user_id', sub.user_id)
      .eq('performed_at', today)

    const todayTotal = (workouts || []).reduce((s, w) => s + w.count, 0)

    if (todayTotal >= dailyGoal) {
      skipped++
      continue
    }

    const remaining = dailyGoal - todayTotal
    const payload = JSON.stringify({
      title: 'POMPKI ⚡',
      body:
        todayTotal === 0
          ? `Nie zapomnij dziś o pompkach! Cel: ${dailyGoal}`
          : `Zostało Ci ${remaining} pompek do celu dziennego!`,
      url: '/',
      tag: 'daily-reminder',
    })

    const subscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    }

    try {
      await webpush.sendNotification(subscription, payload)
      sent++
    } catch (e) {
      const statusCode = (e as { statusCode?: number }).statusCode
      // 404/410 = subskrypcja nieważna, usuń z bazy
      if (statusCode === 404 || statusCode === 410) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', sub.endpoint)
        removed++
      } else {
        console.error('Push failed:', sub.user_id, statusCode, (e as Error).message)
      }
    }
  }

  return new Response(
    JSON.stringify({ ok: true, sent, skipped, removed, total: subs?.length ?? 0 }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
