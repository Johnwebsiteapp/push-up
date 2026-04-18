import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import PlankTimer from './PlankTimer'

function todayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function AddWorkout({ user, mode: modeProp, onModeChange }) {
  const [internalMode, setInternalMode] = useState('pushup')
  const mode = modeProp ?? internalMode
  const setMode = onModeChange ?? setInternalMode
  const [count, setCount] = useState('')
  const [date, setDate] = useState(todayISO())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showTimer, setShowTimer] = useState(false)

  // Animacja przełączania trybu
  const [displayMode, setDisplayMode] = useState(mode)
  const [exiting, setExiting] = useState(false)
  const dirRef = useRef(1)
  const timerRef = useRef(null)

  useEffect(() => {
    if (mode === displayMode) return
    dirRef.current = mode === 'plank' ? 1 : -1
    setExiting(true)
    timerRef.current = setTimeout(() => {
      setDisplayMode(mode)
      setExiting(false)
    }, 210)
    return () => clearTimeout(timerRef.current)
  }, [mode])

  const QUICK_ADDS = [10, 15, 20]

  function quickAdd(n, event) {
    const current = parseInt(count, 10) || 0
    setCount(String(current + n))
    if (error) setError(null)

    if (event && event.currentTarget) {
      const btn = event.currentTarget
      const rect = btn.getBoundingClientRect()
      const x = (event.clientX || rect.left + rect.width / 2) - rect.left
      const y = (event.clientY || rect.top + rect.height / 2) - rect.top
      const ripple = document.createElement('span')
      ripple.className = 'quick-add-ripple'
      ripple.style.left = `${x}px`
      ripple.style.top = `${y}px`
      btn.appendChild(ripple)
      setTimeout(() => {
        if (ripple.parentNode) ripple.parentNode.removeChild(ripple)
      }, 650)
    }
  }

  function resetCount() {
    setCount('')
    if (error) setError(null)
  }

  async function handlePushupSubmit(e) {
    e.preventDefault()
    setError(null)

    const n = parseInt(count, 10)
    if (!n || n <= 0) {
      setError('Podaj liczbę pompek większą od zera.')
      return
    }

    setSaving(true)
    const { error } = await supabase.from('workouts').insert({
      user_id: user.id,
      user_email: user.email,
      exercise_type: 'pushup',
      count: n,
      duration_seconds: null,
      performed_at: date,
      note: null,
    })
    setSaving(false)

    if (error) {
      setError(error.message)
    } else {
      setCount('')
      setDate(todayISO())
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  async function handlePlankSave(seconds) {
    setSaving(true)
    const { error } = await supabase.from('workouts').insert({
      user_id: user.id,
      user_email: user.email,
      exercise_type: 'plank',
      count: null,
      duration_seconds: seconds,
      performed_at: todayISO(),
      note: null,
    })
    setSaving(false)

    if (error) {
      alert('Błąd zapisu: ' + error.message)
    } else {
      setShowTimer(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <>
      <form
        onSubmit={handlePushupSubmit}
        className="quick-log"
        onSubmitCapture={(e) => {
          if (mode === 'plank') e.preventDefault()
        }}
      >
        <div className="quick-log-header">
          <input
            type="date"
            className="quick-log-date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            aria-label="Data treningu"
            disabled={displayMode === 'plank'}
          />
          <div className="quick-log-mode-switch" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'pushup'}
              className={`mode-btn ${mode === 'pushup' ? 'active' : ''}`}
              onClick={() => setMode('pushup')}
            >
              💪 Pompki
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'plank'}
              className={`mode-btn ${mode === 'plank' ? 'active' : ''}`}
              onClick={() => setMode('plank')}
            >
              🧘 Plank
            </button>
          </div>
        </div>

        <div
          key={displayMode}
          className={`hero-body${exiting ? ' hero-body-exit' : ''}`}
          style={{ '--hero-dir': dirRef.current }}
        >
          {displayMode === 'pushup' && (
            <>
              <div className="quick-log-big">
                <input
                  className="quick-log-input"
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  placeholder="00"
                  required={mode === 'pushup'}
                />
                <div className="quick-log-sub">Liczba pompek</div>
              </div>

              <div className="quick-add-row">
                {QUICK_ADDS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="quick-add-btn"
                    onClick={(e) => quickAdd(n, e)}
                    disabled={saving}
                    aria-label={`Dodaj ${n} pompek`}
                  >
                    +{n}
                  </button>
                ))}
                <button
                  type="button"
                  className="quick-add-reset"
                  onClick={resetCount}
                  disabled={saving || !count}
                  aria-label="Wyczyść licznik"
                  title="Wyczyść"
                >
                  ↺
                </button>
              </div>

              <button type="submit" className="confirm-btn" disabled={saving}>
                {saving ? 'Zapisywanie…' : 'Zapisz trening'}
              </button>
              {error && (
                <p className="error" style={{ marginTop: 10, textAlign: 'center' }}>
                  {error}
                </p>
              )}
            </>
          )}

          {displayMode === 'plank' && (
            <div className="plank-launch">
              <div className="plank-launch-icon">🧘</div>
              <div className="plank-launch-text">
                Timer wbudowany — kliknij Rozpocznij, przyjmij pozycję i wytrzymaj.
              </div>
              <button
                type="button"
                className="confirm-btn plank-launch-btn"
                onClick={() => setShowTimer(true)}
                disabled={saving}
              >
                ▶ Rozpocznij Plank
              </button>
            </div>
          )}
        </div>
      </form>

      {showTimer && (
        <PlankTimer
          onSave={handlePlankSave}
          onClose={() => setShowTimer(false)}
        />
      )}
    </>
  )
}
