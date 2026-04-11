import { useState } from 'react'
import { supabase } from '../supabaseClient'

function todayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function AddWorkout({ user }) {
  const [count, setCount] = useState('')
  const [date, setDate] = useState(todayISO())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const QUICK_ADDS = [10, 15, 20]

  function quickAdd(n, event) {
    const current = parseInt(count, 10) || 0
    setCount(String(current + n))
    if (error) setError(null)

    // Ripple effect — create element at click position
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

  async function handleSubmit(e) {
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
      count: n,
      performed_at: date,
      note: null,
    })
    setSaving(false)

    if (error) {
      setError(error.message)
    } else {
      setCount('')
      setDate(todayISO())
      // Przewiń na górę żeby użytkownik zobaczył zaktualizowany licznik
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="quick-log">
      <div className="quick-log-header">
        <input
          type="date"
          className="quick-log-date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          aria-label="Data treningu"
        />
        <span className="quick-log-title-side">Szybki zapis</span>
      </div>

      <div className="quick-log-big">
        <input
          className="quick-log-input"
          type="number"
          min="1"
          inputMode="numeric"
          value={count}
          onChange={(e) => setCount(e.target.value)}
          placeholder="00"
          required
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
    </form>
  )
}
