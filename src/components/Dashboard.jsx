import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import AddWorkout from './AddWorkout'
import WorkoutList from './WorkoutList'
import Profile from './Profile'

const ZERO_ACHIEVEMENT = {
  title: 'Podłoga czeka.',
  sub: 'Nie rozczaruj jej.',
}

const ACHIEVEMENTS = [
  { title: 'Grawitacja płacze.', sub: 'Ty wygrywasz.' },
  { title: 'Podłoga ma mokro.', sub: 'Nie od deszczu.' },
  { title: 'Kanapa tęskni.', sub: 'I dobrze że tęskni.' },
  { title: 'Netflix poczeka.', sub: 'Pompki nie.' },
  { title: 'Lustro ma nowy ulubiony widok.', sub: 'Ty.' },
  { title: 'Pizza drży ze strachu.', sub: 'Wiesz co robisz.' },
  { title: 'T-shirt M zgłasza awans.', sub: 'Już jesteś tam.' },
  { title: 'Kto to?', sub: 'To Ty, legendo.' },
  { title: 'Thor szuka zastępstwa.', sub: 'Masz CV gotowe.' },
  { title: 'DNA się aktualizuje.', sub: 'Wersja 2.0 instaluje się.' },
  { title: 'Pompki to waluta.', sub: 'Kumulujesz majątek.' },
  { title: 'Lenistwo wysiadło.', sub: 'Na następnym przystanku.' },
  { title: 'Dawny ja wysłał pocztówkę.', sub: 'Podziwia Cię.' },
  { title: 'Klej grawitacyjny pęka.', sub: 'Unosisz się.' },
  { title: 'Siłownia wysłała nominację.', sub: 'Pracownik miesiąca.' },
  { title: 'Ramiona rosną jak akcje.', sub: 'Tylko w górę.' },
  { title: 'Protein shake drży.', sub: 'Dasz radę bez niego.' },
  { title: 'Kurier przyniósł siłę.', sub: 'Zostaw napiwek.' },
  { title: 'Deska klęka.', sub: 'Zasłużyłeś.' },
  { title: 'Bóg WFu Cię widzi.', sub: 'Jest dumny.' },
  { title: 'Pot = naturalny glow.', sub: 'Świecisz.' },
  { title: 'Siła ciążenia podpisała kapitulację.', sub: 'Bez negocjacji.' },
  { title: 'Kawa poczeka.', sub: 'Najpierw seria.' },
  { title: 'Parkiet Cię zna po imieniu.', sub: 'Stały bywalec.' },
  { title: 'Niewidzialny trener przybił piątkę.', sub: 'Właśnie teraz.' },
  { title: 'Ambicja: ON.', sub: 'Wymówki: OFF.' },
  { title: 'Zegar nie śpi.', sub: 'Ty też nie.' },
  { title: 'Ostatnia seria Cię nie złamała.', sub: 'Ta też nie złamie.' },
  { title: 'Stare Ty się poddaje.', sub: 'Nie masz dla niego czasu.' },
  { title: 'Dziennik treningowy płonie.', sub: 'Wpisy się sypią.' },
  { title: 'Mięśnie wstały wcześniej niż Ty.', sub: 'I są zadowolone.' },
  { title: 'Cardio płacze w kącie.', sub: 'Siła wygrywa.' },
  { title: 'Dumbbelle się chowają.', sub: 'Nawet ich nie potrzebujesz.' },
  { title: 'Kanapa napisała list rezygnacyjny.', sub: 'Odrzuć go.' },
  { title: 'Twoja klatka = Twój zamek.', sub: 'Budujesz go.' },
  { title: 'Powietrze też się poci.', sub: 'Ze strachu przed Tobą.' },
  { title: 'Legenda się pisze.', sub: 'Jesteś autorem.' },
  { title: 'Zmęczenie wysłało wymówienie.', sub: 'Wszedłeś w tryb.' },
  { title: 'Ręce = maszyny.', sub: 'Gwarancja dożywotnia.' },
  { title: 'Sąsiad zza ściany zapisuje wynik.', sub: 'Prowadzisz w tabeli.' },
  { title: 'Cień nadąża z trudem.', sub: 'Za szybki jesteś.' },
  { title: 'Spontan wziął wolne.', sub: 'Dyscyplina ma ster.' },
  { title: 'Ból = potwierdzenie.', sub: 'Dobra robota.' },
  { title: 'Kalendarz mówi dziękuję.', sub: 'Wypełniasz go mądrze.' },
  { title: 'Wyjścia puste.', sub: 'Wszyscy u Ciebie na pompkach.' },
  { title: 'Paragon z siły.', sub: 'Zbieraj punkty lojalnościowe.' },
  { title: 'Wczorajszy Ty przegrywa.', sub: 'Jutrzejszy się boi.' },
  { title: 'Rutyna w trybie legendary.', sub: 'Nie ma innej opcji.' },
  { title: 'Matka Ziemia nagrywa.', sub: 'Idzie na TikToka.' },
  { title: 'Kremówka Cię nie dogoni.', sub: 'Ucieczka sukces.' },
]

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

