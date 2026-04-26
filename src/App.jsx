import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import { loadSavedTheme } from './themes'
import './App.css'

// Zastosuj zapisany motyw przed pierwszym renderem
loadSavedTheme()

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div className="center">Ładowanie…</div>
  }

  return session ? <Dashboard session={session} /> : <Auth />
}
