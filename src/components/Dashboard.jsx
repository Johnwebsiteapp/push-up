import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import AddWorkout from './AddWorkout'
import WorkoutList from './WorkoutList'
import Profile from './Profile'

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
      title: 'Energia rośnie.',
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

  const uniqueDates = Array.from(new Set(workouts.map((w) => w.performed_at)))
    .sort()
    .reverse()
  if (uniqueDates.length === 0) return 0

  const today = new Date(todayISO())
  const last = new Date(uniqueDates[0])
  const diffFromToday = Math.round((today - last) / (1000 * 60 * 60 * 24))

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

function streakLabel(n) {
  if (n === 1) return '1 dzień'
  return `${n} dni`
}

function getTitleForTotal(total) {
  if (total === 0) return 'Nowicjusz'
  if (total < 50) return 'Początkujący'
  if (total < 200) return 'Regularny'
  if (total < 500) return 'Zaawansowany'
  if (total < 1000) return 'Weteran'
  return 'Legenda'
}

const DNI_SHORT = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb']
function formatShortDate(isoDate) {
  if (!isoDate) return ''
  const [y, m, d] = isoDate.split('-').map(Number)
  const dateObj = new Date(y, m - 1, d)
  return `${DNI_SHORT[dateObj.getDay()]} ${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}`
}

// Płynny licznik — animuje wartość od poprzedniej do nowej z ease-out
function AnimatedCounter({ value, duration = 750 }) {
  const [display, setDisplay] = useState(value)
  const prevRef = useRef(value)
  const spanRef = useRef(null)

  useEffect(() => {
    if (value === prevRef.current) return
    const from = prevRef.current
    const to = value
    const start = performance.now()
    let raf

    function tick(now) {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + (to - from) * eased))
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        prevRef.current = to
      }
    }
    raf = requestAnimationFrame(tick)

    // Pulse tylko gdy wartość ROŚNIE (np. po dodaniu treningu)
    if (spanRef.current && to > from) {
      spanRef.current.classList.remove('pulse')
      void spanRef.current.offsetWidth
      spanRef.current.classList.add('pulse')
    }

    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return (
    <span ref={spanRef} className="animated-counter">
      {display}
    </span>
  )
}

