import { useState } from 'react'
import { supabase } from '../supabaseClient'

function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

export default function Auth() {
  // mode: 'choice' | 'signin' | 'signup'
  const [mode, setMode] = useState('choice')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
      // Zapisz nick do user_metadata — to zawsze działa bez RLS
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nick: trimmedNick },
        },
      })
      if (error) throw error

      if (data?.user && data?.session) {
        // Jeśli mamy już sesję, zapisz też do tabeli profiles (dla rankingu/historii)
        const { error: profileError } = await supabase.from('profiles').upsert({
          user_id: data.user.id,
          nick: trimmedNick,
          updated_at: new Date().toISOString(),
        })
        if (profileError) {
          console.warn('Nie udało się zapisać profilu:', profileError.message)
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
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="min. 6 znaków"
                autoComplete={
                  mode === 'signup' ? 'new-password' : 'current-password'
                }
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
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
