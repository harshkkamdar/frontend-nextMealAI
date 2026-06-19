'use client'

import { use, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, ChevronLeft, ChevronRight, MessageCircle, Plus, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { RestTimer } from '@/components/workout/rest-timer'
import { unlockAudio } from '@/lib/audio'
import { useUIStore } from '@/stores/ui.store'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import {
  getWorkoutSession,
  updateWorkoutSession,
  completeWorkoutSession,
  abandonWorkoutSession
} from '@/lib/api/workout-sessions.api'
import { searchExercises, type ExerciseSearchResult } from '@/lib/api/exercises.api'
import { NumberField, SearchablePicker } from '@/components/plans/plan-builder-shared'
import { cn } from '@/lib/utils'
import {
  resolveElapsedForSession,
  computeCompleteSetResult,
  isExerciseComplete,
  nextIncompleteExerciseIndex,
  firstIncompleteExerciseIndex,
} from '@/lib/workout-session'
import type { WorkoutSession, SessionExercise } from '@/types/workout-session.types'

function formatRest(secs: number): string {
  if (secs >= 60) return `${Math.floor(secs / 60)}m${secs % 60 ? ` ${secs % 60}s` : ''}`
  return `${secs}s`
}

export default function WorkoutFollowPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params)
  const router = useRouter()
  const [session, setSession] = useState<WorkoutSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRestTimer, setShowRestTimer] = useState(false)
  const [restSeconds, setRestSeconds] = useState(90)
  // FB-05 follow-up — bumped on every set completion so the RestTimer
  // countdown resets to full duration even when duration itself is unchanged.
  const [restKey, setRestKey] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [completing, setCompleting] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [showExitSheet, setShowExitSheet] = useState(false)
  const [removeConfirm, setRemoveConfirm] = useState(false)
  // Guided one-exercise-at-a-time view: which exercise is on screen.
  const [currentIndex, setCurrentIndex] = useState(0)
  const initedRef = useRef(false)
  const [celebrate, setCelebrate] = useState(false)
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addPick, setAddPick] = useState<ExerciseSearchResult | null>(null)
  const [addSets, setAddSets] = useState<number | undefined>(3)
  const [addReps, setAddReps] = useState<number | undefined>(10)
  const [addRest, setAddRest] = useState<number | undefined>(90)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useSetGeoScreen('workout_follow', { sessionId, currentExercise: null, exerciseIndex: currentIndex })

  const loadSession = useCallback((showToast = false) => {
    return getWorkoutSession(sessionId)
      .then((s) => {
        setSession(s)
        if (showToast) toast.success('Workout updated!')
      })
      .catch(() => { toast.error('Failed to load workout'); router.back() })
  }, [sessionId, router])

  useEffect(() => {
    loadSession().finally(() => setLoading(false))
  }, [loadSession])

  // Re-fetch when Geo swaps an exercise via the companion.
  useEffect(() => {
    const handler = () => loadSession(true)
    window.addEventListener('workout:session-updated', handler)
    return () => window.removeEventListener('workout:session-updated', handler)
  }, [loadSession])

  // Open on the first incomplete exercise (once, after load).
  useEffect(() => {
    if (session && !initedRef.current && session.exercises.length > 0) {
      setCurrentIndex(firstIncompleteExerciseIndex(session.exercises))
      initedRef.current = true
    }
  }, [session])

  // Keep currentIndex in range when the exercise list shrinks (remove).
  useEffect(() => {
    const n = session?.exercises.length ?? 0
    if (n > 0 && currentIndex > n - 1) setCurrentIndex(n - 1)
  }, [session, currentIndex])

  useEffect(() => () => { if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current) }, [])

  useEffect(() => {
    if (!session || session.status !== 'in_progress') return
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [session])

  useEffect(() => {
    if (!session?.started_at) return
    const { elapsedSeconds: resolved, needsReset } = resolveElapsedForSession(session.started_at, Date.now())
    if (needsReset) {
      setElapsedSeconds(0)
      const nowIso = new Date().toISOString()
      updateWorkoutSession(sessionId, { started_at: nowIso }).catch(() => {})
      setSession((prev) => (prev ? { ...prev, started_at: nowIso } : prev))
      return
    }
    setElapsedSeconds(resolved)
  }, [session?.started_at, sessionId])

  // Recalculate elapsed when tab regains focus (mobile throttles setInterval).
  useEffect(() => {
    if (!session?.started_at || session.status !== 'in_progress') return
    const onVisible = () => {
      if (!document.hidden) {
        const { elapsedSeconds: resolved } = resolveElapsedForSession(session.started_at, Date.now())
        setElapsedSeconds(resolved)
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [session?.started_at, session?.status])

  const saveExercises = useCallback((exercises: SessionExercise[]) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      updateWorkoutSession(sessionId, { exercises }).catch(() => {})
    }, 500)
  }, [sessionId])

  const exercises = session?.exercises ?? []
  const current = exercises[currentIndex] ?? null

  const updateSet = (exIndex: number, setIndex: number, field: string, value: any) => {
    if (!session) return
    const updated = [...session.exercises]
    const sets = [...updated[exIndex].sets]
    sets[setIndex] = { ...sets[setIndex], [field]: value }
    updated[exIndex] = { ...updated[exIndex], sets }
    setSession({ ...session, exercises: updated })
    saveExercises(updated)
  }

  const completeSet = (exIndex: number, setIndex: number) => {
    if (!session) return
    unlockAudio()
    const result = computeCompleteSetResult(session.exercises, exIndex, setIndex, new Date().toISOString())
    setSession({ ...session, exercises: result.exercises })
    saveExercises(result.exercises)

    if (result.rest.show) {
      setRestSeconds(result.rest.seconds)
      setShowRestTimer(true)
    }
    if (result.rest.bumpKey) setRestKey((k) => k + 1)

    // Auto-advance: if THIS exercise just became fully complete, celebrate then
    // move to the next incomplete one (the rest timer overlays the transition).
    if (exIndex === currentIndex && isExerciseComplete(result.exercises[exIndex])) {
      setCelebrate(true)
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = setTimeout(() => {
        setCelebrate(false)
        const next = nextIncompleteExerciseIndex(result.exercises, exIndex)
        if (next >= 0) setCurrentIndex(next)
      }, 1100)
    }
  }

  const handleComplete = async () => {
    if (completing) return
    setCompleting(true)
    try {
      const completed = await completeWorkoutSession(sessionId)
      setSession(completed)
      setShowSummary(true)
    } catch {
      toast.error('Failed to complete workout')
    } finally {
      setCompleting(false)
    }
  }

  const handleBack = () => {
    if (showSummary || session?.status === 'completed') { router.push('/activity'); return }
    setShowExitSheet(true)
  }

  const handleSaveAndExit = () => router.push('/activity')

  const handleDiscard = async () => {
    try {
      await abandonWorkoutSession(sessionId)
      toast.success('Workout discarded')
      router.push('/activity')
    } catch {
      toast.error('Failed to discard workout')
    }
  }

  const handleRemoveExercise = (exIndex: number) => {
    if (!session) return
    const next = session.exercises.filter((_, i) => i !== exIndex)
    setSession({ ...session, exercises: next })
    setRemoveConfirm(false)
    if (currentIndex >= next.length) setCurrentIndex(Math.max(0, next.length - 1))
    updateWorkoutSession(sessionId, { exercises: next })
      .then(() => toast.success('Exercise removed'))
      .catch(() => toast.error('Failed to remove exercise'))
  }

  const resetAddForm = () => {
    setShowAddForm(false)
    setAddPick(null)
    setAddSets(3)
    setAddReps(10)
    setAddRest(90)
  }

  const handleAddExercise = () => {
    if (!session || !addPick) return
    const sets = addSets ?? 3
    const reps = addReps ?? 10
    const restSecs = addRest ?? 90
    const newExercise: SessionExercise = {
      name: addPick.name,
      muscle_group: addPick.primary_muscles?.[0] ?? null,
      planned_sets: sets,
      planned_reps: reps,
      rest_seconds: restSecs,
      instructions: [],
      notes: null,
      status: 'pending',
      sets: Array.from({ length: sets }, (_, i) => ({
        set_number: i + 1,
        planned_reps: reps,
        planned_weight_kg: null,
        actual_reps: null,
        actual_weight_kg: null,
        completed: false,
        completed_at: null,
      })),
    }
    const next = [...session.exercises, newExercise]
    setSession({ ...session, exercises: next })
    resetAddForm()
    setCurrentIndex(next.length - 1)
    updateWorkoutSession(sessionId, { exercises: next })
      .then(() => toast.success('Exercise added'))
      .catch(() => toast.error('Failed to add exercise'))
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return null

  if (showSummary) {
    const completedExercises = exercises.filter((e) => e.status === 'completed').length
    return (
      <div className="h-dvh flex flex-col bg-background">
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-4"
          >
            <Check className="w-10 h-10 text-success" />
          </motion.div>
          <h1 className="text-2xl font-semibold text-text-primary mb-2">Workout Complete!</h1>
          <p className="text-sm text-text-secondary mb-6">{session.day_name}</p>
          <div className="grid grid-cols-3 gap-4 w-full max-w-xs mb-8">
            <div className="bg-surface border border-border rounded-xl p-3 text-center">
              <p className="text-lg font-semibold text-text-primary">{session.duration_minutes ?? 0}</p>
              <p className="text-[10px] text-text-tertiary">minutes</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-3 text-center">
              <p className="text-lg font-semibold text-text-primary">{completedExercises}</p>
              <p className="text-[10px] text-text-tertiary">exercises</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-3 text-center">
              <p className="text-lg font-semibold text-text-primary">{(session.total_volume_kg ?? 0).toLocaleString()}</p>
              <p className="text-[10px] text-text-tertiary">kg volume</p>
            </div>
          </div>
          <Button onClick={() => router.push('/activity')} className="w-full max-w-xs bg-accent hover:bg-accent-hover text-white">
            Done
          </Button>
        </div>
      </div>
    )
  }

  const total = exercises.length
  const allComplete = total > 0 && exercises.every(isExerciseComplete)
  const currentComplete = current ? isExerciseComplete(current) : false

  return (
    <div className="h-dvh flex flex-col bg-background">
      <RestTimer
        isActive={showRestTimer}
        duration={restSeconds}
        resetToken={restKey}
        onSkip={() => setShowRestTimer(false)}
        onComplete={() => setShowRestTimer(false)}
      />

      {/* Header: back · day + timer · finish */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <button onClick={handleBack} aria-label="Go back" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-hover">
            <ArrowLeft className="w-5 h-5 text-text-primary" />
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-text-primary">{session.day_name}</p>
            <p className="text-xs text-accent tabular-nums">{formatTime(elapsedSeconds)}</p>
          </div>
          <button
            onClick={handleComplete}
            disabled={completing}
            aria-label="Complete workout"
            className="px-3 h-8 flex items-center justify-center rounded-full bg-success/10 hover:bg-success/20 text-success text-xs font-semibold"
          >
            Finish
          </button>
        </div>

        {/* Segmented progress — one segment per exercise, tap to jump */}
        {total > 0 && (
          <div className="flex items-center gap-1 mt-2.5">
            {exercises.map((ex, i) => {
              const done = isExerciseComplete(ex)
              return (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  aria-label={`Go to exercise ${i + 1}: ${ex.name}`}
                  className="flex-1 h-1.5 rounded-full overflow-hidden bg-border"
                >
                  <span
                    className={cn(
                      'block h-full rounded-full transition-colors',
                      done ? 'bg-success w-full' : i === currentIndex ? 'bg-accent w-full' : 'w-0'
                    )}
                  />
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Current exercise (one at a time) */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28">
        {!current ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-sm text-text-secondary">No exercises in this session.</p>
            <Button onClick={() => setShowAddForm(true)} className="bg-accent text-white">Add an exercise</Button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22 }}
              className="relative"
            >
              {/* Exercise-complete celebration burst */}
              <AnimatePresence>
                {celebrate && (
                  <motion.div
                    key="celebrate"
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.3 }}
                    className="absolute inset-x-0 -top-1 z-10 flex justify-center pointer-events-none"
                  >
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success text-white text-xs font-semibold px-3 py-1.5 shadow-lg">
                      <Check className="w-3.5 h-3.5" /> Nice — exercise done!
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
                    Exercise {currentIndex + 1} of {total}
                    {current.muscle_group && <span className="text-accent ml-2 normal-case tracking-normal">{current.muscle_group}</span>}
                  </p>
                  <h1 className="text-xl font-semibold text-text-primary mt-1 leading-tight">{current.name}</h1>
                  <p className="text-xs text-text-secondary mt-1">
                    {current.planned_sets} × {current.planned_reps}
                    {current.rest_seconds ? ` · ${formatRest(current.rest_seconds)} rest` : ''}
                  </p>
                </div>
                {/* Remove this exercise */}
                {removeConfirm ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setRemoveConfirm(false)} className="text-[11px] px-2 py-1 rounded-md text-text-secondary hover:bg-surface-hover">Cancel</button>
                    <button onClick={() => handleRemoveExercise(currentIndex)} className="text-[11px] px-2 py-1 rounded-md bg-destructive/10 text-destructive font-medium">Remove</button>
                  </div>
                ) : (
                  <button onClick={() => setRemoveConfirm(true)} aria-label={`Remove ${current.name}`} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-text-tertiary hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {current.instructions && current.instructions.length > 0 && (
                <details className="mt-3">
                  <summary className="text-xs text-accent cursor-pointer">How to perform</summary>
                  <ol className="mt-2 space-y-1 pl-4 list-decimal">
                    {current.instructions.map((step, i) => (
                      <li key={i} className="text-xs text-text-secondary">{step}</li>
                    ))}
                  </ol>
                </details>
              )}

              {/* Sets */}
              <div className="bg-surface border border-border rounded-2xl overflow-hidden mt-4">
                <div className="grid grid-cols-[36px_1fr_1fr_1fr_52px] gap-1 px-3 py-2 border-b border-border text-[10px] font-medium text-text-tertiary uppercase tracking-wide">
                  <span>Set</span><span>Previous</span><span>Reps</span><span>kg</span><span />
                </div>
                {current.sets.map((set, setIdx) => (
                  <div
                    key={setIdx}
                    className={cn(
                      'grid grid-cols-[36px_1fr_1fr_1fr_52px] gap-1 items-center px-3 py-3 border-b border-border/50 last:border-b-0 transition-colors',
                      set.completed && 'bg-success/5'
                    )}
                  >
                    <span className="text-sm font-semibold text-text-primary">{set.set_number}</span>
                    <span className="text-xs text-text-tertiary tabular-nums">
                      {set.previous_reps && set.previous_weight_kg ? `${set.previous_reps}×${set.previous_weight_kg}` : '—'}
                    </span>
                    <input
                      type="number" inputMode="numeric"
                      value={set.actual_reps ?? ''} placeholder={String(set.planned_reps)}
                      onChange={(e) => updateSet(currentIndex, setIdx, 'actual_reps', e.target.value ? Number(e.target.value) : null)}
                      className="w-full h-10 text-center text-sm bg-background border border-border rounded-lg focus:border-accent outline-none tabular-nums"
                    />
                    <input
                      type="number" inputMode="decimal"
                      value={set.actual_weight_kg ?? ''} placeholder={set.planned_weight_kg ? String(set.planned_weight_kg) : '—'}
                      onChange={(e) => updateSet(currentIndex, setIdx, 'actual_weight_kg', e.target.value ? Number(e.target.value) : null)}
                      className="w-full h-10 text-center text-sm bg-background border border-border rounded-lg focus:border-accent outline-none tabular-nums"
                    />
                    <motion.button
                      onClick={() => completeSet(currentIndex, setIdx)}
                      whileTap={{ scale: 0.85 }}
                      animate={set.completed ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                      transition={{ duration: 0.3 }}
                      aria-label={`Complete set ${set.set_number}`}
                      className={cn(
                        'w-9 h-9 rounded-full border-2 flex items-center justify-center mx-auto',
                        set.completed ? 'bg-success border-success' : 'border-border hover:border-accent'
                      )}
                    >
                      {set.completed && <Check className="w-5 h-5 text-white" />}
                    </motion.button>
                  </div>
                ))}
              </div>

              {/* Notes */}
              <textarea
                placeholder="Notes (form cues, how it felt...)"
                aria-label={`Notes for ${current.name}`}
                value={current.notes || ''}
                onChange={(e) => {
                  if (!session) return
                  const updated = [...session.exercises]
                  updated[currentIndex] = { ...updated[currentIndex], notes: e.target.value }
                  setSession({ ...session, exercises: updated })
                  saveExercises(updated)
                }}
                className="w-full mt-4 text-xs text-text-secondary bg-surface border border-border rounded-xl px-3 py-2 resize-none h-16 placeholder:text-text-tertiary outline-none focus:border-accent"
              />
            </motion.div>
          </AnimatePresence>
        )}

        {/* Add exercise form (inline) */}
        {showAddForm && (
          <div className="bg-surface border border-accent/40 rounded-xl p-4 space-y-3 mt-4">
            <SearchablePicker<ExerciseSearchResult>
              label="Exercise" placeholder="Search exercises…" search={searchExercises}
              renderItem={(item) => (
                <div className="flex flex-col">
                  <span className="text-sm text-text-primary">{item.name}</span>
                  {item.primary_muscles && item.primary_muscles.length > 0 ? (
                    <span className="text-[11px] text-text-tertiary">{item.primary_muscles.join(', ')}</span>
                  ) : null}
                </div>
              )}
              getItemKey={(item) => item.id} onSelect={(item) => setAddPick(item)}
              value={addPick?.name} onClear={() => setAddPick(null)}
            />
            <div className="grid grid-cols-3 gap-2">
              <NumberField label="Sets" value={addSets} onChange={setAddSets} min={1} max={20} step={1} />
              <NumberField label="Reps" value={addReps} onChange={setAddReps} min={1} max={100} step={1} />
              <NumberField label="Rest" value={addRest} onChange={setAddRest} min={0} max={600} step={5} suffix="s" />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={resetAddForm} className="flex-1 rounded-lg border border-border py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover">Cancel</button>
              <button onClick={handleAddExercise} disabled={!addPick} className="flex-1 rounded-lg bg-accent hover:bg-accent-hover py-2 text-sm font-semibold text-white disabled:opacity-50">Add</button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav: prev · add · next/finish */}
      <div className="sticky bottom-0 z-20 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex <= 0}
          aria-label="Previous exercise"
          className="w-11 h-11 flex items-center justify-center rounded-full border border-border text-text-primary disabled:opacity-30 hover:bg-surface-hover"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {!showAddForm && (
          <button onClick={() => setShowAddForm(true)} aria-label="Add exercise" className="w-11 h-11 flex items-center justify-center rounded-full border border-border text-text-secondary hover:bg-surface-hover">
            <Plus className="w-5 h-5" />
          </button>
        )}

        {allComplete ? (
          <Button onClick={handleComplete} disabled={completing} className="flex-1 h-11 bg-success hover:bg-success/90 text-white font-semibold">
            {completing ? 'Finishing…' : 'Finish workout 🎉'}
          </Button>
        ) : currentComplete ? (
          <Button
            onClick={() => { const n = nextIncompleteExerciseIndex(exercises, currentIndex); if (n >= 0) setCurrentIndex(n) }}
            className="flex-1 h-11 bg-accent hover:bg-accent-hover text-white font-semibold"
          >
            Next exercise <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <button
            onClick={() => setCurrentIndex((i) => Math.min(total - 1, i + 1))}
            disabled={currentIndex >= total - 1}
            className="flex-1 h-11 flex items-center justify-center gap-1 rounded-full border border-border text-text-primary text-sm font-medium disabled:opacity-30 hover:bg-surface-hover"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Floating Geo button */}
      <button
        onClick={() => useUIStore.getState().openSheet('geo-companion')}
        className="fixed bottom-20 right-4 w-12 h-12 rounded-full bg-accent shadow-lg shadow-accent/30 flex items-center justify-center z-20"
        aria-label="Ask Geo"
      >
        <MessageCircle className="w-5 h-5 text-white" />
      </button>

      {/* Exit confirmation sheet */}
      <AnimatePresence>
        {showExitSheet && (
          <>
            <motion.div
              key="exit-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }} className="fixed inset-0 z-40 bg-black/40" onClick={() => setShowExitSheet(false)}
            />
            <motion.div
              key="exit-sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl px-5 pt-3 pb-6 shadow-2xl"
            >
              <div className="flex justify-center mb-3"><div className="w-10 h-1 rounded-full bg-border" /></div>
              <p className="text-base font-semibold text-text-primary text-center mb-1">End workout?</p>
              <p className="text-xs text-text-secondary text-center mb-5">Pick what you&apos;d like to do with this session.</p>
              <div className="space-y-2">
                <button onClick={handleSaveAndExit} className="w-full rounded-xl bg-accent hover:bg-accent-hover py-3 text-sm font-semibold text-white">Save &amp; Exit</button>
                <button onClick={handleDiscard} className="w-full rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive py-3 text-sm font-semibold">Discard Workout</button>
                <button onClick={() => setShowExitSheet(false)} className="w-full rounded-xl py-3 text-sm font-medium text-text-secondary hover:bg-surface-hover">Cancel</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
