import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import AddWorkout from './AddWorkout'
import WorkoutList from './WorkoutList'
import Profile from './Profile'
import { showReminder } from '../notifications'

const ZERO_ACHIEVEMENT = {
  title: 'Podłoga czeka.',
  sub: 'Nie każ jej czekać.',
}

const ACHIEVEMENTS = [
  { title: 'Kanapa płacze.', sub: 'Ale Ty się śmiejesz.' },
  { title: 'Pot leci.', sub: 'Ale duma rośnie szybciej.' },
  { title: 'Mięśnie bolą.', sub: 'To znaczy że działasz.' },
  { title: 'Pizza poczeka.', sub: 'Pompki nie.' },
  { title: 'Lustro się uśmiecha.', sub: 'Do Ciebie.' },
  { title: 'Koszulka się kurczy.', sub: 'A może to Ty rośniesz.' },
  { title: 'Zero wymówek.', sub: 'Tylko wyniki.' },
  { title: 'Dzisiaj bolało.', sub: 'Jutro podziękujesz.' },
  { title: 'Jedna więcej niż wczoraj.', sub: 'To jest postęp.' },
  { title: 'Kebab może być.', sub: 'Ale po pompkach.' },
  { title: 'Twoje ciało Ci dziękuje.', sub: 'Nawet jak narzeka.' },
  { title: 'Ziemia się trzęsie.', sub: 'Bo robisz pompki.' },
  { title: 'Nikt nie widział.', sub: 'Ale licznik wie.' },
  { title: 'Sąsiad słyszy sapanie.', sub: 'Niech się uczy.' },
  { title: 'Jeszcze jedna seria.', sub: 'Powiedziałeś to 3 serie temu.' },
  { title: 'Grawitacja przegrywa.', sub: 'Znowu.' },
  { title: 'Ramiona > wymówki.', sub: 'Proste.' },
  { title: 'Robiłeś pompki.', sub: 'I to wystarczy.' },
  { title: 'Powiedzieli że się nie da.', sub: 'A Ty dałeś radę.' },
  { title: 'Podłoga mówi dziękuję.', sub: 'Za regularne odwiedziny.' },
]

const PLANK_ZERO_ACHIEVEMENT = {
  title: 'Podłoga czeka.',
  sub: 'Przyjmij pozycję i oddychaj.',
}

const PLANK_ACHIEVEMENTS = [
  { title: 'Spokój to siła.', sub: 'Nie ruszaj się.' },
  { title: 'Oddech równy.', sub: 'Ciało w linii.' },
  { title: 'Drżenie? Dobry znak.', sub: 'Mięśnie pracują.' },
  { title: 'Czas zwalnia.', sub: 'Ale Ty trwasz.' },
  { title: 'Core nie kłamie.', sub: 'Wyniki mówią same za siebie.' },
  { title: 'Sekundy mijają.', sub: 'Siła zostaje.' },
  { title: 'Nie myśl. Trzymaj.', sub: 'Głowa wyłączona, ciało włączone.' },
  { title: 'Wytrzymałość to wybór.', sub: 'I Ty go robisz.' },
  { title: 'Każda sekunda się liczy.', sub: 'Dosłownie.' },
  { title: 'Ciało chce odpuścić.', sub: 'Ty decydujesz inaczej.' },
  { title: 'Cisza i praca.', sub: 'Najlepsza kombinacja.' },
  { title: 'Kręgosłup dziękuje.', sub: 'Poważnie.' },
  { title: 'Minuty budują miesiące.', sub: 'Jeden plank na raz.' },
  { title: 'Równowaga to też siła.', sub: 'Pamiętaj o tym.' },
  { title: 'Skupienie > ból.', sub: 'Zawsze.' },
  { title: 'Solidna podstawa.', sub: 'Wszystko zaczyna się od core.' },
  { title: 'Boli? Normalnie.', sub: 'Jutro będzie łatwiej.' },
  { title: 'Trzymałeś.', sub: 'I to wystarczy.' },
  { title: 'Cicho, ale mocno.', sub: 'Plank nie hałasuje. Wyniki tak.' },
  { title: 'Jeszcze kilka sekund.', sub: 'Zawsze można trochę więcej.' },
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
  // Total pompek
  { id: 'first', icon: '🥉', name: 'Pierwszy krok', desc: 'Dodaj pierwszy trening' },
  { id: 'hundred', icon: '💯', name: 'Setka', desc: '100 pompek w sumie' },
  { id: 'half-k', icon: '🥈', name: 'Pół tysiąca', desc: '500 pompek w sumie' },
  { id: 'thousand', icon: '🏅', name: 'Tysiąc', desc: '1000 pompek w sumie' },
  { id: 'three-k', icon: '🎖', name: 'Trzy tysiące', desc: '3000 pompek w sumie' },
  { id: 'five-k', icon: '👑', name: 'Pięć tysięcy', desc: '5000 pompek w sumie' },
  { id: 'ten-k', icon: '💎', name: 'Diament', desc: '10 000 pompek w sumie' },
  // Streak
  { id: 'streak3', icon: '🔥', name: 'Trzy dni', desc: '3 dni z rzędu' },
  { id: 'streak7', icon: '🔥', name: 'Tydzień siły', desc: '7 dni z rzędu' },
  { id: 'streak14', icon: '🌟', name: 'Dwa tygodnie', desc: '14 dni z rzędu' },
  { id: 'streak30', icon: '⭐', name: 'Miesiąc siły', desc: '30 dni z rzędu' },
  { id: 'streak60', icon: '🌠', name: 'Dwa miesiące', desc: '60 dni z rzędu' },
  { id: 'streak100', icon: '☄️', name: 'Stu dni klub', desc: '100 dni z rzędu' },
  // Max sesja
  { id: 'big30', icon: '💪', name: 'Trzydziestka', desc: '30 pompek w jednej sesji' },
  { id: 'big50', icon: '💥', name: 'Pięćdziesiątka', desc: '50 pompek w jednej sesji' },
  { id: 'big100', icon: '🚀', name: 'Setka naraz', desc: '100 pompek w jednej sesji' },
  { id: 'big200', icon: '🌋', name: 'Wulkan', desc: '200 pompek w jednej sesji' },
  // Max dzień
  { id: 'day100', icon: '☀️', name: 'Dzień chwały', desc: '100 pompek w jednym dniu' },
  { id: 'day300', icon: '⚡', name: 'Iskra', desc: '300 pompek w jednym dniu' },
  // Max tydzień
  { id: 'week300', icon: '📅', name: 'Tydzień mocy', desc: '300 pompek w 7 dni' },
  { id: 'week1000', icon: '🏔', name: 'Szczyt tygodnia', desc: '1000 pompek w 7 dni' },
  // Dni aktywne
  { id: 'active10', icon: '🎯', name: 'Dyscyplina', desc: '10 aktywnych dni' },
  { id: 'active30', icon: '🗓', name: 'Miesiąc treningu', desc: '30 aktywnych dni' },
  { id: 'active100', icon: '🏆', name: 'Weteran', desc: '100 aktywnych dni' },
  // Liczba sesji
  { id: 'sessions50', icon: '🎪', name: 'Pół setki sesji', desc: '50 zapisanych sesji' },
  { id: 'sessions200', icon: '🎭', name: 'Dwieście sesji', desc: '200 zapisanych sesji' },
]

