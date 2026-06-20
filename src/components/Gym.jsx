import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useLang } from '../LangContext'

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const CATEGORIES = ['chest', 'back', 'shoulders', 'legs', 'biceps', 'triceps', 'other']
const CAT_KEYS = {
  chest: 'gym_cat_chest',
  back: 'gym_cat_back',
  shoulders: 'gym_cat_shoulders',
  legs: 'gym_cat_legs',
  biceps: 'gym_cat_biceps',
  triceps: 'gym_cat_triceps',
  other: 'gym_cat_other',
}

export default function Gym({ user }) {
  const { t } = useLang()
  const [date, setDate] = useState(todayISO)
  const [exercises, setExercises] = useState([]) // user's exercise library
  const [sessions, setSessions] = useState([])   // today's sessions with sets
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalTab, setModalTab] = useState('pick') // 'pick' | 'new'
  const [newName, setNewName] = useState('')
  const [newCat, setNewCat] = useState('chest')
  const [modalSaving, setModalSaving] = useState(false)
  const [modalError, setModalError] = useState(null)
  // set being added per session: { [sessionId]: { weight: '', reps: '', saving: false, error: null } }
  const [addingSet, setAddingSet] = useState({})

  useEffect(() => {
    let ignore = false
    async function load() {
      setLoading(true)
      const [{ data: exData }, { data: sessData }] = await Promise.all([
        supabase.from('gym_exercises').select('*').eq('user_id', user.id).order('name'),
        supabase
          .from('gym_sessions')
          .select('*, exercise:gym_exercises(*), sets:gym_sets(*)')
          .eq('user_id', user.id)
          .eq('performed_at', date)
          .order('created_at'),
      ])
      if (!ignore) {
        setExercises(exData || [])
        const sorted = (sessData || []).map(s => ({
          ...s,
          sets: (s.sets || []).slice().sort((a, b) => a.set_number - b.set_number),
        }))
        setSessions(sorted)
        setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [user.id, date])

  async function addExerciseToDay(exerciseId) {
    const { data, error } = await supabase
      .from('gym_sessions')
      .insert({ user_id: user.id, exercise_id: exerciseId, performed_at: date })
      .select('*, exercise:gym_exercises(*), sets:gym_sets(*)')
      .single()
    if (!error && data) {
      setSessions(prev => [...prev, { ...data, sets: [] }])
    }
    setShowModal(false)
    setModalTab('pick')
    setNewName('')
    setNewCat('chest')
  }

  async function createAndAddExercise() {
    if (!newName.trim()) { setModalError(t('gym_error_name')); return }
    setModalSaving(true)
    setModalError(null)
    const { data: ex, error: exErr } = await supabase
      .from('gym_exercises')
      .insert({ user_id: user.id, name: newName.trim(), category: newCat })
      .select()
      .single()
    if (exErr) { setModalError(exErr.message); setModalSaving(false); return }
    setExercises(prev => [...prev, ex].sort((a, b) => a.name.localeCompare(b.name)))
    setModalSaving(false)
    await addExerciseToDay(ex.id)
  }

  function startAddSet(sessionId) {
    setAddingSet(prev => ({
      ...prev,
      [sessionId]: { weight: '', reps: '', saving: false, error: null },
    }))
  }

  function cancelAddSet(sessionId) {
    setAddingSet(prev => { const n = { ...prev }; delete n[sessionId]; return n })
  }

  async function saveSet(sessionId) {
    const form = addingSet[sessionId]
    if (!form) return
    const reps = parseInt(form.reps, 10)
    if (!reps || reps <= 0) {
      setAddingSet(prev => ({ ...prev, [sessionId]: { ...prev[sessionId], error: t('gym_error_reps') } }))
      return
    }
    const weightVal = form.weight ? parseFloat(form.weight) : null
    const sess = sessions.find(s => s.id === sessionId)
    const nextNum = (sess?.sets?.length || 0) + 1

    setAddingSet(prev => ({ ...prev, [sessionId]: { ...prev[sessionId], saving: true, error: null } }))
    const { data, error } = await supabase
      .from('gym_sets')
      .insert({ session_id: sessionId, set_number: nextNum, weight_kg: weightVal, reps })
      .select()
      .single()

    if (error) {
      setAddingSet(prev => ({ ...prev, [sessionId]: { ...prev[sessionId], saving: false, error: error.message } }))
      return
    }
    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, sets: [...s.sets, data] } : s
    ))
    setAddingSet(prev => ({ ...prev, [sessionId]: { weight: '', reps: '', saving: false, error: null } }))
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
    setAddingSet(prev => { const n = { ...prev }; delete n[sessionId]; return n })
  }

  const usedExerciseIds = new Set(sessions.map(s => s.exercise_id))

  return (
    <div className="gym-view">
      <div className="gym-header">
        <h2 className="gym-title">{t('gym_title')}</h2>
        <input
          type="date"
          className="gym-date-input"
          value={date}
          onChange={e => setDate(e.target.value)}
          aria-label={t('gym_date_label')}
        />
      </div>

      {loading ? (
        <div className="empty" style={{ padding: '2rem 0' }}>{t('loading')}</div>
      ) : (
        <>
          {sessions.length === 0 && (
            <p className="gym-empty">{t('gym_no_exercises')}</p>
          )}

          {sessions.map(sess => {
            const form = addingSet[sess.id]
            return (
              <div key={sess.id} className="gym-exercise-card">
                <div className="gym-exercise-header">
                  <div>
                    <span className="gym-exercise-name">{sess.exercise?.name}</span>
                    <span className="gym-exercise-cat">{t(CAT_KEYS[sess.exercise?.category] || 'gym_cat_other')}</span>
                  </div>
                  <button
                    type="button"
                    className="gym-delete-session-btn"
                    onClick={() => deleteSession(sess.id)}
                    title={t('gym_delete_exercise')}
                  >✕</button>
                </div>

                <div className="gym-sets-list">
                  {sess.sets.map(st => (
                    <div key={st.id} className="gym-set-row">
                      <span className="gym-set-num">{t('gym_set_label')} {st.set_number}</span>
                      <span className="gym-set-value">
                        {st.weight_kg != null ? `${st.weight_kg} kg × ` : ''}{st.reps} pow.
                      </span>
                      <button
                        type="button"
                        className="gym-delete-set-btn"
                        onClick={() => deleteSet(sess.id, st.id)}
                        title={t('gym_delete_set')}
                      >✕</button>
                    </div>
                  ))}
                </div>

                {form ? (
                  <div className="gym-add-set-form">
                    <input
                      type="number"
                      className="gym-set-input"
                      placeholder={t('gym_set_placeholder_weight')}
                      value={form.weight}
                      min="0"
                      step="0.5"
                      inputMode="decimal"
                      onChange={e => setAddingSet(prev => ({ ...prev, [sess.id]: { ...prev[sess.id], weight: e.target.value } }))}
                      disabled={form.saving}
                    />
                    <input
                      type="number"
                      className="gym-set-input"
                      placeholder={t('gym_set_placeholder_reps')}
                      value={form.reps}
                      min="1"
                      inputMode="numeric"
                      onChange={e => setAddingSet(prev => ({ ...prev, [sess.id]: { ...prev[sess.id], reps: e.target.value } }))}
                      disabled={form.saving}
                    />
                    <button type="button" className="gym-save-set-btn" onClick={() => saveSet(sess.id)} disabled={form.saving}>
                      {form.saving ? t('gym_saving') : t('gym_save_set')}
                    </button>
                    <button type="button" className="gym-cancel-set-btn" onClick={() => cancelAddSet(sess.id)} disabled={form.saving}>✕</button>
                    {form.error && <p className="error gym-set-error">{form.error}</p>}
                  </div>
                ) : (
                  <button type="button" className="gym-add-set-btn" onClick={() => startAddSet(sess.id)}>
                    {t('gym_add_set')}
                  </button>
                )}
              </div>
            )
          })}

          <button type="button" className="gym-add-exercise-btn" onClick={() => { setShowModal(true); setModalTab('pick'); setModalError(null) }}>
            {t('gym_add_exercise')}
          </button>
        </>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal gym-modal" onClick={e => e.stopPropagation()}>
            <h3 className="gym-modal-title">{t('gym_modal_title')}</h3>

            <div className="gym-modal-tabs">
              <button
                type="button"
                className={modalTab === 'pick' ? 'active' : ''}
                onClick={() => setModalTab('pick')}
              >Lista</button>
              <button
                type="button"
                className={modalTab === 'new' ? 'active' : ''}
                onClick={() => setModalTab('new')}
              >{t('gym_modal_new')}</button>
            </div>

            {modalTab === 'pick' && (
              <div className="gym-modal-list">
                {exercises.filter(ex => !usedExerciseIds.has(ex.id)).length === 0 ? (
                  <p className="muted" style={{ textAlign: 'center', padding: '1rem 0' }}>
                    Brak dostępnych ćwiczeń. Utwórz nowe.
                  </p>
                ) : (
                  exercises
                    .filter(ex => !usedExerciseIds.has(ex.id))
                    .map(ex => (
                      <button
                        key={ex.id}
                        type="button"
                        className="gym-modal-exercise-btn"
                        onClick={() => addExerciseToDay(ex.id)}
                      >
                        <span className="gym-modal-ex-name">{ex.name}</span>
                        <span className="gym-modal-ex-cat">{t(CAT_KEYS[ex.category] || 'gym_cat_other')}</span>
                      </button>
                    ))
                )}
              </div>
            )}

            {modalTab === 'new' && (
              <div className="gym-modal-new-form">
                <label className="gym-modal-label">
                  {t('gym_modal_name')}
                  <input
                    type="text"
                    className="gym-modal-input"
                    placeholder={t('gym_modal_name_placeholder')}
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    maxLength={60}
                    disabled={modalSaving}
                  />
                </label>
                <label className="gym-modal-label">
                  {t('gym_modal_category')}
                  <select
                    className="gym-modal-input"
                    value={newCat}
                    onChange={e => setNewCat(e.target.value)}
                    disabled={modalSaving}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{t(CAT_KEYS[c])}</option>
                    ))}
                  </select>
                </label>
                {modalError && <p className="error" style={{ marginTop: 8 }}>{modalError}</p>}
                <div className="gym-modal-actions">
                  <button type="button" className="gym-modal-save-btn" onClick={createAndAddExercise} disabled={modalSaving}>
                    {modalSaving ? t('gym_saving') : t('gym_modal_save')}
                  </button>
                  <button type="button" className="gym-modal-cancel-btn" onClick={() => setShowModal(false)} disabled={modalSaving}>
                    {t('gym_modal_cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
