import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Auth() {
  // mode: 'choice' | 'signin' | 'signup'
  const [mode, setMode] = useState('choice')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nick, setNick] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  function resetForm() {
    setEmail('')
    setPassword('')
    setNick('')
    setMessage(null)
  }

  function goChoice() {
    resetForm()
    setMode('choice')
  }

  async function handleSignIn(e) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
    } catch (err) {
      setMessage({ type: 'error', text: 'Błąd: ' + err.message })
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp(e) {
    e.preventDefault()

    const trimmedNick = nick.trim()
    if (!trimmedNick) {
      setMessage({ type: 'error', text: 'Nick jest wymagany.' })
      return
    }
    if (trimmedNick.length < 2) {
      setMessage({ type: 'error', text: 'Nick musi mieć co najmniej 2 znaki.' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error

      if (data?.user) {
        // Zapisz nick od razu do profilu
        const { error: profileError } = await supabase.from('profiles').upsert({
          user_id: data.user.id,
          nick: trimmedNick,
          updated_at: new Date().toISOString(),
        })
        if (profileError) {
          console.warn('Nie udało się zapisać nicka:', profileError.message)
        }
      }

      if (!data?.session) {
        setMessage({
          type: 'info',
          text: 'Konto utworzone. Zaloguj się aby kontynuować.',
        })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Błąd: ' + err.message })
    } finally {
      setLoading(false)
    }
  }

  // ===== Ekran wyboru =====
  if (mode === 'choice') {
    return (
      <div className="auth-wrapper">
        <div className="auth-card auth-choice">
          <div className="brand">
            <span className="brand-bolt">⚡</span>
            <span>POMPKI</span>
          </div>
          <h1>Witaj.</h1>
          <p className="muted">Śledź swoje pompki i rywalizuj z innymi.</p>

          <div className="choice-buttons">
            <button type="button" onClick={() => setMode('signin')}>
              Mam już konto
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setMode('signup')}
            >
              Jestem tu pierwszy raz
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ===== Formularz logowania / rejestracji =====
  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <button type="button" className="back-button" onClick={goChoice}>
          ← Wstecz
        </button>

        <div className="brand">
          <span className="brand-bolt">⚡</span>
          <span>POMPKI</span>
        </div>

        <h1>{mode === 'signin' ? 'Zaloguj się' : 'Załóż konto'}</h1>
        <p className="muted">
          {mode === 'signin'
            ? 'Witaj ponownie. Wpisz swoje dane.'
            : 'Wybierz nick i podaj dane logowania.'}
        </p>

        <form
          onSubmit={mode === 'signin' ? handleSignIn : handleSignUp}
          className="auth-form"
        >
          {mode === 'signup' && (
            <label>
              Nick
              <input
                type="text"
                required
                value={nick}
                onChange={(e) => setNick(e.target.value)}
                placeholder="Jak masz się nazywać"
                maxLength={30}
                minLength={2}
              />
            </label>
          )}
          <label>
            E-mail
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ty@example.com"
            />
          </label>
          <label>
            Hasło
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="min. 6 znaków"
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading
              ? 'Czekaj…'
              : mode === 'signin'
              ? 'Zaloguj się'
              : 'Zarejestruj się'}
          </button>
        </form>

        {message && (
          <p
            className={
              message.type === 'error'
                ? 'error auth-msg'
                : 'message auth-msg'
            }
          >
            {message.text}
          </p>
        )}
      </div>
    </div>
  )
}
