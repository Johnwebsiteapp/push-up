import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function PlankTimer({ onSave, onClose }) {
  // phase: 'running' | 'stopped' | 'saved'
  const [phase, setPhase] = useState('running')
  const [seconds, setSeconds] = useState(0)
  const [saving, setSaving] = useState(false)
  const startRef = useRef(null)
  const intervalRef = useRef(null)

  // Auto-start immediately on mount
  useEffect(() => {
    startRef.current = Date.now()
    intervalRef.current = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startRef.current) / 1000))
    }, 100)
    return () => clearInterval(intervalRef.current)
  }, [])

  function handleStop() {
    clearInterval(intervalRef.current)
    setSeconds(Math.floor((Date.now() - startRef.current) / 1000))
    setPhase('stopped')
  }

  async function handleSave() {
    setSaving(true)
    if (onSave) await onSave(seconds)
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

        {/* Przycisk zamknij — widoczny tylko po zatrzymaniu */}
        <button
          type="button"
          className="plank-modal-close"
          onClick={() => onClose?.()}
          aria-label="Zamknij"
          style={{
            opacity: phase === 'running' ? 0 : 1,
            pointerEvents: phase === 'running' ? 'none' : 'auto',
          }}
        >
          ✕
        </button>

        {/* Nagłówek */}
        <div className="plank-modal-header">
          <span className="plank-modal-icon">🧘</span>
          <div className="plank-modal-title">
            {phase === 'running' && 'Trzymaj pozycję'}
            {phase === 'stopped' && 'Świetna robota!'}
          </div>
        </div>

        {/* Timer z pierścieniem */}
        {phase !== 'saved' && (
          <div className="plank-ring-wrap">
            <svg viewBox="0 0 200 200" className="plank-ring-svg" aria-hidden="true">
              <circle
                cx="100" cy="100" r="86"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="3"
              />
              {phase === 'running' && (
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
              )}
              {phase === 'stopped' && (
                <circle
                  cx="100" cy="100" r="86"
                  fill="none"
                  stroke="#CCFF00"
                  strokeWidth="3"
                  strokeLinecap="round"
                  style={{ filter: 'drop-shadow(0 0 10px rgba(204,255,0,0.8))' }}
                />
              )}
            </svg>
            <div className="plank-modal-time">
              {formatDuration(seconds)}
            </div>
          </div>
        )}

        {/* Animacja po zapisaniu */}
        {phase === 'saved' && (
          <div className="plank-saved-anim">
            <div className="plank-saved-check">✓</div>
            <div className="plank-saved-time">{formatDuration(seconds)}</div>
            <div className="plank-saved-label">zapisano</div>
          </div>
        )}

        {/* Przyciski */}
        <div className="plank-modal-controls">
          {phase === 'running' && (
            <button type="button" className="plank-stop-btn" onClick={handleStop}>
              ⏹ STOP
            </button>
          )}
          {phase === 'stopped' && (
            <div className="plank-save-row">
              <button type="button" className="plank-discard-btn" onClick={onClose}>
                Odrzuć
              </button>
              <button
                type="button"
                className="plank-save-btn"
                onClick={handleSave}
                disabled={saving || seconds === 0}
              >
                {saving ? 'Zapisywanie…' : `Zapisz ${formatDuration(seconds)}`}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>,
    document.body
  )
}
