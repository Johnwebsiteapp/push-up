const DNI = [
  'Niedziela',
  'Poniedziałek',
  'Wtorek',
  'Środa',
  'Czwartek',
  'Piątek',
  'Sobota',
]

function formatDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  const dateObj = new Date(y, m - 1, d)
  const dayName = DNI[dateObj.getDay()]
  const dd = String(d).padStart(2, '0')
  const mm = String(m).padStart(2, '0')
  return `${dayName} ${dd}.${mm}`
}

function formatDuration(seconds) {
  if (!seconds) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function WorkoutList({ workouts, profiles, currentUserId, onDelete }) {
  if (workouts.length === 0) {
    return <p className="empty">Jeszcze nic tu nie ma. Dodaj pierwszy trening powyżej.</p>
  }

  return (
    <ul className="workout-list">
      {workouts.map((w) => {
        const mine = w.user_id === currentUserId
        const prof = profiles?.[w.user_id]
        const name =
          prof?.nick ||
          prof?.name ||
          (w.user_email ? w.user_email.split('@')[0] : 'Użytkownik')

        const isPlank = w.exercise_type === 'plank'
        const label = isPlank
          ? `${formatDuration(w.duration_seconds)} plank`
          : `${w.count} pompek`
        const icon = isPlank ? '🧘' : '💪'

        return (
          <li key={w.id} className={`${mine ? 'mine' : 'other'} ${isPlank ? 'plank' : ''}`}>
            <div className="workout-main">
              <div className="workout-top">
                <strong className="workout-count">
                  <span className="workout-icon">{icon}</span> {label}
                </strong>
                <span className="workout-date">{formatDate(w.performed_at)}</span>
              </div>
              <div className="workout-meta">
                <span>
                  {name}
                  {mine && ' (Ty)'}
                </span>
                {w.note && <span className="workout-note">— {w.note}</span>}
              </div>
            </div>
            {mine && (
              <button
                className="icon-button"
                onClick={() => onDelete(w)}
                title="Usuń"
                aria-label="Usuń"
              >
                ✕
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
