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
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

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
      note: note.trim() || null,
    })
    setSaving(false)

    if (error) {
      setError(error.message)
    } else {
      setCount('')
      setNote('')
      setDate(todayISO())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="quick-log">
      <div className="quick-log-title">Quick Log Session</div>
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
        <div className="quick-log-sub">Total Push-ups</div>
      </div>

      <div className="quick-log-extras">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          aria-label="Data"
        />
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Notatka (opcjonalnie)"
          aria-label="Notatka"
        />
      </div>

      <button type="submit" className="confirm-btn" disabled={saving}>
        {saving ? 'Zapisywanie…' : 'Confirm Log'}
      </button>
      {error && <p className="error" style={{ marginTop: 10, textAlign: 'center' }}>{error}</p>}
    </form>
  )
}
