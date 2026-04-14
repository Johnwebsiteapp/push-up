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

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)]
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
  const pct = dailyGoal > 0 ? Math.round((todayTotal / dailyGoal) * 100) : 0
  const title = 'POMPKI ⚡'

  switch (type) {
    case 'morning': {
      // 10:00 weekend
      if (todayTotal >= dailyGoal) {
        return {
          title,
          body: pick([
            `🌅 Poranny ptaszek! Cel już zrobiony: ${todayTotal}/${dailyGoal}.`,
            `💪 ${todayTotal} pompek przed 10:00 — świetny start!`,
            `🔥 Cel o tej godzinie? Masz tempo, bracie.`,
            `☕ Najpierw pompki, potem kawa? Brawo.`,
            `🎯 ${todayTotal}/${dailyGoal} przed śniadaniem. Szacun.`,
          ]),
        }
      }
      if (streak >= 3) {
        return {
          title,
          body: pick([
            `🔥 Seria ${streak} dni! Dziś cel: ${dailyGoal}. Trzymaj formę!`,
            `🔥 ${streak} dni z rzędu — szanuję. Dziś cel: ${dailyGoal}.`,
            `🔥 Streak ${streak} dni nie pęknie? Cel: ${dailyGoal}.`,
            `🌟 Seria ${streak} dni żyje. Dziś cel: ${dailyGoal} pompek.`,
          ]),
        }
      }
      return {
        title,
        body: pick([
          `Dzień dobry! Dziś cel: ${dailyGoal} pompek. Zaczynamy?`,
          `Weekend ⚡ — pora na pompki. Cel: ${dailyGoal}.`,
          `Kawa, kąpiel, pompki. Cel: ${dailyGoal}.`,
          `Wstałeś? To i pompki na Ciebie czekają. Cel: ${dailyGoal}.`,
          `Dzień dobry. Bez wymówek — ${dailyGoal} pompek dziś.`,
          `Wstajemy! ${dailyGoal} pompek czeka.`,
        ]),
      }
    }

    case 'midday': {
      // 15:00 Pn-Pt (po pracy)
      if (todayTotal >= dailyGoal) {
        const pool = [
          `🔥 Cel już zrobiony! ${todayTotal}/${dailyGoal}. Szybki byłeś.`,
          `💪 ${todayTotal} pompek przed 15:00. Szacun.`,
          `🎯 Cel dzienny już za Tobą. ${todayTotal} pompek.`,
          `🚀 Zaczynasz dzień mocno: ${todayTotal}/${dailyGoal}!`,
          `✅ Zrobione zanim większość zaczęła. ${todayTotal} pompek.`,
        ]
        if (streak >= 3) {
          pool.push(`🔥 Cel + seria ${streak} dni. Forma jest.`)
        }
        return { title, body: pick(pool) }
      }
      if (todayTotal === 0) {
        return {
          title,
          body: pick([
            'Po pracy? Idealny moment na pompki.',
            'Wracasz z roboty? Czas na pompki.',
            'Zero pompek dziś. Naprawmy to.',
            'Praca skończona, pompki czekają.',
            'Po godzinach — czas na trening.',
            'Bez pompek = bez wymówek. Zaczynaj.',
            `Cel ${dailyGoal} czeka. Idealny moment na start.`,
            `Dzień jeszcze przed Tobą. ${dailyGoal} pompek do zrobienia.`,
          ]),
        }
      }
      return {
        title,
        body: pick([
          `${pct}% celu za Tobą! Jeszcze ${remaining} pompek.`,
          `${remaining} pompek do mety. Dasz radę.`,
          `Kontynuuj — zostało ${remaining}.`,
          `Tak trzymaj! ${pct}% już jest, brakuje ${remaining}.`,
          `Półmetek mija — ${pct}%. Brakuje ${remaining} pompek.`,
          `${todayTotal}/${dailyGoal} — jeszcze tylko ${remaining}.`,
        ]),
      }
    }

    case 'evening': {
      // 18:15 codziennie
      if (todayTotal >= dailyGoal) {
        const over = todayTotal - dailyGoal
        const exceeds50 = over >= dailyGoal * 0.5
        const exceedsDouble = over >= dailyGoal

        const pool: string[] = [
          `🎯 Cel dzienny zrobiony! ${todayTotal} pompek za Tobą.`,
          `🏆 ${todayTotal}/${dailyGoal} — świetna robota!`,
          `💪 Dzień zamknięty: ${todayTotal} pompek. Odpoczywaj.`,
          `🎉 Super! Dziś ${todayTotal} pompek za Tobą.`,
          `✅ Zrobione. ${todayTotal} pompek w kieszeni.`,
          `🌟 ${todayTotal} pompek dziś. Dobrze rozegrane.`,
          `😎 ${todayTotal}/${dailyGoal} — tak się to robi.`,
        ]
        if (over > 0 && !exceeds50) {
          pool.push(`🚀 Cel przebity! ${todayTotal} pompek (o ${over} więcej).`)
        }
        if (exceeds50 && !exceedsDouble) {
          pool.push(`🔥 Mocno! ${todayTotal} pompek — znacznie ponad cel.`)
          pool.push(`💥 ${todayTotal} pompek dziś. Dawaj!`)
        }
        if (exceedsDouble) {
          pool.push(`🌋 Wulkan! ${todayTotal} pompek — dwa razy tyle co cel!`)
          pool.push(`⚡ ${todayTotal}? Serio? Beast.`)
        }
        if (streak >= 3) {
          pool.push(`🔥 Cel + seria ${streak} dni leci dalej!`)
        }
        if (streak >= 7) {
          pool.push(`⭐ Seria ${streak} dni i ${todayTotal} pompek dziś. Legenda.`)
        }
        return { title, body: pick(pool) }
      }

      // 0 dziś + duży streak — ostry warning
      if (streak >= 3 && todayTotal === 0) {
        return {
          title,
          body: pick([
            `🔥 Twoja seria ${streak} dni w zagrożeniu! Zrób chociaż kilka pompek.`,
            `🔥 ${streak} dni z rzędu — nie zepsuj tego dziś.`,
            `🔥 Streak ${streak} dni mówi: nie odpuszczaj.`,
            `🔥 ${streak} dni walki — nie marnuj tego.`,
            `⏰ Seria ${streak} dni leci dziś o włos. Działaj.`,
          ]),
        }
      }

      // 0 dziś, brak streaka
      if (todayTotal === 0) {
        return {
          title,
          body: pick([
            `Ostatnia godzina! Cel: ${dailyGoal} pompek.`,
            `Wieczór ucieka. ${dailyGoal} pompek czeka.`,
            `Późno, ale nie za późno. Cel: ${dailyGoal}.`,
            `Nie daj żeby dziś przeszedł bez pompek.`,
            `Pora na pompki, zanim usiądziesz na kanapie.`,
            `Jeden zryw — i ${dailyGoal} masz z głowy.`,
            `Zostało kilka godzin. ${dailyGoal} pompek do mety.`,
          ]),
        }
      }

      // W trakcie — coś już zrobione
      return {
        title,
        body: pick([
          `Ostatnia godzina! Zostało ${remaining} pompek do celu.`,
          `Jeszcze ${remaining} i meta.`,
          `Brakuje ${remaining}. Jedna seria i koniec.`,
          `${pct}% już jest. ${remaining} pompek do mety.`,
          `Ostatni przystanek — ${remaining} pompek.`,
          `Tak blisko! Jeszcze ${remaining} i cel zaliczony.`,
          `${todayTotal}/${dailyGoal}. Domknij to dziś.`,
        ]),
      }
    }

    case 'weekly': {
      // Niedziela 20:00
      const greeting = nick ? `${nick}, ` : ''
      const titleWeekly = 'POMPKI ⚡ — Podsumowanie tygodnia'
      return {
        title: titleWeekly,
        body: pick([
          `${greeting}w tym tygodniu: ${weekTotal} pompek 🎉 Nowy tydzień, nowy cel!`,
          `${greeting}tygodniówka: ${weekTotal} pompek. Reset i jedziemy dalej!`,
          `Tydzień zamknięty: ${weekTotal} pompek. Następny czeka.`,
          `${greeting}${weekTotal} pompek/tydzień. Świetnie!`,
          `Tydzień: ${weekTotal} pompek. Niedzielne pompki też się liczą 😉`,
          `Podsumowanie: ${weekTotal} pompek. Co w nowym tygodniu?`,
          `${greeting}${weekTotal} pompek w tygodniu. Dobry rytm!`,
        ]),
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
