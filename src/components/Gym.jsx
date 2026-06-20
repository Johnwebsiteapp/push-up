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

function formatShortDate(iso, lang) {
  const d = new Date(iso + 'T12:00:00')
  const months = lang === 'pl'
    ? ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${d.getDate()} ${months[d.getMonth()]}`
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
  const [sessions, setSessions] = useState([])      // today's sessions (with sets)
  const [exercises, setExercises] = useState([])    // all exercises, ordered by sort_order
  const [weekActivity, setWeekActivity] = useState(new Set())
  const [loading, setLoading] = useState(true)

  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset])

  // Add panel
  const [addOpen, setAddOpen] = useState(false)
  const [addName, setAddName] = useState('')
  const [addSaving, setAddSaving] = useState(false)
  const [addError, setAddError] = useState(null)
  const nameInputRef = useRef(null)

  // Quick-add per exercise (keyed by exerciseId)
  const [quickSet, setQuickSet] = useState({})

  // Inline editing & UI state
  const [editSet, setEditSet] = useState(null)     // { exerciseId, setId, weight, reps, saving, error }
  const [editName, setEditName] = useState(null)   // { exerciseId, value }
  const [confirmDelete, setConfirmDelete] = useState(null) // exerciseId
  const [expanded, setExpanded] = useState(new Set())      // exerciseIds expanded
  const [history, setHistory] = useState({})       // { [exerciseId]: { loading, session } }

  // Swipe on chart
  const chartSwipeRef = useRef({ startX: 0, startY: 0 })

  // session for an exercise on the selected day
  const sessionByExercise = useMemo(() => {
    const m = {}
    sessions.forEach(s => { m[s.exercise_id] = s })
    return m
  }, [sessions])

  // When week changes, auto-select appropriate day
  useEffect(() => {
    if (weekOffset === 0) {
      setDate(today)
    } else {
      const lastDay = weekDays[6]
      setDate(lastDay > today ? today : lastDay)
    }
  }, [weekOffset])

  useEffect(() => {
    let ignore = false
    async function load() {
      setLoading(true)
      const [{ data: exData }, { data: sessData }, { data: weekData }] = await Promise.all([
        supabase.from('gym_exercises').select('*').eq('user_id', user.id).order('sort_order').order('name'),
        supabase
          .from('gym_sessions')
          .select('*, sets:gym_sets(*)')
          .eq('user_id', user.id)
          .eq('performed_at', date)
          .order('created_at'),
        supabase
          .from('gym_sessions')
          .select('performed_at, sets:gym_sets(id)')
          .eq('user_id', user.id)
          .gte('performed_at', weekDays[0])
          .lte('performed_at', weekDays[6]),
      ])
      if (!ignore) {
        setExercises(exData || [])
        setSessions((sessData || []).map(s => ({
          ...s,
          sets: (s.sets || []).slice().sort((a, b) => a.set_number - b.set_number),
        })))
        // only count days that actually have at least one set as "trained"
        setWeekActivity(new Set((weekData || []).filter(s => (s.sets || []).length > 0).map(s => s.performed_at)))
        setExpanded(new Set())
        setHistory({})
        setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [user.id, date, weekDays[0]])

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
    setAddError(null)
    setAddOpen(true)
    setTimeout(() => nameInputRef.current?.focus({ preventScroll: true }), 100)
  }

  function closeAdd() {
    setAddOpen(false)
  }

  // Create a new exercise (a template that shows on every day)
  async function handleAddExercise() {
    const name = addName.trim()
    if (!name) { setAddError(t('gym_error_name')); return }
    if (exercises.some(ex => ex.name.toLowerCase() === name.toLowerCase())) {
      setAddError(lang === 'pl' ? 'Takie ćwiczenie już istnieje' : 'Exercise already exists')
      return
    }
    setAddSaving(true)
    setAddError(null)
    const maxOrder = exercises.reduce((m, ex) => Math.max(m, ex.sort_order || 0), 0)
    const { data, error } = await supabase
      .from('gym_exercises')
      .insert({ user_id: user.id, name, category: 'other', sort_order: maxOrder + 1 })
      .select().single()
    if (error) { setAddError(error.message); setAddSaving(false); return }
    setExercises(prev => [...prev, data])
    setAddSaving(false)
    closeAdd()
  }

  // Ensure a session exists for this exercise on the selected day
  async function ensureSession(exerciseId) {
    const existing = sessionByExercise[exerciseId]
    if (existing) return existing
    const { data, error } = await supabase
      .from('gym_sessions')
      .insert({ user_id: user.id, exercise_id: exerciseId, performed_at: date })
      .select('*').single()
    if (error) return null
    const newSess = { ...data, sets: [] }
    setSessions(prev => [...prev, newSess])
    return newSess
  }

  async function quickSaveSet(exerciseId) {
    const form = quickSet[exerciseId]
    if (!form) return
    const reps = parseInt(form.reps, 10)
    if (!reps || reps <= 0) {
      setQuickSet(prev => ({ ...prev, [exerciseId]: { ...prev[exerciseId], error: t('gym_error_reps') } }))
      return
    }
    setQuickSet(prev => ({ ...prev, [exerciseId]: { ...prev[exerciseId], saving: true } }))
    const sess = await ensureSession(exerciseId)
    if (!sess) {
      setQuickSet(prev => ({ ...prev, [exerciseId]: { ...prev[exerciseId], saving: false, error: 'Błąd' } }))
      return
    }
    const nextNum = (sess.sets?.length || 0) + 1
    const { data, error } = await supabase
      .from('gym_sets')
      .insert({ session_id: sess.id, set_number: nextNum, weight_kg: form.weight ? parseFloat(form.weight) : null, reps })
      .select().single()
    if (error) {
      setQuickSet(prev => ({ ...prev, [exerciseId]: { ...prev[exerciseId], saving: false, error: error.message } }))
      return
    }
    setSessions(prev => prev.map(s => s.id === sess.id ? { ...s, sets: [...s.sets, data] } : s))
    setWeekActivity(prev => new Set([...prev, date]))
    setQuickSet(prev => { const n = { ...prev }; delete n[exerciseId]; return n })
  }

  function startEditSet(exerciseId, st) {
    setQuickSet(prev => { const n = { ...prev }; delete n[exerciseId]; return n })
    setEditSet({
      exerciseId,
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
    setSessions(prev => prev.map(s => s.exercise_id === editSet.exerciseId
      ? { ...s, sets: s.sets.map(st => st.id === editSet.setId ? { ...st, weight_kg, reps } : st) }
      : s))
    setEditSet(null)
  }

  function startEditName(ex) {
    setExpanded(prev => new Set(prev).add(ex.id))
    setEditName({ exerciseId: ex.id, value: ex.name || '' })
  }

  async function saveEditName() {
    if (!editName) return
    const name = editName.value.trim()
    const current = exercises.find(ex => ex.id === editName.exerciseId)
    if (!name || name === current?.name) { setEditName(null); return }
    const { error } = await supabase.from('gym_exercises').update({ name }).eq('id', editName.exerciseId)
    if (!error) {
      setExercises(prev => prev.map(ex => ex.id === editName.exerciseId ? { ...ex, name } : ex))
    }
    setEditName(null)
  }

  async function deleteSet(exerciseId, setId) {
    await supabase.from('gym_sets').delete().eq('id', setId)
    setSessions(prev => prev.map(s =>
      s.exercise_id === exerciseId
        ? { ...s, sets: s.sets.filter(st => st.id !== setId).map((st, i) => ({ ...st, set_number: i + 1 })) }
        : s
    ))
  }

  async function deleteExercise(exerciseId) {
    await supabase.from('gym_exercises').delete().eq('id', exerciseId)
    setExercises(prev => prev.filter(ex => ex.id !== exerciseId))
    setSessions(prev => prev.filter(s => s.exercise_id !== exerciseId))
  }

  async function moveExercise(index, dir) {
    const target = index + dir
    if (target < 0 || target >= exercises.length) return
    const a = exercises[index], b = exercises[target]
    const newList = exercises.map(ex => {
      if (ex.id === a.id) return { ...ex, sort_order: b.sort_order }
      if (ex.id === b.id) return { ...ex, sort_order: a.sort_order }
      return ex
    }).sort((x, y) => (x.sort_order - y.sort_order) || x.name.localeCompare(y.name))
    setExercises(newList)
    await Promise.all([
      supabase.from('gym_exercises').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('gym_exercises').update({ sort_order: a.sort_order }).eq('id', b.id),
    ])
  }

  async function toggleExpand(ex) {
    const isOpen = expanded.has(ex.id)
    setExpanded(prev => {
      const n = new Set(prev)
      isOpen ? n.delete(ex.id) : n.add(ex.id)
      return n
    })
    if (!isOpen && !history[ex.id]) {
      setHistory(prev => ({ ...prev, [ex.id]: { loading: true, session: null } }))
      const { data } = await supabase
        .from('gym_sessions')
        .select('performed_at, sets:gym_sets(*)')
        .eq('user_id', user.id)
        .eq('exercise_id', ex.id)
        .lt('performed_at', date)
        .order('performed_at', { ascending: false })
        .limit(5)
      // pick the most recent session that actually has sets
      const prevSess = (data || []).map(s => ({ ...s, sets: (s.sets || []).slice().sort((a, b) => a.set_number - b.set_number) }))
        .find(s => s.sets.length > 0) || null
      setHistory(prev => ({ ...prev, [ex.id]: { loading: false, session: prevSess } }))
    }
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
          {exercises.length === 0 && !addOpen && (
            <div className="gym-empty-state">
              <div className="gym-empty-icon">🏋️</div>
              <p className="gym-empty-text">{t('gym_no_exercises')}</p>
            </div>
          )}

          {exercises.map((ex, i) => {
            const sess = sessionByExercise[ex.id]
            const sets = sess?.sets || []
            const qf = quickSet[ex.id]
            const isExpanded = expanded.has(ex.id)
            const hist = history[ex.id]
            return (
              <div key={ex.id} className="gym-card">
                {confirmDelete === ex.id ? (
                  <div className="gym-confirm-bar">
                    <span className="gym-confirm-text">{t('gym_confirm_delete_full')} „{ex.name}"?</span>
                    <div className="gym-confirm-actions">
                      <button type="button" className="gym-confirm-yes" onClick={() => { deleteExercise(ex.id); setConfirmDelete(null) }}>{t('gym_confirm_yes')}</button>
                      <button type="button" className="gym-confirm-no" onClick={() => setConfirmDelete(null)}>{t('gym_confirm_no')}</button>
                    </div>
                  </div>
                ) : (
                  <div className="gym-card-header">
                    {editName && editName.exerciseId === ex.id ? (
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
                      <button type="button" className="gym-card-toggle" onClick={() => toggleExpand(ex)}>
                        <span className={`gym-chevron${isExpanded ? ' open' : ''}`}>›</span>
                        <span className="gym-card-name-text">{ex.name}</span>
                      </button>
                    )}
                    <div className="gym-card-tools">
                      <button type="button" className="gym-reorder" onClick={() => moveExercise(i, -1)} disabled={i === 0} title={t('gym_move_up')}>▲</button>
                      <button type="button" className="gym-reorder" onClick={() => moveExercise(i, 1)} disabled={i === exercises.length - 1} title={t('gym_move_down')}>▼</button>
                      <button type="button" className="gym-card-delete" onClick={() => setConfirmDelete(ex.id)} title={t('gym_delete_exercise')}>✕</button>
                    </div>
                  </div>
                )}

                <div className="gym-sets-summary">
                  {sets.map(st => {
                    if (editSet && editSet.setId === st.id) {
                      return (
                        <div key={st.id} className="gym-set-edit">
                          <input type="number" className="gym-quick-input" placeholder="kg" value={editSet.weight} min="0" step="0.5" inputMode="decimal" autoFocus
                            onChange={e => setEditSet(p => ({ ...p, weight: e.target.value }))} disabled={editSet.saving} />
                          <span className="gym-quick-x">×</span>
                          <input type="number" className="gym-quick-input" placeholder="pow." value={editSet.reps} min="1" inputMode="numeric"
                            onChange={e => setEditSet(p => ({ ...p, reps: e.target.value }))} disabled={editSet.saving} />
                          <button type="button" className="gym-quick-save" onClick={saveEditSet} disabled={editSet.saving} title={t('gym_modal_save')}>✓</button>
                          <button type="button" className="gym-set-edit-delete" onClick={() => { deleteSet(ex.id, st.id); setEditSet(null) }} disabled={editSet.saving} title={t('gym_delete_set')}>🗑</button>
                          <button type="button" className="gym-quick-cancel" onClick={() => setEditSet(null)}>✕</button>
                          {editSet.error && <p className="error" style={{ width: '100%', fontSize: '0.78rem', margin: '4px 0 0' }}>{editSet.error}</p>}
                        </div>
                      )
                    }
                    return (
                      <button key={st.id} type="button" className="gym-set-chip" onClick={() => startEditSet(ex.id, st)} title={t('gym_edit_set')}>
                        {formatSet(st)}
                      </button>
                    )
                  })}
                </div>

                {qf ? (
                  <div className="gym-quick-set-form">
                    <input type="number" className="gym-quick-input" placeholder="kg" value={qf.weight} min="0" step="0.5" inputMode="decimal"
                      onChange={e => setQuickSet(prev => ({ ...prev, [ex.id]: { ...prev[ex.id], weight: e.target.value } }))}
                      disabled={qf.saving} autoFocus />
                    <span className="gym-quick-x">×</span>
                    <input type="number" className="gym-quick-input" placeholder="pow." value={qf.reps} min="1" inputMode="numeric"
                      onChange={e => setQuickSet(prev => ({ ...prev, [ex.id]: { ...prev[ex.id], reps: e.target.value } }))}
                      disabled={qf.saving} />
                    <button type="button" className="gym-quick-save" onClick={() => quickSaveSet(ex.id)} disabled={qf.saving}>✓</button>
                    <button type="button" className="gym-quick-cancel" onClick={() => setQuickSet(prev => { const n = { ...prev }; delete n[ex.id]; return n })}>✕</button>
                    {qf.error && <p className="error" style={{ width: '100%', fontSize: '0.78rem', margin: '4px 0 0' }}>{qf.error}</p>}
                  </div>
                ) : (
                  <button type="button" className="gym-add-set-inline" onClick={() => setQuickSet(prev => ({ ...prev, [ex.id]: { weight: '', reps: '', saving: false, error: null } }))}>
                    + seria
                  </button>
                )}

                {isExpanded && (
                  <div className="gym-history">
                    {hist?.loading ? (
                      <p className="gym-history-empty">{t('loading')}</p>
                    ) : hist?.session ? (
                      <>
                        <div className="gym-history-label">{t('gym_history_prev')} · {formatShortDate(hist.session.performed_at, lang)}</div>
                        <div className="gym-sets-summary readonly">
                          {hist.session.sets.map(st => (
                            <span key={st.id} className="gym-set-chip readonly">{formatSet(st)}</span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="gym-history-empty">{t('gym_history_none')}</p>
                    )}
                    <button type="button" className="gym-rename-link" onClick={() => startEditName(ex)}>✎ {t('gym_edit_name')}</button>
                  </div>
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
                <input
                  ref={nameInputRef}
                  type="text"
                  className="gym-add-name-input"
                  placeholder={t('gym_modal_name_placeholder')}
                  value={addName}
                  onChange={e => setAddName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddExercise() }}
                  maxLength={60}
                  disabled={addSaving}
                />
                <p className="gym-add-hint">{t('gym_add_hint')}</p>

                {addError && <p className="error" style={{ margin: '8px 0 0', fontSize: '0.82rem' }}>{addError}</p>}

                <div className="gym-add-actions">
                  <button type="button" className="gym-save-btn" onClick={handleAddExercise} disabled={addSaving}>
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
