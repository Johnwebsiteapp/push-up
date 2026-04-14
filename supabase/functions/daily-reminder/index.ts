// Edge Function — wysyła kontekstowe powiadomienia push.
// Wywoływana przez pg_cron 4 razy dziennie z parametrem ?type=<...>:
//   ?type=morning  → 9:00 CEST (7:00 UTC) — poranne pozdrowienie
//   ?type=midday   → 13:00 CEST (11:00 UTC) — przerwa na pompki / progres
//   ?type=evening  → 21:00 CEST (19:00 UTC) — ostatnia szansa / streak warning
//   ?type=weekly   → Niedziela 20:00 CEST (18:00 UTC) — podsumowanie tygodnia

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

function mondayISO() {
  const now = new Date()
  const todayDay = now.getDay()
  const daysSinceMonday = (todayDay + 6) % 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - daysSinceMonday)
  const y = monday.getFullYear()
  const m = String(monday.getMonth() + 1).padStart(2, '0')
  const d = String(monday.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function calculateStreak(workouts: { performed_at: string }[]) {
  if (!workouts.length) return 0
  const dates = Array.from(new Set(workouts.map((w) => w.performed_at)))
    .sort()
    .reverse()
  if (!dates.length) return 0
  const today = new Date(todayISO())
  const last = new Date(dates[0])
  const diffFromToday = Math.round(
    (today.getTime() - last.getTime()) / 86400000
  )
  if (diffFromToday > 1) return 0
  let streak = 1
  for (let i = 1; i < dates.length; i++) {
    const curr = new Date(dates[i - 1])
    const prev = new Date(dates[i])
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000)
    if (diff === 1) streak++
    else break
  }
  return streak
}

function buildNotification(
  type: string,
  ctx: {
    todayTotal: number
    dailyGoal: number
    streak: number
    weekTotal: number
    weeklyGoal: number
    nick: string
  }
): { title: string; body: string } | null {
  const { todayTotal, dailyGoal, streak, weekTotal, nick } = ctx
  const remaining = Math.max(0, dailyGoal - todayTotal)

  switch (type) {
    case 'morning': {
      // 9:00 — pozdrowienie poranne, motywacja do startu dnia
      if (streak >= 3) {
        return {
          title: 'POMPKI ⚡',
          body: `🔥 Seria ${streak} dni! Dziś cel: ${dailyGoal} pompek. Trzymaj formę!`,
        }
      }
      return {
        title: 'POMPKI ⚡',
        body: `Dzień dobry! Dziś cel: ${dailyGoal} pompek. Zaczynamy?`,
      }
    }

    case 'midday': {
      // 13:00 — przerwa na pompki / pochwała postępu
      if (todayTotal >= dailyGoal) return null // cel już osiągnięty
      if (todayTotal === 0) {
        return {
          title: 'POMPKI ⚡',
          body: 'Przerwa na pompki? Idealny moment.',
        }
      }
      const pct = Math.round((todayTotal / dailyGoal) * 100)
      return {
        title: 'POMPKI ⚡',
        body: `${pct}% celu za Tobą! Jeszcze ${remaining} pompek.`,
      }
    }

    case 'evening': {
      // 21:00 — ostatnia szansa / streak warning
      if (todayTotal >= dailyGoal) return null // cel ok, nie spamuj
      if (streak >= 3 && todayTotal === 0) {
        return {
          title: 'POMPKI ⚡',
          body: `🔥 Twoja seria ${streak} dni w zagrożeniu! Zrób chociaż kilka pompek.`,
        }
      }
      if (todayTotal === 0) {
        return {
          title: 'POMPKI ⚡',
          body: `Ostatnia godzina! Cel: ${dailyGoal} pompek.`,
        }
      }
      return {
        title: 'POMPKI ⚡',
        body: `Ostatnia godzina! Zostało ${remaining} pompek do celu.`,
      }
    }

    case 'weekly': {
      // Niedziela 20:00 — podsumowanie tygodnia
      const greeting = nick ? `${nick}, ` : ''
      return {
        title: 'POMPKI ⚡ — Podsumowanie tygodnia',
        body: `${greeting}w tym tygodniu: ${weekTotal} pompek 🎉 Nowy tydzień, nowy cel!`,
      }
    }

    default:
      return null
  }
}

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const type = url.searchParams.get('type') || 'evening'

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

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
  const monday = mondayISO()

  let sent = 0
  let skipped = 0
  let removed = 0

  for (const sub of subs || []) {
    // Profil użytkownika
    const { data: profile } = await supabase
      .from('profiles')
      .select('daily_goal, weekly_goal, nick')
      .eq('user_id', sub.user_id)
      .maybeSingle()

    const dailyGoal = profile?.daily_goal ?? 30
    const weeklyGoal = profile?.weekly_goal ?? 150
    const nick = profile?.nick || ''

    // Workouts for stats
    const { data: allWorkouts } = await supabase
      .from('workouts')
      .select('count, performed_at')
      .eq('user_id', sub.user_id)

    const workouts = allWorkouts || []
    const todayTotal = workouts
      .filter((w) => w.performed_at === today)
      .reduce((s, w) => s + w.count, 0)
    const weekTotal = workouts
      .filter((w) => w.performed_at >= monday)
      .reduce((s, w) => s + w.count, 0)
    const streak = calculateStreak(workouts)

    const notif = buildNotification(type, {
      todayTotal,
      dailyGoal,
      streak,
      weekTotal,
      weeklyGoal,
      nick,
    })

    if (!notif) {
      skipped++
      continue
    }

    const payload = JSON.stringify({
      title: notif.title,
      body: notif.body,
      url: '/',
      tag: `pompki-${type}`,
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
      if (statusCode === 404 || statusCode === 410) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', sub.endpoint)
        removed++
      } else {
        console.error(
          'Push failed:',
          sub.user_id,
          statusCode,
          (e as Error).message
        )
      }
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      type,
      sent,
      skipped,
      removed,
      total: subs?.length ?? 0,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