function calculateMaxStreak(workouts) {
  if (workouts.length === 0) return 0
  const uniqueDates = Array.from(new Set(workouts.map((w) => w.performed_at))).sort()
  if (uniqueDates.length === 0) return 0

  let maxStreak = 1
  let currentStreak = 1
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1])
    const curr = new Date(uniqueDates[i])
    const diff = Math.round((curr - prev) / (1000 * 60 * 60 * 24))
    if (diff === 1) {
      currentStreak++
      if (currentStreak > maxStreak) maxStreak = currentStreak
    } else {
      currentStreak = 1
    }
  }
  return maxStreak
}

// Poziom — im więcej pompek w sumie, tym wyższy level.
// Wzór: threshold dla LVL N = 15 * N * (N+1) → 30, 90, 180, 300, 450, 630, 840, 1080, 1350...
function getLevelInfo(total) {
  let level = 1
  let currentStart = 0
  let nextThreshold = 30
  while (total >= nextThreshold) {
    level++
    currentStart = nextThreshold
    nextThreshold = 15 * level * (level + 1)
  }
  const inLevel = total - currentStart
  const needForNext = nextThreshold - currentStart
  const progress = Math.max(0, Math.min(100, (inLevel / needForNext) * 100))
  return { level, currentStart, nextThreshold, inLevel, needForNext, progress }
}

const BADGE_DEFS = [
  { id: 'first', icon: '🥉', name: 'Pierwszy krok', desc: 'Dodaj pierwszy trening' },
  { id: 'hundred', icon: '💯', name: 'Setka', desc: '100 pompek w sumie' },
  { id: 'half-k', icon: '🥈', name: 'Pół tysiąca', desc: '500 pompek w sumie' },
  { id: 'thousand', icon: '🏅', name: 'Tysiąc', desc: '1000 pompek w sumie' },
  { id: 'five-k', icon: '👑', name: 'Pięć tysięcy', desc: '5000 pompek w sumie' },
  { id: 'streak3', icon: '🔥', name: 'Trzy dni', desc: '3 dni z rzędu' },
  { id: 'streak7', icon: '🔥', name: 'Tydzień siły', desc: '7 dni z rzędu' },
  { id: 'streak14', icon: '🌟', name: 'Dwa tygodnie', desc: '14 dni z rzędu' },
  { id: 'streak30', icon: '⭐', name: 'Miesiąc siły', desc: '30 dni z rzędu' },
  { id: 'big30', icon: '💪', name: 'Pół setki', desc: '30 pompek w jednej sesji' },
  { id: 'big50', icon: '💥', name: 'Pięćdziesiątka', desc: '50 pompek w jednej sesji' },
  { id: 'big100', icon: '🚀', name: 'Setka naraz', desc: '100 pompek w jednej sesji' },
]