function computeBadges(stats) {
  const {
    total,
    maxStreak,
    maxSession,
    maxDay,
    maxWeek,
    daysActive,
    sessionsCount,
  } = stats
  return BADGE_DEFS.map((b) => {
    let unlocked = false
    switch (b.id) {
      case 'first': unlocked = total >= 1; break
      case 'hundred': unlocked = total >= 100; break
      case 'half-k': unlocked = total >= 500; break
      case 'thousand': unlocked = total >= 1000; break
      case 'three-k': unlocked = total >= 3000; break
      case 'five-k': unlocked = total >= 5000; break
      case 'ten-k': unlocked = total >= 10000; break
      case 'streak3': unlocked = maxStreak >= 3; break
      case 'streak7': unlocked = maxStreak >= 7; break
      case 'streak14': unlocked = maxStreak >= 14; break
      case 'streak30': unlocked = maxStreak >= 30; break
      case 'streak60': unlocked = maxStreak >= 60; break
      case 'streak100': unlocked = maxStreak >= 100; break
      case 'big30': unlocked = maxSession >= 30; break
      case 'big50': unlocked = maxSession >= 50; break
      case 'big100': unlocked = maxSession >= 100; break
      case 'big200': unlocked = maxSession >= 200; break
      case 'day100': unlocked = maxDay >= 100; break
      case 'day300': unlocked = maxDay >= 300; break
      case 'week300': unlocked = maxWeek >= 300; break
      case 'week1000': unlocked = maxWeek >= 1000; break
      case 'active10': unlocked = daysActive >= 10; break
      case 'active30': unlocked = daysActive >= 30; break
      case 'active100': unlocked = daysActive >= 100; break
      case 'sessions50': unlocked = sessionsCount >= 50; break
      case 'sessions200': unlocked = sessionsCount >= 200; break
      default: unlocked = false
    }
    return { ...b, unlocked }
  })
}

const DNI_CHART = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb']

const MILESTONES = [100, 250, 500, 1000, 2000, 3000, 5000, 7500, 10000, 15000, 25000]

// Confetti component — rendered when triggered
function ConfettiBurst({ onDone }) {
  useEffect(() => {
    const t = setTimeout(() => onDone && onDone(), 1800)
    return () => clearTimeout(t)
  }, [onDone])

  const particles = useMemo(() => {
    const colors = ['#CCFF00', '#00FDFF', '#FF5C00']
    const list = []
    for (let i = 0; i < 32; i++) {
      const angle = (Math.PI * 2 * i) / 32 + (Math.random() - 0.5) * 0.3
      const distance = 80 + Math.random() * 120
      list.push({
        id: i,
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance,
        rot: Math.random() * 720 - 360,
        color: colors[i % 3],
        delay: Math.random() * 180,
        size: 5 + Math.random() * 5,
      })
    }
    return list
  }, [])

  return (
    <div className="confetti-burst" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="confetti-particle"
          style={{
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
            '--rot': `${p.rot}deg`,
            '--delay': `${p.delay}ms`,
            '--size': `${p.size}px`,
            background: p.color,
            boxShadow: `0 0 8px ${p.color}`,
          }}
        />
      ))}
    </div>
  )
}

