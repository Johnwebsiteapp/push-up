import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import AddWorkout from './AddWorkout'
import WorkoutList from './WorkoutList'

export default function Dashboard({ session }) {
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const user = session.user

  // Pobieranie wszystkich treningów
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

  // Realtime — aktualizacje na żywo
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

  // Licznik moich pompek
  const myTotal = useMemo(
    () => workouts.filter((w) => w.user_id === user.id).reduce((sum, w) => sum + w.count, 0),
    [workouts, user.id]
  )

  // Grupowanie po użytkowniku dla podsumowania
  const totalsByUser = useMemo(() => {
    const map = new Map()
    for (const w of workouts) {
      const prev = map.get(w.user_id) ?? { email: w.user_email, total: 0 }
      map.set(w.user_id, { email: w.user_email, total: prev.total + w.count })
    }
    return Array.from(map.entries()).map(([user_id, v]) => ({ user_id, ...v }))
  }, [workouts])

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('workouts').delete().eq('id', id)
    if (error) alert('Błąd usuwania: ' + error.message)
  }

  return (
    <div className="dashboard">
      <div className="counter-badge" title="Łączna liczba Twoich pompek">
        <span className="counter-label">Moje pompki</span>
        <span className="counter-value">{myTotal}</span>
      </div>

      <header className="topbar">
        <h1>💪 Aplikacja Pompki</h1>
        <div className="topbar-user">
          <span className="muted">{user.email}</span>
          <button onClick={handleSignOut} className="secondary">Wyloguj</button>
        </div>
      </header>

      <main className="content">
        <section className="card">
          <h2>Dodaj trening</h2>
          <AddWorkout user={user} />
        </section>

        <section className="card">
          <h2>Podsumowanie</h2>
          {totalsByUser.length === 0 ? (
            <p className="muted">Brak treningów. Dodaj pierwszy!</p>
          ) : (
            <ul className="totals">
              {totalsByUser
                .sort((a, b) => b.total - a.total)
                .map((t) => (
                  <li key={t.user_id} className={t.user_id === user.id ? 'me' : ''}>
                    <span>{t.email}{t.user_id === user.id && ' (Ty)'}</span>
                    <strong>{t.total}</strong>
                  </li>
                ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h2>Wszystkie treningi</h2>
          {loading ? (
            <p className="muted">Ładowanie…</p>
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
      </main>
    </div>
  )
}