function computeBadges(stats) {
  const { total, maxStreak, maxSession } = stats
  return BADGE_DEFS.map((b) => {
    let unlocked = false
    switch (b.id) {
      case 'first': unlocked = total >= 1; break
      case 'hundred': unlocked = total >= 100; break
      case 'half-k': unlocked = total >= 500; break
      case 'thousand': unlocked = total >= 1000; break
      case 'five-k': unlocked = total >= 5000; break
      case 'streak3': unlocked = maxStreak >= 3; break
      case 'streak7': unlocked = maxStreak >= 7; break
      case 'streak14': unlocked = maxStreak >= 14; break
      case 'streak30': unlocked = maxStreak >= 30; break
      case 'big30': unlocked = maxSession >= 30; break
      case 'big50': unlocked = maxSession >= 50; break
      case 'big100': unlocked = maxSession >= 100; break
      default: unlocked = false
    }
    return { ...b, unlocked }
  })
}

const DNI_CHART = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb']

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
  const [statsModal, setStatsModal] = useState(null) // 'chart' | 'records' | null

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
      let data = null
      let error = null
      try {
        const res = await supabase.from('profiles').select('*')
        data = res.data
        error = res.error
      } catch (err) {
        console.warn('loadProfiles crashed:', err)
        if (!ignore) setProfilesLoaded(true)
        return
      }
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
  const maxStreak = useMemo(() => calculateMaxStreak(myWorkouts), [myWorkouts])

  // Wykres tygodniowy — ostatnie 7 dni
  const weeklyChart = useMemo(() => {
    const days = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const count = myWorkouts
        .filter((w) => w.performed_at === iso)
        .reduce((sum, w) => sum + w.count, 0)
      days.push({
        iso,
        dayName: DNI_CHART[d.getDay()],
        count,
        isToday: i === 0,
      })
    }
    const max = Math.max(1, ...days.map((d) => d.count))
    return { days, max }
  }, [myWorkouts])

  // Rekordy osobiste
  const records = useMemo(() => {
    if (myWorkouts.length === 0) {
      return { maxSession: 0, maxDay: 0, maxWeek: 0, maxSessionDate: null, maxDayDate: null }
    }
    const maxSession = Math.max(...myWorkouts.map((w) => w.count))
    const maxSessionEntry = myWorkouts.find((w) => w.count === maxSession)

    const byDay = {}
    for (const w of myWorkouts) {
      byDay[w.performed_at] = (byDay[w.performed_at] || 0) + w.count
    }
    let maxDay = 0
    let maxDayDate = null
    for (const [date, count] of Object.entries(byDay)) {
      if (count > maxDay) {
        maxDay = count
        maxDayDate = date
      }
    }

    // Max z 7-dniowego okna
    const sortedDates = Object.keys(byDay).sort()
    let maxWeek = 0
    for (let i = 0; i < sortedDates.length; i++) {
      const windowStart = new Date(sortedDates[i])
      let sum = 0
      for (let j = i; j < sortedDates.length; j++) {
        const d = new Date(sortedDates[j])
        const diff = Math.round((d - windowStart) / (1000 * 60 * 60 * 24))
        if (diff > 6) break
        sum += byDay[sortedDates[j]]
      }
      if (sum > maxWeek) maxWeek = sum
    }

    return {
      maxSession,
      maxSessionDate: maxSessionEntry?.performed_at,
      maxDay,
      maxDayDate,
      maxWeek,
    }
  }, [myWorkouts])

  const levelInfo = useMemo(() => getLevelInfo(myTotal), [myTotal])

  const badges = useMemo(
    () =>
      computeBadges({
        total: myTotal,
        maxStreak,
        maxSession: records.maxSession,
      }),
    [myTotal, maxStreak, records.maxSession]
  )

  // Cele z profilu (defaultowe jeśli brak)
  const myProfileData = profiles[user.id]
  const dailyGoal = myProfileData?.daily_goal || 30
  const weeklyGoal = myProfileData?.weekly_goal || 150
  const dailyProgress = Math.min(100, Math.round((todayTotal / dailyGoal) * 100))
  const weeklyProgress = Math.min(
    100,
    Math.round((weekTotal / weeklyGoal) * 100)
  )
  const dailyMet = todayTotal >= dailyGoal && dailyGoal > 0
  const weeklyMet = weekTotal >= weeklyGoal && weeklyGoal > 0

  // Celebracja — banner gdy po raz pierwszy osiągnięto cel dziś/tydzień
  const [celebration, setCelebration] = useState(null)

  useEffect(() => {
    if (dailyMet) {
      const key = `goal-daily-${todayISO()}-${user.id}`
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, '1')
        setCelebration({
          type: 'daily',
          text: `Cel dzienny osiągnięty! ${todayTotal} / ${dailyGoal} pompek`,
        })
        setTimeout(() => setCelebration(null), 5000)
      }
    }
  }, [dailyMet, todayTotal, dailyGoal, user.id])

  useEffect(() => {
    if (weeklyMet) {
      // Klucz tygodnia — ISO week (YYYY-Www)
      const now = new Date()
      const yearStart = new Date(now.getFullYear(), 0, 1)
      const weekNum = Math.ceil(
        ((now - yearStart) / 86400000 + yearStart.getDay() + 1) / 7
      )
      const key = `goal-weekly-${now.getFullYear()}-W${weekNum}-${user.id}`
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, '1')
        setCelebration({
          type: 'weekly',
          text: `Cel tygodniowy osiągnięty! ${weekTotal} / ${weeklyGoal} pompek`,
        })
        setTimeout(() => setCelebration(null), 6000)
      }
    }
  }, [weeklyMet, weekTotal, weeklyGoal, user.id])

  // Achievement rotation — nowy tekst przy każdym dodaniu pompek
  const [achievementIdx, setAchievementIdx] = useState(() =>
    Math.floor(Math.random() * ACHIEVEMENTS.length)
  )
  const prevMyTotalRef = useRef(myTotal)
  useEffect(() => {
    if (myTotal > prevMyTotalRef.current && prevMyTotalRef.current > 0) {
      setAchievementIdx((current) => {
        // Losuj nowy indeks różny od obecnego — żeby się nie powtarzał dwa razy z rzędu
        if (ACHIEVEMENTS.length <= 1) return 0
        let next = current
        while (next === current) {
          next = Math.floor(Math.random() * ACHIEVEMENTS.length)
        }
        return next
      })
    }
    prevMyTotalRef.current = myTotal
  }, [myTotal])

  const achievement =
    myTotal === 0 ? ZERO_ACHIEVEMENT : ACHIEVEMENTS[achievementIdx]
  const achievementKey = myTotal === 0 ? 'zero' : `a-${achievementIdx}`

  const leaderboard = useMemo(() => {
    const map = new Map()
    for (const w of workouts) {
      const prev = map.get(w.user_id) ?? { total: 0, email: w.user_email }
      map.set(w.user_id, {
        total: prev.total + w.count,
        email: prev.email || w.user_email,
      })
    }
    return Array.from(map.entries())
      .map(([user_id, v]) => {
        const prof = profiles[user_id]
        const displayName =
          prof?.nick ||
          prof?.name ||
          (v.email ? v.email.split('@')[0] : 'Użytkownik')
        const customInitials = prof?.initials
        const derivedInitials = (
          prof?.nick ||
          prof?.name ||
          (v.email ? v.email : '??')
        )
          .slice(0, 2)
          .toUpperCase()
        const avatarInitials = customInitials || derivedInitials
        return { user_id, ...v, displayName, avatarInitials }
      })
      .sort((a, b) => b.total - a.total)
  }, [workouts, profiles])

  const myProfile = profiles[user.id]
  const myDisplayName =
    myProfile?.nick ||
    myProfile?.name ||
    (user.email ? user.email.split('@')[0] : 'Użytkownik')
  const initials =
    myProfile?.initials ||
    (myProfile?.nick || myProfile?.name || user.email || '??')
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
            className="avatar avatar-with-ring"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu użytkownika"
          >
            <svg className="avatar-ring" viewBox="0 0 48 48" aria-hidden="true">
              <circle cx="24" cy="24" r="21" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
              <circle
                cx="24"
                cy="24"
                r="21"
                fill="none"
                stroke="#CCFF00"
                strokeWidth="3"
                strokeDasharray={2 * Math.PI * 21}
                strokeDashoffset={(2 * Math.PI * 21) * (1 - levelInfo.progress / 100)}
                strokeLinecap="round"
                transform="rotate(-90 24 24)"
                style={{ filter: 'drop-shadow(0 0 4px rgba(204,255,0,0.6))' }}
              />
            </svg>
            <span className="avatar-initials">{initials}</span>
            <span className="avatar-lvl-badge">{levelInfo.level}</span>
          </button>
          {menuOpen && (
            <div className="avatar-dropdown level-popup">
              <div className="level-popup-top">
                <div className="level-popup-name">{myDisplayName}</div>
                <div className="level-popup-rank">
                  {getTitleForTotal(myTotal)}
                </div>
              </div>
              <div className="level-popup-level-box">
                <div className="level-popup-level-label">Poziom</div>
                <div className="level-popup-level-number">{levelInfo.level}</div>
              </div>
              <div className="level-popup-progress">
                <div className="level-popup-progress-head">
                  <span>Do LVL {levelInfo.level + 1}</span>
                  <span>
                    {levelInfo.inLevel} / {levelInfo.needForNext}
                  </span>
                </div>
                <div className="level-popup-progress-track">
                  <div
                    className="level-popup-progress-fill"
                    style={{ width: `${levelInfo.progress}%` }}
                  />
                </div>
              </div>
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
                    return (
                      <li key={entry.user_id} className="leaderboard-item">
                        <div className={`lb-avatar ${isMe ? 'me' : ''}`}>
                          {entry.avatarInitials || '??'}
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

            <div className="stats-tiles">
              <button
                type="button"
                className="stats-tile"
                onClick={() => setStatsModal('chart')}
              >
                <span className="stats-tile-icon">📊</span>
                <span className="stats-tile-label">Wykres tygodniowy</span>
                <span className="stats-tile-hint">Ostatnie 7 dni</span>
              </button>
              <button
                type="button"
                className="stats-tile"
                onClick={() => setStatsModal('records')}
              >
                <span className="stats-tile-icon">🏆</span>
                <span className="stats-tile-label">Rekordy osobiste</span>
                <span className="stats-tile-hint">Twoje najlepsze</span>
              </button>
            </div>

            <section className="card">
              <h3 className="card-title">
                <span>Moja historia</span>
              </h3>
              {loading ? (
                <p className="empty">Ładowanie…</p>
              ) : error ? (
                <p className="error">Błąd: {error}</p>
              ) : (
                <WorkoutList
                  workouts={myWorkouts}
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
            <div className="hero-motivation" key={achievementKey}>
              <h2 className="hero-title">{achievement.title}</h2>
              <p className="hero-sub">{achievement.sub}</p>
            </div>

            <div className="goal-bars">
              <div className={`goal-bar ${dailyMet ? 'met' : ''}`}>
                <div className="goal-bar-head">
                  <span className="label">
                    Cel dzienny {dailyMet && '✓'}
                  </span>
                  <span className="goal-bar-value">
                    <AnimatedCounter value={todayTotal} /> / {dailyGoal}
                  </span>
                </div>
                <div className="goal-bar-track">
                  <div
                    className="goal-bar-fill"
                    style={{ width: `${dailyProgress}%` }}
                  />
                </div>
              </div>

              <div className={`goal-bar ${weeklyMet ? 'met' : ''}`}>
                <div className="goal-bar-head">
                  <span className="label secondary">
                    Cel tygodniowy {weeklyMet && '✓'}
                  </span>
                  <span className="goal-bar-value">
                    <AnimatedCounter value={weekTotal} /> / {weeklyGoal}
                  </span>
                </div>
                <div className="goal-bar-track">
                  <div
                    className="goal-bar-fill secondary"
                    style={{ width: `${weeklyProgress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="stats-row">
              <div className="stat-box primary">
                <span className="label">Seria</span>
                <div className="value">
                  {streak > 0 && <span className="streak-flame">🔥</span>}
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
              badges={badges}
              levelInfo={levelInfo}
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

      {statsModal === 'chart' && (
        <div className="modal-backdrop" onClick={() => setStatsModal(null)}>
          <div
            className="modal stats-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setStatsModal(null)}
              aria-label="Zamknij"
            >
              ✕
            </button>
            <h3>Wykres tygodniowy</h3>
            <p className="muted">Pompki z ostatnich 7 dni</p>
            <div className="chart-bars">
              {weeklyChart.days.map((d) => {
                const heightPct =
                  d.count === 0
                    ? 2
                    : Math.max(6, (d.count / weeklyChart.max) * 100)
                return (
                  <div className="chart-col" key={d.iso}>
                    <span className="chart-value">{d.count}</span>
                    <div
                      className={`chart-bar ${d.isToday ? 'today' : ''}`}
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className={`chart-day ${d.isToday ? 'today' : ''}`}>
                      {d.dayName}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="chart-total">
              Razem: <strong>{weeklyChart.days.reduce((s, d) => s + d.count, 0)}</strong> pompek
            </div>
          </div>
        </div>
      )}

      {statsModal === 'records' && (
        <div className="modal-backdrop" onClick={() => setStatsModal(null)}>
          <div
            className="modal stats-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setStatsModal(null)}
              aria-label="Zamknij"
            >
              ✕
            </button>
            <h3>Rekordy osobiste</h3>
            <p className="muted">Twoje najlepsze wyniki do tej pory</p>
            <div className="records-grid">
              <div className="record">
                <span className="record-icon">💪</span>
                <div className="record-label">Max sesja</div>
                <div className="record-value">
                  {records.maxSession}
                  <span className="record-unit"> reps</span>
                </div>
                {records.maxSessionDate && (
                  <div className="record-date">
                    {formatShortDate(records.maxSessionDate)}
                  </div>
                )}
              </div>
              <div className="record">
                <span className="record-icon">☀️</span>
                <div className="record-label">Max dzień</div>
                <div className="record-value">
                  {records.maxDay}
                  <span className="record-unit"> reps</span>
                </div>
                {records.maxDayDate && (
                  <div className="record-date">
                    {formatShortDate(records.maxDayDate)}
                  </div>
                )}
              </div>
              <div className="record">
                <span className="record-icon">📅</span>
                <div className="record-label">Max 7 dni</div>
                <div className="record-value">
                  {records.maxWeek}
                  <span className="record-unit"> reps</span>
                </div>
              </div>
              <div className="record">
                <span className="record-icon">🔥</span>
                <div className="record-label">Najdłuższa seria</div>
                <div className="record-value">
                  {maxStreak}
                  <span className="record-unit"> {maxStreak === 1 ? 'dzień' : 'dni'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {celebration && (
        <div
          className={`celebration-toast celebration-${celebration.type}`}
          onClick={() => setCelebration(null)}
        >
          <span className="celebration-icon">
            {celebration.type === 'daily' ? '🎯' : '🏆'}
          </span>
          <span className="celebration-text">{celebration.text}</span>
        </div>
      )}

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