function streakLabel(n) {
  if (n === 1) return '1 dzień'
  return `${n} dni`
}

function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatDurationShort(seconds) {
  if (!seconds || seconds < 0) return '0 min'
  const mins = Math.floor(seconds / 60)
  if (mins < 1) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s === 0 ? `${m} min` : `${m}:${String(s).padStart(2, '0')}`
}

function getLevelTitle(level) {
  if (level <= 2) return 'Nowicjusz'
  if (level <= 5) return 'Początkujący'
  if (level <= 9) return 'Regularny'
  if (level <= 14) return 'Zaawansowany'
  if (level <= 19) return 'Weteran'
  return 'Legenda'
}

// Pozostawione dla kompatybilności — zwraca tytuł na bazie systemu poziomów
function getTitleForTotal(total) {
  const { level } = getLevelInfo(total)
  return getLevelTitle(level)
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
  const [exerciseMode, setExerciseMode] = useState('pushup') // 'pushup' | 'plank'
  const [statsModal, setStatsModal] = useState(null) // 'chart' | 'records' | null
  const [statsVisible, setStatsVisible] = useState(false)
  const [chartMode, setChartMode] = useState('pushup')
  const [recordsMode, setRecordsMode] = useState('pushup')
  const [historyMode, setHistoryMode] = useState('pushup')
  const [heroExiting, setHeroExiting] = useState(false)
  const heroAnimTimer = useRef(null)
  const heroDir = useRef(1) // 1 = w prawo (→plank), -1 = w lewo (→pushup)

  function changeExerciseMode(newMode) {
    if (newMode === exerciseMode || heroExiting) return
    heroDir.current = newMode === 'plank' ? 1 : -1
    setHeroExiting(true)
    heroAnimTimer.current = setTimeout(() => {
      setExerciseMode(newMode)
      setHeroExiting(false)
    }, 210)
  }
  const [rankingDetail, setRankingDetail] = useState(null) // leaderboard entry or null

  // Trigger transition IN after mount — double RAF ensures browser paints hidden state first
  useEffect(() => {
    if (statsModal) {
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setStatsVisible(true))
      })
      return () => cancelAnimationFrame(id)
    }
  }, [statsModal])

  function closeStatsModal() {
    if (!statsVisible) return
    setStatsVisible(false) // transition OUT starts immediately
    setTimeout(() => {
      setStatsModal(null)
    }, 320)
  }
  const [confettiKey, setConfettiKey] = useState(0)
  const [confettiActive, setConfettiActive] = useState(false)
  const [newBadge, setNewBadge] = useState(null)
  const prevTotalForMilestoneRef = useRef(null)

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

  // Separacja: pompki vs deska
  const myPushups = useMemo(
    () => myWorkouts.filter((w) => w.exercise_type !== 'plank'),
    [myWorkouts]
  )
  const myPlanks = useMemo(
    () => myWorkouts.filter((w) => w.exercise_type === 'plank'),
    [myWorkouts]
  )

  const myTotal = useMemo(
    () => myPushups.reduce((sum, w) => sum + (w.count || 0), 0),
    [myPushups]
  )

  const myPlankTotalSeconds = useMemo(
    () => myPlanks.reduce((sum, w) => sum + (w.duration_seconds || 0), 0),
    [myPlanks]
  )

  const todayTotal = useMemo(() => {
    const t = todayISO()
    return myPushups
      .filter((w) => w.performed_at === t)
      .reduce((sum, w) => sum + (w.count || 0), 0)
  }, [myPushups])

  const todayPlankSeconds = useMemo(() => {
    const t = todayISO()
    return myPlanks
      .filter((w) => w.performed_at === t)
      .reduce((sum, w) => sum + (w.duration_seconds || 0), 0)
  }, [myPlanks])

  // Tydzień = od poniedziałku do dziś
  const mondayISOVal = useMemo(() => {
    const now = new Date()
    const todayDay = now.getDay()
    const daysSinceMonday = (todayDay + 6) % 7
    const monday = new Date(now)
    monday.setDate(now.getDate() - daysSinceMonday)
    return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
  }, [])

  const weekTotal = useMemo(() => {
    return myPushups
      .filter((w) => w.performed_at >= mondayISOVal)
      .reduce((sum, w) => sum + (w.count || 0), 0)
  }, [myPushups, mondayISOVal])

  const weekPlankSeconds = useMemo(() => {
    return myPlanks
      .filter((w) => w.performed_at >= mondayISOVal)
      .reduce((sum, w) => sum + (w.duration_seconds || 0), 0)
  }, [myPlanks, mondayISOVal])

  const streak = useMemo(() => calculateStreak(myWorkouts), [myWorkouts])
  const pushupStreak = useMemo(() => calculateStreak(myPushups), [myPushups])
  const plankStreak = useMemo(() => calculateStreak(myPlanks), [myPlanks])
  const maxStreak = useMemo(() => calculateMaxStreak(myWorkouts), [myWorkouts])

  // Wykres tygodniowy — aktualny tydzień od poniedziałku do niedzieli
  const weeklyChart = useMemo(() => {
    const days = []
    const now = new Date()
    const todayDay = now.getDay() // 0=Nd, 1=Pn, ..., 6=Sb
    const daysSinceMonday = (todayDay + 6) % 7 // Pn=0, Nd=6
    const monday = new Date(now)
    monday.setDate(now.getDate() - daysSinceMonday)

    const todayIso = todayISO()
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const count = myWorkouts
        .filter((w) => w.performed_at === iso)
        .reduce((sum, w) => sum + w.count, 0)
      days.push({
        iso,
        dayName: DNI_CHART[d.getDay()],
        count,
        isToday: iso === todayIso,
      })
    }
    const max = Math.max(1, ...days.map((d) => d.count))
    return { days, max }
  }, [myWorkouts])

  // Wykres tygodniowy — Plank (sekundy)
  const weeklyChartPlank = useMemo(() => {
    const days = []
    const now = new Date()
    const daysSinceMonday = (now.getDay() + 6) % 7
    const monday = new Date(now)
    monday.setDate(now.getDate() - daysSinceMonday)
    const todayIso = todayISO()
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const secs = myPlanks
        .filter((w) => w.performed_at === iso)
        .reduce((sum, w) => sum + (w.duration_seconds || 0), 0)
      days.push({ iso, dayName: DNI_CHART[d.getDay()], count: secs, isToday: iso === todayIso })
    }
    const max = Math.max(1, ...days.map((d) => d.count))
    return { days, max }
  }, [myPlanks])

  // Rekordy osobiste + dodatkowe statystyki potrzebne do odznak
  const records = useMemo(() => {
    if (myWorkouts.length === 0) {
      return {
        maxSession: 0,
        maxDay: 0,
        maxWeek: 0,
        maxSessionDate: null,
        maxDayDate: null,
        daysActive: 0,
        sessionsCount: 0,
      }
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
      daysActive: Object.keys(byDay).length,
      sessionsCount: myWorkouts.length,
    }
  }, [myWorkouts])

  // Rekordy osobiste — Plank
  const plankRecords = useMemo(() => {
    if (myPlanks.length === 0) return { maxSession: 0, maxDay: 0, maxWeek: 0, maxSessionDate: null, maxDayDate: null }
    const maxSession = Math.max(...myPlanks.map((w) => w.duration_seconds || 0))
    const maxSessionEntry = myPlanks.find((w) => (w.duration_seconds || 0) === maxSession)
    const byDay = {}
    for (const w of myPlanks) {
      byDay[w.performed_at] = (byDay[w.performed_at] || 0) + (w.duration_seconds || 0)
    }
    let maxDay = 0, maxDayDate = null
    for (const [date, secs] of Object.entries(byDay)) {
      if (secs > maxDay) { maxDay = secs; maxDayDate = date }
    }
    const sortedDates = Object.keys(byDay).sort()
    let maxWeek = 0
    for (let i = 0; i < sortedDates.length; i++) {
      const windowStart = new Date(sortedDates[i])
      let sum = 0
      for (let j = i; j < sortedDates.length; j++) {
        const diff = Math.round((new Date(sortedDates[j]) - windowStart) / (1000 * 60 * 60 * 24))
        if (diff > 6) break
        sum += byDay[sortedDates[j]]
      }
      if (sum > maxWeek) maxWeek = sum
    }
    return { maxSession, maxSessionDate: maxSessionEntry?.performed_at, maxDay, maxDayDate, maxWeek }
  }, [myPlanks])

  const levelInfo = useMemo(() => getLevelInfo(myTotal), [myTotal])

  const badges = useMemo(
    () =>
      computeBadges({
        total: myTotal,
        maxStreak,
        maxSession: records.maxSession,
        maxDay: records.maxDay,
        maxWeek: records.maxWeek,
        daysActive: records.daysActive,
        sessionsCount: records.sessionsCount,
      }),
    [myTotal, maxStreak, records]
  )

  // Cele z profilu (defaultowe jeśli brak)
  const myProfileData = profiles[user.id]
  const dailyGoal = myProfileData?.daily_goal || 30
  const weeklyGoal = myProfileData?.weekly_goal || 150
  const dailyGoalPlank = myProfileData?.daily_goal_plank_seconds || 180
  const weeklyGoalPlank = myProfileData?.weekly_goal_plank_seconds || 900
  const dailyProgress = Math.min(100, Math.round((todayTotal / dailyGoal) * 100))
  const weeklyProgress = Math.min(
    100,
    Math.round((weekTotal / weeklyGoal) * 100)
  )
  const dailyPlankProgress = Math.min(
    100,
    Math.round((todayPlankSeconds / dailyGoalPlank) * 100)
  )
  const weeklyPlankProgress = Math.min(
    100,
    Math.round((weekPlankSeconds / weeklyGoalPlank) * 100)
  )
  const dailyMet = todayTotal >= dailyGoal && dailyGoal > 0
  const weeklyMet = weekTotal >= weeklyGoal && weeklyGoal > 0
  const dailyPlankMet = todayPlankSeconds >= dailyGoalPlank && dailyGoalPlank > 0
  const weeklyPlankMet = weekPlankSeconds >= weeklyGoalPlank && weeklyGoalPlank > 0

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

  // Achievement rotation — plank (rotuje przy każdej nowej sesji deski)
  const [plankAchievementIdx, setPlankAchievementIdx] = useState(() =>
    Math.floor(Math.random() * PLANK_ACHIEVEMENTS.length)
  )
  const prevPlankCountRef = useRef(myPlanks.length)
  useEffect(() => {
    if (myPlanks.length > prevPlankCountRef.current) {
      setPlankAchievementIdx((current) => {
        if (PLANK_ACHIEVEMENTS.length <= 1) return 0
        let next = current
        while (next === current) next = Math.floor(Math.random() * PLANK_ACHIEVEMENTS.length)
        return next
      })
    }
    prevPlankCountRef.current = myPlanks.length
  }, [myPlanks.length])

  const plankAchievement =
    myPlanks.length === 0 ? PLANK_ZERO_ACHIEVEMENT : PLANK_ACHIEVEMENTS[plankAchievementIdx]
  const plankAchievementKey = myPlanks.length === 0 ? 'plank-zero' : `pa-${plankAchievementIdx}`

  // Przypomnienie gdy wracasz do apki i nie zrobiłeś celu
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState !== 'visible') return
      if (!dailyGoal || dailyGoal <= 0) return

      const remaining = dailyGoal - todayTotal
      if (remaining > 0) {
        showReminder(
          'POMPKI ⚡',
          remaining >= dailyGoal
            ? `Nie zapomnij dziś o pompkach! Cel: ${dailyGoal} pompek.`
            : `Zostało Ci ${remaining} pompek do celu dziennego!`
        )
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () =>
      document.removeEventListener('visibilitychange', handleVisibility)
  }, [todayTotal, dailyGoal])

  // Milestone detection — confetti burst when crossing a milestone
  useEffect(() => {
    // Initial load: set baseline, no celebration
    if (prevTotalForMilestoneRef.current === null) {
      prevTotalForMilestoneRef.current = myTotal
      return
    }
    const prev = prevTotalForMilestoneRef.current
    if (myTotal > prev) {
      const crossed = MILESTONES.find((m) => prev < m && myTotal >= m)
      if (crossed) {
        const key = `milestone-${crossed}-${user.id}`
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, '1')
          setConfettiKey((k) => k + 1)
          setConfettiActive(true)
          setCelebration({
            type: 'milestone',
            text: `${crossed} POMPEK! Milestone odblokowany!`,
          })
          setTimeout(() => setCelebration(null), 5500)
        }
      }
    }
    prevTotalForMilestoneRef.current = myTotal
  }, [myTotal, user.id])

  // Badge unlock detection — new badge popup
  const prevBadgesRef = useRef(null)
  useEffect(() => {
    if (prevBadgesRef.current === null) {
      prevBadgesRef.current = badges
      return
    }
    const prev = prevBadgesRef.current
    for (let i = 0; i < badges.length; i++) {
      if (badges[i].unlocked && !prev[i]?.unlocked) {
        const key = `badge-${badges[i].id}-${user.id}`
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, '1')
          setNewBadge(badges[i])
          setTimeout(() => setNewBadge(null), 4500)
          break // show only first newly unlocked
        }
      }
    }
    prevBadgesRef.current = badges
  }, [badges, user.id])

  const leaderboard = useMemo(() => {
    const map = new Map()
    for (const w of workouts) {
      const prev = map.get(w.user_id) ?? { total: 0, email: w.user_email }
      map.set(w.user_id, {
        total: prev.total + w.count,
        email: prev.email || w.user_email,
      })
    }
    const t = todayISO()
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
        const entryLevel = getLevelInfo(v.total).level

        // Per-user dodatkowe statystyki
        const userWorkouts = workouts.filter((w) => w.user_id === user_id)
        const todayCount = userWorkouts
          .filter((w) => w.performed_at === t)
          .reduce((s, w) => s + w.count, 0)
        const daysActive = new Set(userWorkouts.map((w) => w.performed_at)).size
        const maxSession = userWorkouts.length
          ? Math.max(...userWorkouts.map((w) => w.count))
          : 0
        const userStreak = calculateStreak(userWorkouts)
        const sessionsCount = userWorkouts.length

        return {
          user_id,
          ...v,
          displayName,
          avatarInitials,
          level: entryLevel,
          levelTitle: getLevelTitle(entryLevel),
          todayCount,
          daysActive,
          maxSession,
          streak: userStreak,
          sessionsCount,
        }
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
    <div className="dashboard" data-tab={tab}>
      <header className="topbar">
        <div className="brand">
          <span className="brand-bolt-wrap" aria-hidden="true">
            <span className="brand-bolt-trail brand-bolt-trail-2">⚡</span>
            <span className="brand-bolt-trail brand-bolt-trail-1">⚡</span>
            <span className="brand-bolt">⚡</span>
          </span>
          <span>POMPKI</span>
        </div>
        <div className="topbar-chips">
          <div
            className="topbar-count topbar-count-pushup"
            aria-label={`Łącznie ${myTotal} pompek`}
            title="Wszystkie Twoje pompki od początku"
          >
            <span className="topbar-count-icon">💪</span>
            <span className="topbar-count-value">
              <AnimatedCounter value={myTotal} />
            </span>
            <span className="topbar-count-label">pompek</span>
          </div>
          <div
            className="topbar-count topbar-count-plank"
            aria-label={`Łącznie ${formatDuration(myPlankTotalSeconds)} planka`}
            title="Łączny czas planka od początku"
          >
            <span className="topbar-count-icon">🧘</span>
            <span className="topbar-count-value">
              {formatDuration(myPlankTotalSeconds)}
            </span>
            <span className="topbar-count-label">plank</span>
          </div>
        </div>
        <div className="avatar-menu">
          <button
            className={`avatar avatar-with-ring ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu użytkownika"
            aria-expanded={menuOpen}
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
                style={{ filter: 'drop-shadow(0 0 2px rgba(204,255,0,0.35))' }}
              />
            </svg>
            <span className="avatar-initials">{initials}</span>
            <span className="avatar-lvl-badge">{levelInfo.level}</span>
          </button>
          <div
            className={`avatar-dropdown level-popup ${menuOpen ? 'open' : ''}`}
            aria-hidden={!menuOpen}
          >
            <div className="level-popup-top">
              <div className="level-popup-name">{myDisplayName}</div>
              <div className="level-popup-rank">
                {getLevelTitle(levelInfo.level)}
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
        </div>
        {menuOpen && (
          <div
            className="avatar-backdrop"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
        )}
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
                      <li
                        key={entry.user_id}
                        className="leaderboard-item clickable"
                        onClick={() => setRankingDetail(entry)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className={`lb-avatar ${isMe ? 'me' : ''}`}>
                          {entry.avatarInitials || '??'}
                          <span className="lb-rank">#{idx + 1}</span>
                        </div>
                        <div className="lb-info">
                          <div className="lb-name">
                            {entry.displayName}
                            {isMe && ' (Ty)'}
                          </div>
                          <div className="lb-title">
                            LVL {entry.level} · {entry.levelTitle}
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
              <div className="history-mode-switch">
                <button
                  type="button"
                  className={`history-mode-btn ${historyMode === 'pushup' ? 'active' : ''}`}
                  onClick={() => setHistoryMode('pushup')}
                >
                  💪 Pompki
                </button>
                <button
                  type="button"
                  className={`history-mode-btn ${historyMode === 'plank' ? 'active' : ''}`}
                  onClick={() => setHistoryMode('plank')}
                >
                  🧘 Plank
                </button>
              </div>
              {loading ? (
                <p className="empty">Ładowanie…</p>
              ) : error ? (
                <p className="error">Błąd: {error}</p>
              ) : (
                <WorkoutList
                  workouts={historyMode === 'pushup' ? myPushups : myPlanks}
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
          <section className={`hero hero-${exerciseMode}`}>
            <div className="hero-mode-switch" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={exerciseMode === 'pushup'}
                className={`hero-mode-btn ${exerciseMode === 'pushup' ? 'active' : ''}`}
                onClick={() => changeExerciseMode('pushup')}
              >
                💪 Pompki
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={exerciseMode === 'plank'}
                className={`hero-mode-btn ${exerciseMode === 'plank' ? 'active' : ''}`}
                onClick={() => changeExerciseMode('plank')}
              >
                🧘 Plank
              </button>
            </div>

            <div
              key={exerciseMode}
              className={`hero-body${heroExiting ? ' hero-body-exit' : ''}`}
              style={{ '--hero-dir': heroDir.current }}
            >
            {exerciseMode === 'pushup' ? (
              <>
                <div className="hero-count">
                  <div className="hero-number">
                    <AnimatedCounter value={todayTotal} />
                    {confettiActive && (
                      <ConfettiBurst
                        key={confettiKey}
                        onDone={() => setConfettiActive(false)}
                      />
                    )}
                  </div>
                  <div className="hero-label">Pompki dzisiaj</div>
                </div>
                <div className="hero-motivation" key={achievementKey}>
                  <h2 className="hero-title">{achievement.title}</h2>
                  <p className="hero-sub">{achievement.sub}</p>
                </div>
                <div className="stats-row">
                  <div className="stat-box primary">
                    <span className="label">Seria</span>
                    <div className="value">
                      {pushupStreak > 0 && <span className="streak-flame">🔥</span>}
                      <AnimatedCounter value={pushupStreak} />{' '}
                      {pushupStreak === 1 ? 'dzień' : 'dni'}
                    </div>
                  </div>
                  <div className="stat-box secondary">
                    <span className="label">Tydzień</span>
                    <div className="value">
                      <AnimatedCounter value={weekTotal} /> pompek
                    </div>
                  </div>
                </div>
                <div className="goal-bars">
                  <div className={`goal-bar ${dailyMet ? 'met' : ''}`}>
                    <div className="goal-bar-head">
                      <span className="label">
                        Cel dzienny
                        {dailyMet && <span className="goal-check">✓</span>}
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
                        Cel tygodniowy
                        {weeklyMet && <span className="goal-check">✓</span>}
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
              </>
            ) : (
              <>
                <div className="hero-count">
                  <div className="hero-number hero-number-plank">
                    {formatDuration(todayPlankSeconds)}
                  </div>
                  <div className="hero-label">Plank dzisiaj</div>
                </div>
                <div className="hero-motivation" key={plankAchievementKey}>
                  <h2 className="hero-title">{plankAchievement.title}</h2>
                  <p className="hero-sub">{plankAchievement.sub}</p>
                </div>
                <div className="stats-row">
                  <div className="stat-box primary">
                    <span className="label">Seria</span>
                    <div className="value">
                      {plankStreak > 0 && <span className="streak-flame">🔥</span>}
                      <AnimatedCounter value={plankStreak} />{' '}
                      {plankStreak === 1 ? 'dzień' : 'dni'}
                    </div>
                  </div>
                  <div className="stat-box secondary">
                    <span className="label">Tydzień</span>
                    <div className="value">
                      {formatDurationShort(weekPlankSeconds)}
                    </div>
                  </div>
                </div>
                <div className="goal-bars">
                  <div className={`goal-bar ${dailyPlankMet ? 'met' : ''}`}>
                    <div className="goal-bar-head">
                      <span className="label">
                        Cel dzienny
                        {dailyPlankMet && <span className="goal-check">✓</span>}
                      </span>
                      <span className="goal-bar-value">
                        {formatDuration(todayPlankSeconds)} /{' '}
                        {formatDuration(dailyGoalPlank)}
                      </span>
                    </div>
                    <div className="goal-bar-track">
                      <div
                        className="goal-bar-fill"
                        style={{ width: `${dailyPlankProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className={`goal-bar ${weeklyPlankMet ? 'met' : ''}`}>
                    <div className="goal-bar-head">
                      <span className="label secondary">
                        Cel tygodniowy
                        {weeklyPlankMet && <span className="goal-check">✓</span>}
                      </span>
                      <span className="goal-bar-value">
                        {formatDurationShort(weekPlankSeconds)} /{' '}
                        {formatDurationShort(weeklyGoalPlank)}
                      </span>
                    </div>
                    <div className="goal-bar-track">
                      <div
                        className="goal-bar-fill secondary"
                        style={{ width: `${weeklyPlankProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
            </div>
          </section>

          <AddWorkout user={user} mode={exerciseMode} onModeChange={changeExerciseMode} />
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

      {rankingDetail && (
        <div
          className="modal-backdrop"
          onClick={() => setRankingDetail(null)}
        >
          <div
            className="modal ranking-detail"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rd-header">
              <div className={`rd-avatar ${rankingDetail.user_id === user.id ? 'me' : ''}`}>
                {rankingDetail.avatarInitials}
              </div>
              <div className="rd-info">
                <div className="rd-name">
                  {rankingDetail.displayName}
                  {rankingDetail.user_id === user.id && ' (Ty)'}
                </div>
                <div className="rd-level">
                  LVL {rankingDetail.level} · {rankingDetail.levelTitle}
                </div>
              </div>
              <button
                type="button"
                className="modal-close rd-close"
                onClick={() => setRankingDetail(null)}
              >
                ✕
              </button>
            </div>

            <div className="rd-today">
              <span className="rd-today-number">{rankingDetail.todayCount}</span>
              <span className="rd-today-label">pompek dzisiaj</span>
            </div>

            <div className="rd-stats">
              <div className="rd-stat">
                <span className="rd-stat-value">{rankingDetail.total}</span>
                <span className="rd-stat-label">Razem</span>
              </div>
              <div className="rd-stat">
                <span className="rd-stat-value">
                  {rankingDetail.streak > 0 && '🔥 '}{rankingDetail.streak}
                </span>
                <span className="rd-stat-label">Seria dni</span>
              </div>
              <div className="rd-stat">
                <span className="rd-stat-value">{rankingDetail.maxSession}</span>
                <span className="rd-stat-label">Max sesja</span>
              </div>
              <div className="rd-stat">
                <span className="rd-stat-value">{rankingDetail.daysActive}</span>
                <span className="rd-stat-label">Dni aktywne</span>
              </div>
            </div>

            <div className="rd-footer">
              <span className="rd-footer-stat">
                {rankingDetail.sessionsCount} sesji łącznie
              </span>
            </div>
          </div>
        </div>
      )}

      {statsModal && (
        <div
          className={`modal-backdrop stats-backdrop ${statsVisible ? 'visible' : ''}`}
          onClick={closeStatsModal}
        >
          <div
            className="modal stats-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {statsModal === 'chart' && (
              <>
                <div className="stats-modal-header">
                  <h3>Wykres tygodniowy</h3>
                  <button
                    type="button"
                    className="modal-close"
                    onClick={closeStatsModal}
                    aria-label="Zamknij"
                  >
                    ✕
                  </button>
                </div>
                <div className="stats-modal-toggle">
                  <button
                    type="button"
                    className={`stats-toggle-btn ${chartMode === 'pushup' ? 'active' : ''}`}
                    onClick={() => setChartMode('pushup')}
                  >
                    💪 Pompki
                  </button>
                  <button
                    type="button"
                    className={`stats-toggle-btn ${chartMode === 'plank' ? 'active' : ''}`}
                    onClick={() => setChartMode('plank')}
                  >
                    🧘 Plank
                  </button>
                </div>
                {(() => {
                  const chart = chartMode === 'pushup' ? weeklyChart : weeklyChartPlank
                  const isPlank = chartMode === 'plank'
                  const total = chart.days.reduce((s, d) => s + d.count, 0)
                  return (
                    <>
                      <div className="chart-bars">
                        {chart.days.map((d) => {
                          const heightPct = d.count === 0 ? 2 : Math.max(6, (d.count / chart.max) * 100)
                          return (
                            <div className="chart-col" key={d.iso}>
                              <span className="chart-value">
                                {isPlank ? (d.count > 0 ? formatDuration(d.count) : '–') : d.count}
                              </span>
                              <div className={`chart-bar ${isPlank ? 'plank' : ''} ${d.isToday ? 'today' : ''}`} style={{ height: `${heightPct}%` }} />
                              <span className={`chart-day ${d.isToday ? 'today' : ''}`}>{d.dayName}</span>
                            </div>
                          )
                        })}
                      </div>
                      <div className="chart-total">
                        Razem: <strong>{isPlank ? formatDuration(total) : total}</strong>{' '}
                        {isPlank ? 'plank' : 'pompek'}
                      </div>
                    </>
                  )
                })()}
              </>
            )}

            {statsModal === 'records' && (
              <>
                <div className="stats-modal-header">
                  <h3>Rekordy osobiste</h3>
                  <button
                    type="button"
                    className="modal-close"
                    onClick={closeStatsModal}
                    aria-label="Zamknij"
                  >
                    ✕
                  </button>
                </div>
                <div className="stats-modal-toggle">
                  <button
                    type="button"
                    className={`stats-toggle-btn ${recordsMode === 'pushup' ? 'active' : ''}`}
                    onClick={() => setRecordsMode('pushup')}
                  >
                    💪 Pompki
                  </button>
                  <button
                    type="button"
                    className={`stats-toggle-btn ${recordsMode === 'plank' ? 'active' : ''}`}
                    onClick={() => setRecordsMode('plank')}
                  >
                    🧘 Plank
                  </button>
                </div>
                {recordsMode === 'pushup' ? (
                  <div className="records-grid">
                    <div className="record">
                      <span className="record-icon">💪</span>
                      <div className="record-label">Max sesja</div>
                      <div className="record-value">{records.maxSession}<span className="record-unit"> reps</span></div>
                      {records.maxSessionDate && <div className="record-date">{formatShortDate(records.maxSessionDate)}</div>}
                    </div>
                    <div className="record">
                      <span className="record-icon">☀️</span>
                      <div className="record-label">Max dzień</div>
                      <div className="record-value">{records.maxDay}<span className="record-unit"> reps</span></div>
                      {records.maxDayDate && <div className="record-date">{formatShortDate(records.maxDayDate)}</div>}
                    </div>
                    <div className="record">
                      <span className="record-icon">📅</span>
                      <div className="record-label">Max 7 dni</div>
                      <div className="record-value">{records.maxWeek}<span className="record-unit"> reps</span></div>
                    </div>
                    <div className="record">
                      <span className="record-icon">🔥</span>
                      <div className="record-label">Najdłuższa seria</div>
                      <div className="record-value">{maxStreak}<span className="record-unit"> {maxStreak === 1 ? 'dzień' : 'dni'}</span></div>
                    </div>
                  </div>
                ) : (
                  <div className="records-grid">
                    <div className="record">
                      <span className="record-icon">🧘</span>
                      <div className="record-label">Max sesja</div>
                      <div className="record-value">{formatDuration(plankRecords.maxSession)}</div>
                      {plankRecords.maxSessionDate && <div className="record-date">{formatShortDate(plankRecords.maxSessionDate)}</div>}
                    </div>
                    <div className="record">
                      <span className="record-icon">☀️</span>
                      <div className="record-label">Max dzień</div>
                      <div className="record-value">{formatDuration(plankRecords.maxDay)}</div>
                      {plankRecords.maxDayDate && <div className="record-date">{formatShortDate(plankRecords.maxDayDate)}</div>}
                    </div>
                    <div className="record">
                      <span className="record-icon">📅</span>
                      <div className="record-label">Max 7 dni</div>
                      <div className="record-value">{formatDuration(plankRecords.maxWeek)}</div>
                    </div>
                    <div className="record">
                      <span className="record-icon">🔥</span>
                      <div className="record-label">Najdłuższa seria</div>
                      <div className="record-value">{plankStreak}<span className="record-unit"> {plankStreak === 1 ? 'dzień' : 'dni'}</span></div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {newBadge && (
        <div
          className="badge-popup"
          onClick={() => setNewBadge(null)}
          role="button"
        >
          <div className="badge-popup-icon">{newBadge.icon}</div>
          <div className="badge-popup-info">
            <div className="badge-popup-label">Odblokowane!</div>
            <div className="badge-popup-name">{newBadge.name}</div>
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
