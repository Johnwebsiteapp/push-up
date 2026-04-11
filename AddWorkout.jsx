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
    <form onSubmit={handleSubmit} className="add-form">
      <label>
        Liczba pompek
        <input
          type="number"
          min="1"
          inputMode="numeric"
          value={count}
          onChange={(e) => setCount(e.target.value)}
          placeholder="np. 50"
          required
        />
      </label>
      <label>
        Data
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </label>
      <label>
        Notatka (opcjonalnie)
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="np. Rano, 3 serie"
        />
      </label>
      <button type="submit" disabled={saving}>
        {saving ? 'Zapisywanie…' : 'Dodaj'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  )
}
