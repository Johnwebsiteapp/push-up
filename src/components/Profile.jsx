import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Profile({ user, badges = [], levelInfo, onProfileChange }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [dataExpanded, setDataExpanded] = useState(false)
  const [form, setForm] = useState({
    nick: '',
    name: '',
    initials: '',
    height_cm: '',
    weight_kg: '',
    daily_goal: '',
    weekly_goal: '',
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
            initials: data.initials ?? '',
            height_cm: data.height_cm ?? '',
            weight_kg: data.weight_kg ?? '',
            daily_goal: data.daily_goal ?? '',
            weekly_goal: data.weekly_goal ?? '',
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
      initials: form.initials.trim().toUpperCase() || null,
      height_cm: form.height_cm ? parseInt(form.height_cm, 10) : null,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      daily_goal: form.daily_goal ? parseInt(form.daily_goal, 10) : null,
      weekly_goal: form.weekly_goal ? parseInt(form.weekly_goal, 10) : null,
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

  function bmiCategoryClass(v) {
    const n = parseFloat(v)
    if (n < 18.5) return 'under'
    if (n < 25) return 'normal'
    if (n < 30) return 'over'
    return 'obese'
  }

  // Pozycja markera na skali 0-100% (BMI 15 → 0%, BMI 35 → 100%)
  function bmiMarkerPosition(v) {
    const n = parseFloat(v)
    const min = 15
    const max = 35
    const pct = ((n - min) / (max - min)) * 100
    return Math.max(2, Math.min(98, pct))
  }

  const displayName = form.nick || form.name || user.email.split('@')[0]
  const initials =
    (form.initials && form.initials.trim().toUpperCase()) ||
    (form.nick || form.name || user.email).slice(0, 2).toUpperCase()

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
          <div className="bmi-wrap">
            <div className={`bmi-card ${bmiCategoryClass(bmi)}`}>
              <div className="bmi-main">
                <span className="label">BMI</span>
                <span className="bmi-value">{bmi}</span>
              </div>
              <span className="bmi-label">{bmiLabel(bmi)}</span>
            </div>

            <div className="bmi-scale">
              <div className="bmi-scale-track">
                <div className="bmi-seg bmi-seg-under" />
                <div className="bmi-seg bmi-seg-normal" />
                <div className="bmi-seg bmi-seg-over" />
                <div className="bmi-seg bmi-seg-obese" />
                <div
                  className="bmi-marker"
                  style={{ left: `${bmiMarkerPosition(bmi)}%` }}
                />
              </div>
              <div className="bmi-scale-labels">
                <span>&lt;18.5</span>
                <span>18.5</span>
                <span>25</span>
                <span>30</span>
                <span>35+</span>
              </div>
              <div className="bmi-ranges">
                <div>
                  <span className="bmi-dot under" />
                  Niedowaga
                </div>
                <div>
                  <span className="bmi-dot normal" />
                  Norma
                </div>
                <div>
                  <span className="bmi-dot over" />
                  Nadwaga
                </div>
                <div>
                  <span className="bmi-dot obese" />
                  Otyłość
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {badges.length > 0 && (
        <section className="card">
          <h3 className="card-title">
            <span>
              Odznaki · {badges.filter((b) => b.unlocked).length}/{badges.length}
            </span>
          </h3>
          <div className="badges-grid">
            {badges.map((b) => (
              <div
                key={b.id}
                className={`badge ${b.unlocked ? 'unlocked' : 'locked'}`}
                title={b.desc}
              >
                <div className="badge-icon">{b.icon}</div>
                <div className="badge-name">{b.name}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card collapsible-card">
        <button
          type="button"
          className="collapsible-header"
          onClick={() => setDataExpanded((v) => !v)}
          aria-expanded={dataExpanded}
        >
          <span>Dane osobiste</span>
          <span className={`chevron ${dataExpanded ? 'open' : ''}`}>▾</span>
        </button>

        {dataExpanded && (
          <form onSubmit={handleSubmit} className="profile-form collapsible-content">
            <div className="profile-row">
              <label style={{ flex: 2 }}>
                Nick
                <input
                  type="text"
                  value={form.nick}
                  onChange={update('nick')}
                  placeholder="Jak Cię zwać"
                  maxLength={30}
                />
              </label>
              <label style={{ flex: 1 }}>
                Inicjały
                <input
                  type="text"
                  value={form.initials}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      initials: e.target.value.toUpperCase().slice(0, 4),
                    }))
                  }
                  placeholder="auto"
                  maxLength={4}
                  style={{ textAlign: 'center', letterSpacing: '0.1em' }}
                />
              </label>
            </div>

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

            <div className="profile-section-divider">
              <span>Cele</span>
            </div>

            <div className="profile-row">
              <label>
                Cel dzienny
                <input
                  type="number"
                  value={form.daily_goal}
                  onChange={update('daily_goal')}
                  placeholder="np. 30"
                  min="0"
                  max="9999"
                />
              </label>

              <label>
                Cel tygodniowy
                <input
                  type="number"
                  value={form.weekly_goal}
                  onChange={update('weekly_goal')}
                  placeholder="np. 150"
                  min="0"
                  max="69999"
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
        )}
      </section>
    </div>
  )
}
