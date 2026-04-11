import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Profile({ user, onProfileChange }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [form, setForm] = useState({
    nick: '',
    name: '',
    height_cm: '',
    weight_kg: '',
  })

  useEffect(() => {
    let ignore = false
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!ignore) {
        if (error && error.code !== 'PGRST116') {
          setMessage({
            type: 'error',
            text: 'Nie można wczytać profilu: ' + error.message,
          })
        } else if (data) {
          setForm({
            nick: data.nick ?? user.user_metadata?.nick ?? '',
            name: data.name ?? '',
            height_cm: data.height_cm ?? '',
            weight_kg: data.weight_kg ?? '',
          })
        } else {
          // Profil jeszcze nie istnieje — pre-fill nickiem z rejestracji
          setForm((f) => ({
            ...f,
            nick: user.user_metadata?.nick ?? '',
          }))
        }
        setLoading(false)
      }
    }
    load()
    return () => {
      ignore = true
    }
  }, [user.id, user.user_metadata])

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const payload = {
      user_id: user.id,
      nick: form.nick.trim() || null,
      name: form.name.trim() || null,
      height_cm: form.height_cm ? parseInt(form.height_cm, 10) : null,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('profiles').upsert(payload)
    setSaving(false)

    if (error) {
      setMessage({ type: 'error', text: 'Błąd zapisu: ' + error.message })
    } else {
      setMessage({ type: 'ok', text: 'Profil zapisany.' })
      if (onProfileChange) onProfileChange()
      setTimeout(() => setMessage(null), 2500)
    }
  }

  const bmi =
    form.height_cm && form.weight_kg
      ? (form.weight_kg / (form.height_cm / 100) ** 2).toFixed(1)
      : null

  function bmiLabel(v) {
    const n = parseFloat(v)
    if (n < 18.5) return 'Niedowaga'
    if (n < 25) return 'Norma'
    if (n < 30) return 'Nadwaga'
    return 'Otyłość'
  }

  const displayName = form.nick || form.name || user.email.split('@')[0]
  const initials = (form.nick || form.name || user.email).slice(0, 2).toUpperCase()

  if (loading) {
    return <div className="empty">Ładowanie profilu…</div>
  }

  return (
    <div className="profile-view">
      <section className="profile-hero">
        <div className="profile-avatar-big">{initials}</div>
        <h2 className="profile-name">{displayName}</h2>
        <p className="muted">{user.email}</p>

        {bmi && (
          <div className="bmi-card">
            <div className="bmi-main">
              <span className="label">BMI</span>
              <span className="bmi-value">{bmi}</span>
            </div>
            <span className="bmi-label">{bmiLabel(bmi)}</span>
          </div>
        )}
      </section>

      <form onSubmit={handleSubmit} className="card profile-form">
        <h3 className="card-title">
          <span>Dane osobowe</span>
        </h3>

        <label>
          Nick
          <input
            type="text"
            value={form.nick}
            onChange={update('nick')}
            placeholder="Jak Cię zwać"
            maxLength={30}
          />
        </label>

        <label>
          Imię
          <input
            type="text"
            value={form.name}
            onChange={update('name')}
            placeholder="Twoje imię"
            maxLength={50}
          />
        </label>

        <label>
          E-mail
          <input type="email" value={user.email} disabled />
        </label>

        <div className="profile-row">
          <label>
            Wzrost (cm)
            <input
              type="number"
              value={form.height_cm}
              onChange={update('height_cm')}
              placeholder="np. 180"
              min="50"
              max="250"
            />
          </label>

          <label>
            Waga (kg)
            <input
              type="number"
              step="0.1"
              value={form.weight_kg}
              onChange={update('weight_kg')}
              placeholder="np. 75.5"
              min="20"
              max="300"
            />
          </label>
        </div>

        <button type="submit" disabled={saving}>
          {saving ? 'Zapisywanie…' : 'Zapisz zmiany'}
        </button>

        {message && (
          <p
            className={message.type === 'error' ? 'error' : 'success'}
            style={{ marginTop: 12, textAlign: 'center' }}
          >
            {message.text}
          </p>
        )}
      </form>
    </div>
  )
}
