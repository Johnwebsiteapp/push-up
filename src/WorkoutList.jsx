const DNI = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota']

function formatDate(isoDate) {
  // isoDate to "YYYY-MM-DD"
  const [y, m, d] = isoDate.split('-').map(Number)
  const dateObj = new Date(y, m - 1, d)
  const dayName = DNI[dateObj.getDay()]
  const dd = String(d).padStart(2, '0')
  const mm = String(m).padStart(2, '0')
  return `${dayName} ${dd}.${mm}.${y}`
}

export default function WorkoutList({ workouts, currentUserId, onDelete }) {
  if (workouts.length === 0) {
    return <p className="muted">Jeszcze nic tu nie ma. Dodaj pierwszy trening powyżej!</p>
  }

  return (
    <ul className="workout-list">
      {workouts.map((w) => {
        const mine = w.user_id === currentUserId
        return (
          <li key={w.id} className={mine ? 'mine' : 'other'}>
            <div className="workout-main">
              <div className="workout-top">
                <strong className="workout-count">{w.count} pompek</strong>
                <span className="workout-date">{formatDate(w.performed_at)}</span>
              </div>
              <div className="workout-meta">
                <span className="muted">{w.user_email}{mine && ' (Ty)'}</span>
                {w.note && <span className="workout-note">— {w.note}</span>}
              </div>
            </div>
            {mine && (
              <button
                className="icon-button"
                onClick={() => onDelete(w.id)}
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
