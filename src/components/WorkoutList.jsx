import { useLang } from '../LangContext'

function formatDate(isoDate, t) {
  const [y, m, d] = isoDate.split('-').map(Number)
  const dateObj = new Date(y, m - 1, d)
  const dayName = t(`day_${dateObj.getDay()}`)
  const dd = String(d).padStart(2, '0')
  const mm = String(m).padStart(2, '0')
  return `${dayName} ${dd}.${mm}`
}

function formatTime(isoTimestamp) {
  if (!isoTimestamp) return null
  const d = new Date(isoTimestamp)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function formatDuration(seconds) {
  if (!seconds) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function WorkoutList({ workouts, profiles, currentUserId, onDelete }) {
  const { t } = useLang()

  if (workouts.length === 0) {
    return <p className="empty">{t('wl_empty')}</p>
  }

  return (
    <ul className="workout-list">
      {workouts.map((w) => {
        const mine = w.user_id === currentUserId
        const prof = profiles?.[w.user_id]
        const name =
          prof?.nick ||
          prof?.name ||
          (w.user_email ? w.user_email.split('@')[0] : t('wl_user'))

        const isPlank = w.exercise_type === 'plank'
        const isPullup = w.exercise_type === 'pullup'
        let label, icon
        if (isPlank) {
          label = `${formatDuration(w.duration_seconds)} ${t('wl_plank_unit')}`
          icon = '🧘'
        } else if (isPullup) {
          label = `${w.count} ${t('wl_pullup_unit')}`
          icon = '🏋️'
        } else {
          label = `${w.count} ${t('wl_pushup_unit')}`
          icon = '💪'
        }

        return (
          <li key={w.id} className={`${mine ? 'mine' : 'other'} ${isPlank ? 'plank' : ''} ${isPullup ? 'pullup' : ''}`}>
            <div className="workout-main">
              <div className="workout-top">
                <strong className="workout-count">
                  <span className="workout-icon">{icon}</span> {label}
                </strong>
                <span className="workout-date">
                  {formatDate(w.performed_at, t)}
                  {formatTime(w.created_at) && (
                    <span className="workout-time">{formatTime(w.created_at)}</span>
                  )}
                </span>
              </div>
              <div className="workout-meta">
                <span>
                  {name}
                  {mine && t('wl_me')}
                </span>
                {w.note && <span className="workout-note">— {w.note}</span>}
              </div>
            </div>
            {mine && (
              <button
                className="icon-button"
                onClick={() => onDelete(w)}
                title={t('wl_delete_label')}
                aria-label={t('wl_delete_label')}
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
