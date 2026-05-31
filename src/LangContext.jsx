import { createContext, useCallback, useContext, useState } from 'react'
import { getT } from './i18n'

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(
    () => localStorage.getItem('lang') || 'pl'
  )

  function setLang(newLang) {
    localStorage.setItem('lang', newLang)
    setLangState(newLang)
  }

  const t = useCallback(getT(lang), [lang])

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
