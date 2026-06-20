import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useLang } from '../LangContext'

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getWeekDays(offset = 0) {
  const today = new Date()
  const dow = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dow + 6) % 7) + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
}

function weekLabel(offset, lang) {
  if (offset === 0) return lang === 'pl' ? 'Ten tydzień' : 'This week'
  if (offset === -1) return lang === 'pl' ? 'Ostatni tydzień' : 'Last week'
  return lang === 'pl' ? `${Math.abs(offset)} tygodnie temu` : `${Math.abs(offset)} weeks ago`
}

function formatDateHeader(iso, lang) {
  const today = todayISO()
  if (iso === today) return lang === 'pl' ? 'Dziś' : 'Today'
  const d = new Date(iso + 'T12:00:00')
  const days = lang === 'pl'
    ? ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota']
    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = lang === 'pl'
    ? ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`
}

function formatSet(st) {
  if (st.weight_kg != null) return `${st.weight_kg}×${st.reps}`
  return `${st.reps} pow.`
}

export default function Gym({ user }) {
  const { t, lang } = useLang()
  const today = todayISO()
  const DAY_SHORTS = lang === 'pl'
    ? ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd']
    : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

  const [weekOffset, setWeekOffset] = useState(0)
  const [date, setDate] = useState(today)
  const [sessions, setSessions] = useState([])
  const [allExercises, setAllExercises] = useState([])
  const [weekActivity, setWeekActivity] = useState(new Set())
  const [loading, setLoading] = useState(true)

  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset])

  // Add panel
  const [addOpen, setAddOpen] = useState(false)
  const [addName, setAddName] = useState('')
  const [addSets, setAddSets] = useState([{ weight: '', reps: '' }])
  const [addSaving, setAddSaving] = useState(false)
  const [addError, setAddError] = useState(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const nameInputRef = useRef(null)

  // Quick-add per existing session
  const [quickSet, setQuickSet] = useState({})

  // Inline editing
  const [editSet, setEditSet] = useState(null)   // { sessionId, setId, weight, reps, saving, error }
  const [editName, setEditName] = useState(null) // { sessionId, exerciseId, value, saving }

  // Swipe on chart
  const chartSwipeRef = useRef({ startX: 0, startY: 0 })

  // When week changes, auto-select appropriate day
  useEffect(() => {
    if (weekOffset === 0) {
      setDate(today)
    } else {
      // Select Sunday of that week (last day), but not in the future
      const lastDay = weekDays[6]
      setDate(lastDay > today ? today : lastDay)
    }
  }, [weekOffset])

  useEffect(() => {
    let ignore = false
    async function load() {
      setLoading(true)
      const [{ data: exData }, { data: sessData }, { data: weekData }] = await Promise.all([
        supabase.from('gym_exercises').select('*').eq('user_id', user.id).order('name'),
        supabase
          .from('gym_sessions')
          .select('*, exercise:gym_exercises(id, name, category), sets:gym_sets(*)')
          .eq('user_id', user.id)
          .eq('performed_at', date)
          .order('created_at'),
        supabase
          .from('gym_sessions')
          .select('performed_at')
          .eq('user_id', user.id)
          .gte('performed_at', weekDays[0])
          .lte('performed_at', weekDays[6]),
      ])
      if (!ignore) {
        setAllExercises(exData || [])
        setSessions((sessData || []).map(s => ({
          ...s,
          sets: (s.sets || []).slice().sort((a, b) => a.set_number - b.set_number),
        })))
        setWeekActivity(new Set((weekData || []).map(s => s.performed_at)))
        setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [user.id, date, weekDays[0]])

  const suggestions = useMemo(() => {
    if (!addName.trim()) return []
    const q = addName.toLowerCase()
    return allExercises.filter(ex => ex.name.toLowerCase().includes(q)).slice(0, 5)
  }, [addName, allExercises])

  function selectDay(d) {
    if (d > today) return
    setDate(d)
    setAddOpen(false)
  }

  function onChartTouchStart(e) {
    chartSwipeRef.current.startX = e.touches[0].clientX
    chartSwipeRef.current.startY = e.touches[0].clientY
  }

  function onChartTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - chartSwipeRef.current.startX
    const dy = Math.abs(e.changedTouches[0].clientY - chartSwipeRef.current.startY)
    if (Math.abs(dx) > 50 && dy < 40) {
      if (dx < 0) setWeekOffset(o => o - 1)
      else if (weekOffset < 0) setWeekOffset(o => o + 1)
    }
  }

  function openAdd() {
    setAddName('')
    setAddSets([{ weight: '', reps: '' }])
    setAddError(null)
    setAddOpen(true)
    setTimeout(() => nameInputRef.current?.focus({ preventScroll: true }), 100)
  }

  function closeAdd() {
    setAddOpen(false)
    setShowSuggestions(false)
  }

  async function handleSave() {
    const name = addName.trim()
    if (!name) { setAddError(t('gym_error_name')); return }
    const validSets = addSets.filter(s => s.reps && parseInt(s.reps, 10) > 0)
    if (validSets.length === 0) { setAddError(t('gym_error_reps')); return }

    setAddSaving(true)
    setAddError(null)

    let exercise = allExercises.find(ex => ex.name.toLowerCase() === name.toLowerCase())
    if (!exercise) {
      const { data, error } = await supabase
        .from('gym_exercises')
        .insert({ user_id: user.id, name, category: 'other' })
        .select().single()
      if (error) { setAddError(error.message); setAddSaving(false); return }
      exercise = data
      setAllExercises(prev => [...prev, exercise].sort((a, b) => a.name.localeCompare(b.name)))
    }

    const { data: sess, error: sessErr } = await supabase
      .from('gym_sessions')
      .insert({ user_id: user.id, exercise_id: exercise.id, performed_at: date })
      .select('*, exercise:gym_exercises(id, name, category)')
      .single()
    if (sessErr) { setAddError(sessErr.message); setAddSaving(false); return }

    const { data: setsData } = await supabase
      .from('gym_sets')
      .insert(validSets.map((s, i) => ({
        session_id: sess.id,
        set_number: i + 1,
        weight_kg: s.weight ? parseFloat(s.weight) : null,
        reps: parseInt(s.reps, 10),
      })))
      .select()

    setSessions(prev => [...prev, { ...sess, sets: setsData || [] }])
    setWeekActivity(prev => new Set([...prev, date]))
    setAddSaving(false)
    closeAdd()
  }

  async function quickSaveSet(sessionId) {
    const form = quickSet[sessionId]
    if (!form) return
    const reps = parseInt(form.reps, 10)
    if (!reps || reps <= 0) {
      setQuickSet(prev => ({ ...prev, [sessionId]: { ...prev[sessionId], error: t('gym_error_reps') } }))
      return
    }
    const sess = sessions.find(s => s.id === sessionId)
    const nextNum = (sess?.sets?.length || 0) + 1
    setQuickSet(prev => ({ ...prev, [sessionId]: { ...prev[sessionId], saving: true } }))
    const { data, error } = await supabase
      .from('gym_sets')
      .insert({ session_id: sessionId, set_number: nextNum, weight_kg: form.weight ? parseFloat(form.weight) : null, reps })
      .select().single()
    if (error) {
      setQuickSet(prev => ({ ...prev, [sessionId]: { ...prev[sessionId], saving: false, error: error.message } }))
      return
    }
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, sets: [...s.sets, data] } : s))
    setQuickSet(prev => { const n = { ...prev }; delete n[sessionId]; return n })
  }

  function startEditSet(sessionId, st) {
    setQuickSet(prev => { const n = { ...prev }; delete n[sessionId]; return n })
    setEditSet({
      sessionId,
      setId: st.id,
      weight: st.weight_kg != null ? String(st.weight_kg) : '',
      reps: String(st.reps),
      saving: false,
      error: null,
    })
  }

  async function saveEditSet() {
    if (!editSet) return
    const reps = parseInt(editSet.reps, 10)
    if (!reps || reps <= 0) { setEditSet(p => ({ ...p, error: t('gym_error_reps') })); return }
    const weight_kg = editSet.weight ? parseFloat(editSet.weight) : null
    setEditSet(p => ({ ...p, saving: true, error: null }))
    const { error } = await supabase.from('gym_sets').update({ weight_kg, reps }).eq('id', editSet.setId)
    if (error) { setEditSet(p => ({ ...p, saving: false, error: error.message })); return }
    setSessions(prev => prev.map(s => s.id === editSet.sessionId
      ? { ...s, sets: s.sets.map(st => st.id === editSet.setId ? { ...st, weight_kg, reps } : st) }
      : s))
    setEditSet(null)
  }

  function startEditName(sess) {
    setEditName({ sessionId: sess.id, exerciseId: sess.exercise?.id, value: sess.exercise?.name || '', saving: false })
  }

  async function saveEditName() {
    if (!editName) return
    const name = editName.value.trim()
    if (!name || name === sessions.find(s => s.id === editName.sessionId)?.exercise?.name) { setEditName(null); return }
    const { error } = await supabase.from('gym_exercises').update({ name }).eq('id', editName.exerciseId)
    if (!error) {
      setSessions(prev => prev.map(s => s.exercise?.id === editName.exerciseId ? { ...s, exercise: { ...s.exercise, name } } : s))
      setAllExercises(prev => prev.map(ex => ex.id === editName.exerciseId ? { ...ex, name } : ex).sort((a, b) => a.name.localeCompare(b.name)))
    }
    setEditName(null)
  }

  async function deleteSet(sessionId, setId) {
    await supabase.from('gym_sets').delete().eq('id', setId)
    setSessions(prev => prev.map(s =>
      s.id === sessionId
        ? { ...s, sets: s.sets.filter(st => st.id !== setId).map((st, i) => ({ ...st, set_number: i + 1 })) }
        : s
    ))
  }

  async function deleteSession(sessionId) {
    await supabase.from('gym_sessions').delete().eq('id', sessionId)
    setSessions(prev => prev.filter(s => s.id !== sessionId))
    setQuickSet(prev => { const n = { ...prev }; delete n[sessionId]; return n })
  }

  return (
    <div className="gym-view">
      {/* Compact week chart — sticky */}
      <div className="gym-sticky-header">
        <div
          className="gym-week"
          onTouchStart={onChartTouchStart}
          onTouchEnd={onChartTouchEnd}
        >
          {weekDays.map((d, i) => (
            <button
              key={d}
              type="button"
              className={`gym-week-day${weekActivity.has(d) ? ' has-activity' : ''}${d === date ? ' selected' : ''}${d > today ? ' future' : ''}`}
              onClick={() => selectDay(d)}
            >
              <span className="gym-week-day-name">{DAY_SHORTS[i]}</span>
              <span className="gym-week-dot" />
            </button>
          ))}
        </div>
        <div className="gym-week-meta">
          <span className="gym-week-label">{weekLabel(weekOffset, lang)}</span>
          <span className="gym-selected-date">{formatDateHeader(date, lang)}</span>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="empty" style={{ padding: '2rem 0' }}>{t('loading')}</div>
      ) : (
        <div className="gym-sessions">
          {sessions.length === 0 && !addOpen && (
            <div className="gym-empty-state">
              <div className="gym-empty-icon">🏋️</div>
              <p className="gym-empty-text">{t('gym_no_exercises')}</p>
            </div>
          )}

          {sessions.map(sess => {
            const qf = quickSet[sess.id]
            return (
              <div key={sess.id} className="gym-card">
                <div className="gym-card-header">
                  {editName && editName.sessionId === sess.id ? (
                    <input
                      type="text"
                      className="gym-name-edit-input"
                      value={editName.value}
                      autoFocus
                      maxLength={60}
                      onChange={e => setEditName(p => ({ ...p, value: e.target.value }))}
                      onBlur={saveEditName}
                      onKeyDown={e => { if (e.key === 'Enter') saveEditName(); if (e.key === 'Escape') setEditName(null) }}
                    />
                  ) : (
                    <button type="button" className="gym-card-name" onClick={() => startEditName(sess)} title={t('gym_edit_name')}>
                      {sess.exercise?.name}
                    </button>
                  )}
                  <button type="button" className="gym-card-delete" onClick={() => deleteSession(sess.id)}>✕</button>
                </div>
                <div className="gym-sets-summary">
                  {sess.sets.map(st => {
                    if (editSet && editSet.setId === st.id) {
                      return (
                        <div key={st.id} className="gym-set-edit">
                          <input type="number" className="gym-quick-input" placeholder="kg" value={editSet.weight} min="0" step="0.5" inputMode="decimal" autoFocus
                            onChange={e => setEditSet(p => ({ ...p, weight: e.target.value }))} disabled={editSet.saving} />
                          <span className="gym-quick-x">×</span>
                          <input type="number" className="gym-quick-input" placeholder="pow." value={editSet.reps} min="1" inputMode="numeric"
                            onChange={e => setEditSet(p => ({ ...p, reps: e.target.value }))} disabled={editSet.saving} />
                          <button type="button" className="gym-quick-save" onClick={saveEditSet} disabled={editSet.saving} title={t('gym_modal_save')}>✓</button>
                          <button type="button" className="gym-set-edit-delete" onClick={() => { deleteSet(sess.id, st.id); setEditSet(null) }} disabled={editSet.saving} title={t('gym_delete_set')}>🗑</button>
                          <button type="button" className="gym-quick-cancel" onClick={() => setEditSet(null)}>✕</button>
                          {editSet.error && <p className="error" style={{ width: '100%', fontSize: '0.78rem', margin: '4px 0 0' }}>{editSet.error}</p>}
                        </div>
                      )
                    }
                    return (
                      <button key={st.id} type="button" className="gym-set-chip" onClick={() => startEditSet(sess.id, st)} title={t('gym_edit_set')}>
                        {formatSet(st)}
                      </button>
                    )
                  })}
                </div>
                {qf ? (
                  <div className="gym-quick-set-form">
                    <input type="number" className="gym-quick-input" placeholder="kg" value={qf.weight} min="0" step="0.5" inputMode="decimal"
                      onChange={e => setQuickSet(prev => ({ ...prev, [sess.id]: { ...prev[sess.id], weight: e.target.value } }))}
                      disabled={qf.saving} autoFocus />
                    <span className="gym-quick-x">×</span>
                    <input type="number" className="gym-quick-input" placeholder="pow." value={qf.reps} min="1" inputMode="numeric"
                      onChange={e => setQuickSet(prev => ({ ...prev, [sess.id]: { ...prev[sess.id], reps: e.target.value } }))}
                      disabled={qf.saving} />
                    <button type="button" className="gym-quick-save" onClick={() => quickSaveSet(sess.id)} disabled={qf.saving}>✓</button>
                    <button type="button" className="gym-quick-cancel" onClick={() => setQuickSet(prev => { const n = { ...prev }; delete n[sess.id]; return n })}>✕</button>
                    {qf.error && <p className="error" style={{ width: '100%', fontSize: '0.78rem', margin: '4px 0 0' }}>{qf.error}</p>}
                  </div>
                ) : (
                  <button type="button" className="gym-add-set-inline" onClick={() => setQuickSet(prev => ({ ...prev, [sess.id]: { weight: '', reps: '', saving: false, error: null } }))}>
                    + seria
                  </button>
                )}
              </div>
            )
          })}

          {!addOpen && (
            <button type="button" className="gym-add-exercise-btn" onClick={openAdd}>
              + Dodaj ćwiczenie
            </button>
          )}

          {addOpen && (
            <div className="gym-add-panel">
              <div className="gym-add-panel-inner">
                <div className="gym-add-name-wrap">
                  <input
                    ref={nameInputRef}
                    type="text"
                    className="gym-add-name-input"
                    placeholder={t('gym_modal_name_placeholder')}
                    value={addName}
                    onChange={e => { setAddName(e.target.value); setShowSuggestions(true) }}
                    onFocus={() => setShowSuggestions(true)}
                    maxLength={60}
                    disabled={addSaving}
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="gym-suggestions">
                      {suggestions.map(ex => (
                        <button key={ex.id} type="button" className="gym-suggestion-btn"
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => { setAddName(ex.name); setShowSuggestions(false) }}>
                          {ex.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="gym-add-sets-table">
                  <div className="gym-add-sets-header">
                    <span>Seria</span>
                    <span>Ciężar × Powtórzenia</span>
                  </div>
                  {addSets.map((s, i) => (
                    <div key={i} className="gym-add-set-row">
                      <span className="gym-add-set-num">{i + 1}</span>
                      <div className="gym-add-set-inputs">
                        <input type="number" className="gym-add-set-input" placeholder="kg" value={s.weight} min="0" step="0.5" inputMode="decimal"
                          onChange={e => setAddSets(prev => prev.map((row, j) => j === i ? { ...row, weight: e.target.value } : row))}
                          disabled={addSaving} />
                        <span className="gym-add-set-x">×</span>
                        <input type="number" className="gym-add-set-input" placeholder="pow." value={s.reps} min="1" inputMode="numeric"
                          onChange={e => setAddSets(prev => prev.map((row, j) => j === i ? { ...row, reps: e.target.value } : row))}
                          disabled={addSaving} />
                        {addSets.length > 1 && (
                          <button type="button" className="gym-add-set-remove"
                            onClick={() => setAddSets(prev => prev.filter((_, j) => j !== i))}
                            disabled={addSaving}>✕</button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button type="button" className="gym-add-more-set-btn"
                    onClick={() => setAddSets(prev => [...prev, { weight: '', reps: '' }])}
                    disabled={addSaving}>
                    + seria
                  </button>
                </div>

                {addError && <p className="error" style={{ margin: '0 0 8px', fontSize: '0.82rem' }}>{addError}</p>}

                <div className="gym-add-actions">
                  <button type="button" className="gym-save-btn" onClick={handleSave} disabled={addSaving}>
                    {addSaving ? t('gym_saving') : t('gym_modal_save')}
                  </button>
                  <button type="button" className="gym-cancel-btn" onClick={closeAdd} disabled={addSaving}>
                    {t('gym_modal_cancel')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
