import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function PlankTimer({ onSave, onClose }) {
  // phase: 'ready' | 'running' | 'stopped'
  const [phase, setPhase] = useState('ready')
  const [seconds, setSeconds] = useState(0)
  const startRef = useRef(null)
  const intervalRef = useRef(null)

  // Running: tick every 100ms to compute elapsed
  useEffect(() => {
    if (phase !== 'running') return
    intervalRef.current = setInterval(() => {
      if (startRef.current) {
        const elapsed = Math.floor((Date.now() - startRef.current) / 1000)
        setSeconds(elapsed)
      }
    }, 100)
    return () => clearInterval(intervalRef.current)
  }, [phase])

  function handleStart() {
    startRef.current = Date.now()
    setSeconds(0)
    setPhase('running')
  }

  function handleStop() {
    if (startRef.current) {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000)
      setSeconds(elapsed)
    }
    setPhase('stopped')
  }

  function handleSave() {
    if (seconds > 0 && onSave) onSave(seconds)
  }

  function handleDiscard() {
    startRef.current = null
    setSeconds(0)
    setPhase('ready')
  }

  function handleClose() {
    if (phase === 'running') {
      // Zatrzymaj timer i zapytaj
      handleStop()
      return
    }
    if (onClose) onClose()
  }

  return createPortal(
    <div className="plank-timer-overlay">
      <button
        type="button"
        className="plank-close"
        onClick={handleClose}
        aria-label="Zamknij"
      >
        ✕
      </button>

      <div className="plank-header">
        <div className="plank-icon">🧘</div>
        <div className="plank-title">
          {phase === 'ready' && 'Deska'}
          {phase === 'running' && 'Trzymaj...'}
          {phase === 'stopped' && 'Świetnie!'}
        </div>
        <div className="plank-subtitle">
          {phase === 'ready' && 'Kliknij START kiedy będziesz gotowy'}
          {phase === 'running' && 'Skup się na oddechu i formie'}
          {phase === 'stopped' && `Utrzymałeś deskę przez ${formatDuration(seconds)}`}
        </div>
      </div>

      <div className={`plank-counter ${phase}`}>
        <svg className="plank-ring" viewBox="0 0 240 240" aria-hidden="true">
          <circle
            cx="120"
            cy="120"
            r="112"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="4"
          />
          {phase === 'running' && (
            <circle
              cx="120"
              cy="120"
              r="112"
              fill="none"
              stroke="#CCFF00"
              strokeWidth="4"
              strokeDasharray="20 10"
              strokeLinecap="round"
              className="plank-ring-rotating"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(204,255,0,0.6))',
              }}
            />
          )}
          {phase === 'stopped' && (
            <circle
              cx="120"
              cy="120"
              r="112"
              fill="none"
              stroke="#CCFF00"
              strokeWidth="4"
              strokeLinecap="round"
              style={{
                filter: 'drop-shadow(0 0 10px rgba(204,255,0,0.7))',
              }}
            />
          )}
        </svg>
        <div className="plank-time">{formatDuration(seconds)}</div>
      </div>

      <div className="plank-controls">
        {phase === 'ready' && (
          <button
            type="button"
            className="plank-start-btn"
            onClick={handleStart}
          >
            ▶ START
          </button>
        )}

        {phase === 'running' && (
          <button
            type="button"
            className="plank-stop-btn"
            onClick={handleStop}
          >
            ⏹ STOP
          </button>
        )}

        {phase === 'stopped' && (
          <div className="plank-save-row">
            <button
              type="button"
              className="secondary plank-discard"
              onClick={handleDiscard}
            >
              Odrzuć
            </button>
            <button
              type="button"
              className="plank-save"
              onClick={handleSave}
              disabled={seconds === 0}
            >
              Zapisz {formatDuration(seconds)}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
