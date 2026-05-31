import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLang } from '../LangContext'

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function PlankTimer({ onSave, onClose }) {
  const { t } = useLang()
  // phase: 'running' | 'stopped' | 'saved'
  const [phase, setPhase] = useState('running')
  const [seconds, setSeconds] = useState(0)
  const [saving, setSaving] = useState(false)
  const startRef = useRef(null)
  const intervalRef = useRef(null)

  // Auto-start immediately on mount + blokada wygaszania ekranu
  useEffect(() => {
    startRef.current = Date.now()
    intervalRef.current = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startRef.current) / 1000))
    }, 100)

    let wakeLock = null
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then((lock) => {
        wakeLock = lock
      }).catch(() => {})
    }

    return () => {
      clearInterval(intervalRef.current)
      wakeLock?.release()
    }
  }, [])

  async function handleStop() {
    clearInterval(intervalRef.current)
    const elapsed = Math.floor((Date.now() - startRef.current) / 1000)
    setSeconds(elapsed)
    setSaving(true)
    if (onSave) await onSave(elapsed)
    setSaving(false)
    setPhase('saved')
    setTimeout(() => onClose?.(), 2400)
  }

  return createPortal(
    <div
      className="plank-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && phase === 'stopped') onClose?.()
      }}
    >
      <div className={`plank-modal plank-phase-${phase}`}>

        <button
          type="button"
          className="plank-modal-close"
          onClick={() => onClose?.()}
          aria-label={t('plank_close')}
          style={{
            opacity: phase === 'running' ? 0 : 1,
            pointerEvents: phase === 'running' ? 'none' : 'auto',
          }}
        >
          ✕
        </button>

        <div className="plank-modal-header">
          <span className="plank-modal-icon">🧘</span>
          <div className="plank-modal-title">
            {phase === 'running' && t('plank_hold')}
          </div>
        </div>

        {phase === 'running' && (
          <div className="plank-ring-wrap">
            <svg viewBox="0 0 200 200" className="plank-ring-svg" aria-hidden="true">
              <circle
                cx="100" cy="100" r="86"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="3"
              />
              <circle
                cx="100" cy="100" r="86"
                fill="none"
                stroke="#CCFF00"
                strokeWidth="3"
                strokeDasharray="16 8"
                strokeLinecap="round"
                className="plank-ring-spin"
                style={{ filter: 'drop-shadow(0 0 6px rgba(204,255,0,0.7))' }}
              />
            </svg>
            <div className="plank-modal-time">
              {formatDuration(seconds)}
            </div>
          </div>
        )}

        {phase === 'saved' && (
          <div className="plank-saved-anim">
            <div className="plank-saved-check">✓</div>
            <div className="plank-saved-time">{formatDuration(seconds)}</div>
            <div className="plank-saved-label">{t('plank_saved')}</div>
          </div>
        )}

        <div className="plank-modal-controls">
          {phase === 'running' && (
            <button type="button" className="plank-stop-btn" onClick={handleStop} disabled={saving}>
              {saving ? t('plank_saving') : t('plank_stop')}
            </button>
          )}
        </div>

      </div>
    </div>,
    document.body
  )
}