export default function Dashboard({ session }) {
  const [tab, setTab] = useState('home')
  const [workouts, setWorkouts] = useState([])
  const [profiles, setProfiles] = useState({})
  const [profilesLoaded, setProfilesLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [profileRefresh, setProfileRefresh] = useState(0)
  const [nickPromptNick, setNickPromptNick] = useState('')
  const [nickPromptSaving, setNickPromptSaving] = useState(false)
  const [nickPromptError, setNickPromptError] = useState(null)

  // Live-drag state
  const [isDragging, setIsDragging] = useState(false)
  const [dragDelta, setDragDelta] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(null)
  const viewportRef = useRef(null)
  const rankingPanelRef = useRef(null)
  const homePanelRef = useRef(null)
  const profilePanelRef = useRef(null)
  const touchRef = useRef({ startX: 0, startY: 0, lockDir: null })

  const user = session.user

  const TABS = ['ranking', 'home', 'profile']
  const tabIndex = TABS.indexOf(tab)

  function changeTab(newTab) {
    setTab(newTab)
    // Reset scroll żeby content nie wypadał poza ekran na innym panelu
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function onTouchStart(e) {
    if (deleteTarget || menuOpen) return
    const t = e.targetTouches[0]
    touchRef.current = { startX: t.clientX, startY: t.clientY, lockDir: null }
    setIsDragging(true)
  }

  function onTouchMove(e) {
    if (!isDragging) return
    const t = e.targetTouches[0]
    const dx = t.clientX - touchRef.current.startX
    const dy = t.clientY - touchRef.current.startY

    // Określ kierunek gestu po pierwszych ~10px
    if (touchRef.current.lockDir === null) {
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        touchRef.current.lockDir = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      }
      return
    }

    if (touchRef.current.lockDir !== 'x') return

    // Opór gumowy na krawędziach
    let offset = dx
    if ((dx > 0 && tabIndex === 0) || (dx < 0 && tabIndex === TABS.length - 1)) {
      offset = dx * 0.3
    }

    setDragDelta(offset)
  }

  function onTouchEnd() {
    if (!isDragging) return
    setIsDragging(false)

    if (touchRef.current.lockDir !== 'x') {
      setDragDelta(0)
      return
    }

    const width = viewportRef.current?.offsetWidth || window.innerWidth
    const threshold = width * 0.2 // 20% szerokości ekranu

    if (dragDelta < -threshold && tabIndex < TABS.length - 1) {
      changeTab(TABS[tabIndex + 1])
    } else if (dragDelta > threshold && tabIndex > 0) {
      changeTab(TABS[tabIndex - 1])
    }

    setDragDelta(0)
  }

  // Pobieranie treningów
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

  // Pobieranie profili (dla nicków w rankingu)
  useEffect(() => {
    let ignore = false
    async function loadProfiles() {
      const { data, error } = await supabase.from('profiles').select('*')
      if (ignore) return

      if (error) {
        console.warn('Błąd ładowania profili:', error.message)
        // Mimo błędu pozwól modalowi nicka się pojawić
        setProfilesLoaded(true)
        return
      }

      const map = {}
      if (data) {
        for (const p of data) map[p.user_id] = p
      }

      // Fallback dla bieżącego użytkownika — jeśli nie ma w tabeli,
      // a w user_metadata jest nick (np. zaraz po rejestracji), użyj go
      const metaNick = user.user_metadata?.nick
      if (!map[user.id]?.nick && metaNick) {
        map[user.id] = {
          ...(map[user.id] || { user_id: user.id }),
          nick: metaNick,
        }

        // Auto-heal: zapisz nick do tabeli profiles żeby było trwale
        supabase
          .from('profiles')
          .upsert({
            user_id: user.id,
            nick: metaNick,
            updated_at: new Date().toISOString(),
          })
          .then(({ error: upsertError }) => {
            if (upsertError) {
              console.warn(
                'Auto-heal profilu nie powiódł się:',
                upsertError.message
              )
            }
          })
      }

      setProfiles(map)
      setProfilesLoaded(true)
    }
    loadProfiles()

    // Safety net — jeśli z jakiegoś powodu nie doczekamy się load'a,
    // po 3 sekundach i tak pokaż modal nicka
    const safetyTimer = setTimeout(() => {
      if (!ignore) setProfilesLoaded(true)
    }, 3000)

    return () => {
      ignore = true
      clearTimeout(safetyTimer)
    }
  }, [profileRefresh, user.id, user.user_metadata])

  // Realtime treningów
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

  // Mierzenie wysokości aktywnego panelu (żeby viewport się dopasowywał)
  useEffect(() => {
    const panels = [
      rankingPanelRef.current,
      homePanelRef.current,
      profilePanelRef.current,
    ]
    const active = panels[tabIndex]
    if (!active) return

    function measure() {
      setViewportHeight(active.offsetHeight)
    }

    measure()

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure)
      observer.observe(active)
      return () => observer.disconnect()
    }
  }, [tabIndex, workouts, profiles])

  // Realtime profili
  useEffect(() => {
    const channel = supabase
      .channel('profiles-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          setProfileRefresh((v) => v + 1)
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

  const weekTotal = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 6)
    cutoff.setHours(0, 0, 0, 0)
    return myWorkouts
      .filter((w) => {
        const d = new Date(w.performed_at)
        return d >= cutoff
      })
      .reduce((sum, w) => sum + w.count, 0)
  }, [myWorkouts])

  const streak = useMemo(() => calculateStreak(myWorkouts), [myWorkouts])

  const leaderboard = useMemo(() => {
    const map = new Map()
    for (const w of workouts) {
      const prev = map.get(w.user_id) ?? { total: 0 }
      map.set(w.user_id, { total: prev.total + w.count })
    }
    return Array.from(map.entries())
      .map(([user_id, v]) => {
        const prof = profiles[user_id]
        const displayName = prof?.nick || prof?.name || 'Użytkownik'
        return { user_id, ...v, displayName }
      })
      .sort((a, b) => b.total - a.total)
  }, [workouts, profiles])

  const motivation = getMotivation(myTotal)
  const myProfile = profiles[user.id]
  const myDisplayName = myProfile?.nick || myProfile?.name || 'Użytkownik'
  const initials = (myProfile?.nick || myProfile?.name || '??')
    .slice(0, 2)
    .toUpperCase()

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  function requestDelete(workout) {
    setDeleteTarget(workout)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('workouts').delete().eq('id', deleteTarget.id)
    setDeleting(false)
    if (error) {
      alert('Błąd usuwania: ' + error.message)
    } else {
      setDeleteTarget(null)
    }
  }

  // Czy użytkownik potrzebuje ustawić nick (modal blokujący)
  const needsNick =
    profilesLoaded &&
    !(profiles[user.id]?.nick) &&
    !(user.user_metadata?.nick)

  async function handleNickPromptSave(e) {
    e.preventDefault()
    const trimmed = nickPromptNick.trim()
    if (trimmed.length < 2) {
      setNickPromptError('Nick musi mieć co najmniej 2 znaki.')
      return
    }
    setNickPromptSaving(true)
    setNickPromptError(null)

    try {
      // 1. user_metadata
      const { error: metaError } = await supabase.auth.updateUser({
        data: { nick: trimmed },
      })
      if (metaError) throw metaError

      // 2. tabela profiles
      const { error: profileError } = await supabase.from('profiles').upsert({
        user_id: user.id,
        nick: trimmed,
        updated_at: new Date().toISOString(),
      })
      if (profileError) throw profileError

      // Odśwież profile w Dashboard
      setProfileRefresh((v) => v + 1)
      setNickPromptNick('')
    } catch (err) {
      setNickPromptError('Błąd zapisu: ' + err.message)
    } finally {
      setNickPromptSaving(false)
    }
  }

  return (
    <div className="dashboard">
      <header className="topbar">
        <div className="brand">
          <span className="brand-bolt">⚡</span>
          <span>POMPKI</span>
        </div>
        <div
          className="topbar-count"
          aria-label={`Razem ${myTotal} pompek`}
          title="Wszystkie Twoje pompki"
        >
          <span className="topbar-count-value">
            <AnimatedCounter value={myTotal} />
          </span>
          <span className="topbar-count-label">razem</span>
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
              <span className="avatar-dropdown-name">{myDisplayName}</span>
              <button onClick={handleSignOut} className="secondary">
                Wyloguj
              </button>
            </div>
          )}
        </div>
      </header>

      <div
        ref={viewportRef}
        className="tabs-viewport"
        style={viewportHeight ? { height: `${viewportHeight}px` } : undefined}
      >
        <div
          className={`tabs-track ${isDragging ? 'dragging' : ''}`}
          style={{
            transform: `translate3d(calc(${tabIndex * -100}% + ${dragDelta}px), 0, 0)`,
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
        >
          <div
            className="tab-panel"
            ref={rankingPanelRef}
            aria-hidden={tab !== 'ranking'}
          >
            <section className="card">
              <h3 className="card-title">
                <span>Ranking</span>
              </h3>
              {leaderboard.length === 0 ? (
                <p className="empty">Brak wpisów. Bądź pierwszy!</p>
              ) : (
                <ul className="leaderboard-list">
                  {leaderboard.map((entry, idx) => {
                    const isMe = entry.user_id === user.id
                    const init = entry.displayName
                      ? entry.displayName.slice(0, 2).toUpperCase()
                      : '??'
                    return (
                      <li key={entry.user_id} className="leaderboard-item">
                        <div className={`lb-avatar ${isMe ? 'me' : ''}`}>
                          {init}
                          <span className="lb-rank">{idx + 1}</span>
                        </div>
                        <div className="lb-info">
                          <div className="lb-name">
                            {entry.displayName}
                            {isMe && ' (Ty)'}
                          </div>
                          <div className="lb-title">
                            {getTitleForTotal(entry.total)}
                          </div>
                        </div>
                        <div className="lb-score-wrap">
                          <div className="lb-score">
                            <AnimatedCounter value={entry.total} />
                          </div>
                          <span className="lb-score-unit">pompek</span>
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
                  profiles={profiles}
                  currentUserId={user.id}
                  onDelete={requestDelete}
                />
              )}
            </section>
          </div>

          <div
            className="tab-panel"
            ref={homePanelRef}
            aria-hidden={tab !== 'home'}
          >
          <section className="hero">
            <div className="hero-count">
              <div className="hero-number">
                <AnimatedCounter value={todayTotal} />
              </div>
              <div className="hero-label">Pompki dzisiaj</div>
            </div>
            <h2 className="hero-title">{motivation.title}</h2>
            <p className="hero-sub">{motivation.sub}</p>
            <div className="stats-row">
              <div className="stat-box primary">
                <span className="label">Seria</span>
                <div className="value">
                  <AnimatedCounter value={streak} />{' '}
                  {streak === 1 ? 'dzień' : 'dni'}
                </div>
              </div>
              <div className="stat-box secondary">
                <span className="label">Tydzień</span>
                <div className="value">
                  <AnimatedCounter value={weekTotal} /> pompek
                </div>
              </div>
            </div>
          </section>

          <AddWorkout user={user} />
          </div>

          <div
            className="tab-panel"
            ref={profilePanelRef}
            aria-hidden={tab !== 'profile'}
          >
            <Profile
              user={user}
              onProfileChange={() => setProfileRefresh((v) => v + 1)}
            />
          </div>
        </div>
      </div>

      <nav className="bottom-nav">
        <button
          className={tab === 'ranking' ? 'active' : ''}
          onClick={() => changeTab('ranking')}
        >
          Ranking
        </button>
        <button
          className={tab === 'home' ? 'active' : ''}
          onClick={() => changeTab('home')}
        >
          Główna
        </button>
        <button
          className={tab === 'profile' ? 'active' : ''}
          onClick={() => changeTab('profile')}
        >
          Profil
        </button>
      </nav>

      {needsNick && (
        <div className="modal-backdrop" onClick={(e) => e.stopPropagation()}>
          <div
            className="modal nick-prompt"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="brand" style={{ justifyContent: 'center' }}>
              <span className="brand-bolt">⚡</span>
              <span>POMPKI</span>
            </div>
            <h3>Wybierz swój nick</h3>
            <p>
              Pod tym nickiem będziesz widoczny w rankingu i historii.
              Możesz go później zmienić w zakładce Profil.
            </p>
            <form onSubmit={handleNickPromptSave}>
              <input
                type="text"
                value={nickPromptNick}
                onChange={(e) => setNickPromptNick(e.target.value)}
                placeholder="Twój nick"
                minLength={2}
                maxLength={30}
                required
                autoFocus
              />
              <button
                type="submit"
                disabled={nickPromptSaving || nickPromptNick.trim().length < 2}
              >
                {nickPromptSaving ? 'Zapisywanie…' : 'Zapisz i kontynuuj'}
              </button>
              {nickPromptError && (
                <p className="error" style={{ marginTop: 10, textAlign: 'center' }}>
                  {nickPromptError}
                </p>
              )}
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="modal-backdrop"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Usunąć trening?</h3>
            <p>
              <strong className="modal-highlight">{deleteTarget.count} pompek</strong>
              {' '}z dnia {formatShortDate(deleteTarget.performed_at)}
              {deleteTarget.note && <> — „{deleteTarget.note}"</>}
              <br />
              Tej akcji nie można cofnąć.
            </p>
            <div className="modal-actions">
              <button
                className="secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Anuluj
              </button>
              <button
                className="danger"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Usuwanie…' : 'Usuń'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
