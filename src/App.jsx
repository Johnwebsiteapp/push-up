import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import { loadSavedTheme } from './themes'
import { LangProvider, useLang } from './LangContext'
import ErrorBoundary from './ErrorBoundary'
import './App.css'

// Zastosuj zapisany motyw przed pierwszym renderem
loadSavedTheme()

function AppInner() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const { t } = useLang()

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
    return <div className="center">{t('loading')}</div>
  }

  return session ? <Dashboard session={session} /> : <Auth />
}

export default function App() {
  return (
    <ErrorBoundary>
      <LangProvider>
        <AppInner />
      </LangProvider>
    </ErrorBoundary>
  )
}
