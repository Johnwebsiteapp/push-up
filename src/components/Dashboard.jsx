import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import AddWorkout from './AddWorkout'
import WorkoutList from './WorkoutList'

function getMotivation(total) {
  if (total === 0)
    return {
      title: 'Zacznij swój streak.',
      sub: 'Każda wielka historia zaczyna się od pierwszej powtórki. Dodaj swój pierwszy trening.',
    }
  if (total < 20)
    return {
      title: 'Rozgrzewka w toku.',
      sub: 'Świetny start — trzymaj tempo i buduj nawyk każdego dnia.',
    }
  if (total < 100)
    return {
      title: 'Kinetyczna energia rośnie.',
      sub: 'Dobrze Ci idzie. Kolejna sesja przybliża Cię do pierwszej setki.',
    }
  if (total < 500)
    return {
      title: 'Jesteś w formie.',
      sub: 'Każda powtórka to inwestycja w siłę. Kontynuuj ten rytm.',
    }
  if (total < 1000)
    return {
      title: 'Mistrzowska dyscyplina.',
      sub: 'Dotarłeś dalej niż większość. Trzymaj ten flow.',
    }
  return {
    title: 'Legendarny poziom.',
    sub: 'Inspirujesz innych swoim tempem. Konsekwencja = rezultat.',
  }
}

function todayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function calculateStreak(workouts) {
  if (workouts.length === 0) return 0

  const uniqueDates = Array.from(new Set(workouts.map((w) => w.performed_at))).sort().reverse()
  if (uniqueDates.length === 0) return 0

  const today = new Date(todayISO())
  const last = new Date(uniqueDates[0])
  const diffFromToday = Math.round((today - last) / (1000 * 60 * 60 * 24))

  // streak liczy się tylko jeśli ostatnia aktywność była dziś lub wczoraj
  if (diffFromToday > 1) return 0

  let streak = 1
  for (let i = 1; i < uniqueDates.length; i++) {
    const curr = new Date(uniqueDates[i - 1])
    const prev = new Date(uniqueDates[i])
    const diff = Math.round((curr - prev) / (1000 * 60 * 60 * 24))
    if (diff === 1) streak++
    else break
  }
  return streak
}

function getTitleForTotal(total) {
  if (total === 0) return 'Nowicjusz'
  if (total < 50) return 'Początkujący'
  if (total < 200) return 'Regularny'
  if (total < 500) return 'Zaawansowany'
  if (total < 1000) return 'Power Lifter'
  return 'Global Elite'
}

export default function Dashboard({ session }) {
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const user = session.user

  useEffect(() => {
    let ignore = false

    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .order('performed_at', { ascending: false })
        .order('created_at', { ascending: false })

      if (!ignore) {
        if (error) setError(error.message)
        else setWorkouts(data ?? [])
        setLoading(false)
      }
    }

    load()
    return () => {
      ignore = true
    }
  }, [])

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('workouts-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'workouts' },
        (payload) => {
          setWorkouts((prev) => {
            if (prev.some((w) => w.id === payload.new.id)) return prev
            return [payload.new, ...prev]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'workouts' },
        (payload) => {
          setWorkouts((prev) => prev.filter((w) => w.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const myWorkouts = useMemo(
    () => workouts.filter((w) => w.user_id === user.id),
    [workouts, user.id]
  )

  const myTotal = useMemo(
    () => myWorkouts.reduce((sum, w) => sum + w.count, 0),
    [myWorkouts]
  )

  const todayTotal = useMemo(() => {
    const t = todayISO()
    return myWorkouts
      .filter((w) => w.performed_at === t)
      .reduce((sum, w) => sum + w.count, 0)
  }, [myWorkouts])

  const streak = useMemo(() => calculateStreak(myWorkouts), [myWorkouts])

  const leaderboard = useMemo(() => {
    const map = new Map()
    for (const w of workouts) {
      const prev = map.get(w.user_id) ?? { email: w.user_email, total: 0 }
      map.set(w.user_id, { email: w.user_email, total: prev.total + w.count })
    }
    return Array.from(map.entries())
      .map(([user_id, v]) => ({ user_id, ...v }))
      .sort((a, b) => b.total - a.total)
  }, [workouts])

  const motivation = getMotivation(myTotal)
  const initials = user.email ? user.email.slice(0, 2).toUpperCase() : '??'

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('workouts').delete().eq('id', id)
    if (error) alert('Błąd usuwania: ' + error.message)
  }

  return (
    <div className="dashboard">
      <header className="topbar">
        <div className="brand">
          <span className="brand-bolt">⚡</span>
          <span>POMPKI</span>
        </div>
        <div className="avatar-menu">
          <button
            className="avatar"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu użytkownika"
          >
            {initials}
          </button>
          {menuOpen && (
            <div className="avatar-dropdown">
              <span className="avatar-dropdown-email">{user.email}</span>
              <button onClick={handleSignOut} className="secondary">
                Wyloguj
              </button>
            </div>
          )}
        </div>
      </header>

      <section className="hero">
        <div className="hero-count">
          <div className="hero-number">{myTotal}</div>
          <div className="hero-label">Total Reps</div>
        </div>
        <h2 className="hero-title">{motivation.title}</h2>
        <p className="hero-sub">{motivation.sub}</p>
        <div className="stats-row">
          <div className="stat-box primary">
            <span className="label">Streak</span>
            <div className="value">{streak} {streak === 1 ? 'dzień' : 'dni'}</div>
          </div>
          <div className="stat-box secondary">
            <span className="label">Dziś</span>
            <div className="value">{todayTotal} pompek</div>
          </div>
        </div>
      </section>

      <AddWorkout user={user} />

      <section className="card">
        <h3 className="card-title">
          <span>Leaderboard</span>
        </h3>
        {leaderboard.length === 0 ? (
          <p className="empty">Brak wpisów. Bądź pierwszy!</p>
        ) : (
          <ul className="leaderboard-list">
            {leaderboard.map((entry, idx) => {
              const isMe = entry.user_id === user.id
              const init = entry.email ? entry.email.slice(0, 2).toUpperCase() : '??'
              return (
                <li key={entry.user_id} className="leaderboard-item">
                  <div className={`lb-avatar ${isMe ? 'me' : ''}`}>
                    {init}
                    <span className="lb-rank">{idx + 1}</span>
                  </div>
                  <div className="lb-info">
                    <div className="lb-name">
                      {entry.email.split('@')[0]}
                      {isMe && ' (Ty)'}
                    </div>
                    <div className="lb-title">{getTitleForTotal(entry.total)}</div>
                  </div>
                  <div className="lb-score-wrap">
                    <div className="lb-score">{entry.total}</div>
                    <span className="lb-score-unit">Reps</span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="card">
        <h3 className="card-title">
          <span>Historia</span>
        </h3>
        {loading ? (
          <p className="empty">Ładowanie…</p>
        ) : error ? (
          <p className="error">Błąd: {error}</p>
        ) : (
          <WorkoutList
            workouts={workouts}
            currentUserId={user.id}
            onDelete={handleDelete}
          />
        )}
      </section>
    </div>
  )
}
