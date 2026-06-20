import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useLang } from '../LangContext'

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(iso, n) {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getWeekDays() {
  const today = new Date()
  const dow = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dow + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
}

function formatDateLabel(iso, lang) {
  const today = todayISO()
  const yesterday = addDays(today, -1)
  if (iso === today) return lang === 'pl' ? 'Dziś' : 'Today'
  if (iso === yesterday) return lang === 'pl' ? 'Wczoraj' : 'Yesterday'
  const d = new Date(iso + 'T12:00:00')
  const dayNames = lang === 'pl'
    ? ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb']
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  const months = lang === 'pl'
    ? ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${dayNames[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`
}

function formatSet(st) {
  if (st.weight_kg != null) return `${st.weight_kg}×${st.reps}`
  return `${st.reps} pow.`
}

export default function Gym({ user }) {
  const { t, lang } = useLang()
  const today = todayISO()
  const weekDays = useMemo(getWeekDays, [])
  const DAY_SHORTS = lang === 'pl'
    ? ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd']
    : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

  const [date, setDate] = useState(today)
  const [sessions, setSessions] = useState([])
  const [allExercises, setAllExercises] = useState([])
  const [weekActivity, setWeekActivity] = useState(new Set())
  const [loading, setLoading] = useState(true)

  // Add panel
  const [addOpen, setAddOpen] = useState(false)
  const [addName, setAddName] = useState('')
  const [addSets, setAddSets] = useState([{ weight: '', reps: '' }])
  const [addSaving, setAddSaving] = useState(false)
  const [addError, setAddError] = useState(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const nameInputRef = useRef(null)

  // Quick-add set state per existing session
  const [quickSet, setQuickSet] = useState({}) // { [sessionId]: { weight, reps, saving, error } | null }

  useEffect(() => {
    let ignore = false
    async function load() {
      setLoading(true)
      const weekStart = weekDays[0]
      const weekEnd = weekDays[6]
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
          .gte('performed_at', weekStart)
          .lte('performed_at', weekEnd),
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
  }, [user.id, date, weekDays])

  const suggestions = useMemo(() => {
    if (!addName.trim()) return []
    const q = addName.toLowerCase()
    return allExercises.filter(ex => ex.name.toLowerCase().includes(q)).slice(0, 5)
  }, [addName, allExercises])

  function openAdd() {
    setAddName('')
    setAddSets([{ weight: '', reps: '' }])
    setAddError(null)
    setAddOpen(true)
    setTimeout(() => nameInputRef.current?.focus(), 100)
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
      .insert({
        session_id: sessionId,
        set_number: nextNum,
        weight_kg: form.weight ? parseFloat(form.weight) : null,
        reps,
      })
      .select().single()
    if (error) {
      setQuickSet(prev => ({ ...prev, [sessionId]: { ...prev[sessionId], saving: false, error: error.message } }))
      return
    }
    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, sets: [...s.sets, data] } : s
    ))
    setQuickSet(prev => { const n = { ...prev }; delete n[sessionId]; return n })
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

      {/* Weekly activity chart + date — sticky header */}
      <div className="gym-sticky-header">
      <div className="gym-week">
        {weekDays.map((d, i) => (
          <button
            key={d}
            type="button"
            className={`gym-week-day${weekActivity.has(d) ? ' has-activity' : ''}${d === date ? ' current' : ''}${d === today ? ' today' : ''}`}
            onClick={() => setDate(d)}
          >
            <span className="gym-week-day-name">{DAY_SHORTS[i]}</span>
            <span className="gym-week-dot" />
          </button>
        ))}
      </div>

      {/* Date navigation */}
      <div className="gym-date-row" style={{ paddingBottom: '0.5rem' }}>
        <button type="button" className="gym-date-arrow" onClick={() => setDate(d => addDays(d, -1))}>‹</button>
        <span className="gym-date-label">{formatDateLabel(date, lang)}</span>
        <button type="button" className="gym-date-arrow" onClick={() => setDate(d => addDays(d, 1))} disabled={date >= today}>›</button>
      </div>
      </div>{/* end gym-sticky-header */}

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
                  <span className="gym-card-name">{sess.exercise?.name}</span>
                  <button type="button" className="gym-card-delete" onClick={() => deleteSession(sess.id)}>✕</button>
                </div>

                {/* Sets summary */}
                <div className="gym-sets-summary">
                  {sess.sets.map(st => (
                    <button
                      key={st.id}
                      type="button"
                      className="gym-set-chip"
                      onClick={() => deleteSet(sess.id, st.id)}
                      title={t('gym_delete_set')}
                    >
                      {formatSet(st)}
                    </button>
                  ))}
                </div>

                {/* Quick add set */}
                {qf ? (
                  <div className="gym-quick-set-form">
                    <input
                      type="number"
                      className="gym-quick-input"
                      placeholder="kg"
                      value={qf.weight}
                      min="0"
                      step="0.5"
                      inputMode="decimal"
                      onChange={e => setQuickSet(prev => ({ ...prev, [sess.id]: { ...prev[sess.id], weight: e.target.value } }))}
                      disabled={qf.saving}
                      autoFocus
                    />
                    <span className="gym-quick-x">×</span>
                    <input
                      type="number"
                      className="gym-quick-input"
                      placeholder="pow."
                      value={qf.reps}
                      min="1"
                      inputMode="numeric"
                      onChange={e => setQuickSet(prev => ({ ...prev, [sess.id]: { ...prev[sess.id], reps: e.target.value } }))}
                      disabled={qf.saving}
                    />
                    <button type="button" className="gym-quick-save" onClick={() => quickSaveSet(sess.id)} disabled={qf.saving}>✓</button>
                    <button type="button" className="gym-quick-cancel" onClick={() => setQuickSet(prev => { const n = {...prev}; delete n[sess.id]; return n })}>✕</button>
                    {qf.error && <p className="error" style={{ width: '100%', fontSize: '0.78rem', margin: '4px 0 0' }}>{qf.error}</p>}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="gym-add-set-inline"
                    onClick={() => setQuickSet(prev => ({ ...prev, [sess.id]: { weight: '', reps: '', saving: false, error: null } }))}
                  >
                    + seria
                  </button>
                )}
              </div>
            )
          })}

          {/* Add exercise button */}
          {!addOpen && (
            <button type="button" className="gym-add-exercise-btn" onClick={openAdd}>
              + Dodaj ćwiczenie
            </button>
          )}
        </div>
      )}

      {/* Add exercise panel */}
      {addOpen && (
        <div className="gym-add-panel">
          <div className="gym-add-panel-inner">
            {/* Name field */}
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
                    <button
                      key={ex.id}
                      type="button"
                      className="gym-suggestion-btn"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => { setAddName(ex.name); setShowSuggestions(false) }}
                    >
                      {ex.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sets table */}
            <div className="gym-add-sets-table">
              <div className="gym-add-sets-header">
                <span>Seria</span>
                <span>Ciężar × Powtórzenia</span>
              </div>
              {addSets.map((s, i) => (
                <div key={i} className="gym-add-set-row">
                  <span className="gym-add-set-num">{i + 1}</span>
                  <div className="gym-add-set-inputs">
                    <input
                      type="number"
                      className="gym-add-set-input"
                      placeholder="kg"
                      value={s.weight}
                      min="0"
                      step="0.5"
                      inputMode="decimal"
                      onChange={e => setAddSets(prev => prev.map((row, j) => j === i ? { ...row, weight: e.target.value } : row))}
                      disabled={addSaving}
                    />
                    <span className="gym-add-set-x">×</span>
                    <input
                      type="number"
                      className="gym-add-set-input"
                      placeholder="pow."
                      value={s.reps}
                      min="1"
                      inputMode="numeric"
                      onChange={e => setAddSets(prev => prev.map((row, j) => j === i ? { ...row, reps: e.target.value } : row))}
                      disabled={addSaving}
                    />
                    {addSets.length > 1 && (
                      <button
                        type="button"
                        className="gym-add-set-remove"
                        onClick={() => setAddSets(prev => prev.filter((_, j) => j !== i))}
                        disabled={addSaving}
                      >✕</button>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="gym-add-more-set-btn"
                onClick={() => setAddSets(prev => [...prev, { weight: '', reps: '' }])}
                disabled={addSaving}
              >
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
  )
}
