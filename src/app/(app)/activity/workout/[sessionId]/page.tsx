'use client'

import { use, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, ChevronDown, MessageCircle, Trash2 } from 'lucide-react'
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
import { AddRowButton, NumberField, SearchablePicker } from '@/components/plans/plan-builder-shared'
import { cn } from '@/lib/utils'
import {
  resolveElapsedForSession,
  computeCompleteSetResult,
} from '@/lib/workout-session'
import type { WorkoutSession, SessionExercise } from '@/types/workout-session.types'

export default function WorkoutFollowPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params)
  const router = useRouter()
  const [session, setSession] = useState<WorkoutSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [collapsedIndices, setCollapsedIndices] = useState<Set<number>>(new Set())
  const [showRestTimer, setShowRestTimer] = useState(false)
  const [restSeconds, setRestSeconds] = useState(90)
  // FB-05 follow-up — bumped on every set completion so the RestTimer
  // countdown resets to full duration even when duration itself is unchanged.
  // Guards against the tick-ahead loophole.
  const [restKey, setRestKey] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [completing, setCompleting] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [showExitSheet, setShowExitSheet] = useState(false)
  const [removeConfirmIndex, setRemoveConfirmIndex] = useState<number | null>(null)
  // Dismiss the inline "Remove?" confirm on any outside tap so it doesn't
  // linger as a permanent-looking label after an accidental trash tap.
  useEffect(() => {
    if (removeConfirmIndex === null) return
    const onDocClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null
      if (target && target.closest('[data-remove-confirm="true"]')) return
      setRemoveConfirmIndex(null)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('touchstart', onDocClick)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('touchstart', onDocClick)
    }
  }, [removeConfirmIndex])
  const [showAddForm, setShowAddForm] = useState(false)
  const [addPick, setAddPick] = useState<ExerciseSearchResult | null>(null)
  const [addSets, setAddSets] = useState<number | undefined>(3)
  const [addReps, setAddReps] = useState<number | undefined>(10)
  const [addRest, setAddRest] = useState<number | undefined>(90)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useSetGeoScreen('workout_follow', {
    sessionId,
    currentExercise: null,
    exerciseIndex: 0,
  })

  const loadSession = useCallback((showToast = false) => {
    return getWorkoutSession(sessionId)
      .then((s) => {
        setSession(s)
        // All exercises expanded by default — no need to track expanded index
        if (showToast) toast.success('Workout updated!')
      })
      .catch(() => { toast.error('Failed to load workout'); router.back() })
  }, [sessionId, router])

  useEffect(() => {
    loadSession().finally(() => setLoading(false))
  }, [loadSession])

  // Re-fetch when Geo swaps an exercise via the companion
  useEffect(() => {
    const handler = () => loadSession(true)
    window.addEventListener('workout:session-updated', handler)
    return () => window.removeEventListener('workout:session-updated', handler)
  }, [loadSession])

  useEffect(() => {
    if (!session || session.status !== 'in_progress') return
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [session])

  useEffect(() => {
    if (!session?.started_at) return
    const { elapsedSeconds: resolved, needsReset } = resolveElapsedForSession(
      session.started_at,
      Date.now(),
    )

    if (needsReset) {
      // FB-05 follow-up — resumed-stale session. The previous `started_at` is
      // days old and would render a 10,000+ minute counter. Reset server-side
      // best-effort and zero out the local display. Lost work time is already
      // unrecoverable.
      setElapsedSeconds(0)
      const nowIso = new Date().toISOString()
      updateWorkoutSession(sessionId, { started_at: nowIso }).catch(() => {})
      setSession((prev) => (prev ? { ...prev, started_at: nowIso } : prev))
      return
    }

    setElapsedSeconds(resolved)
  }, [session?.started_at, sessionId])

  // FB-R4-02 — recalculate elapsed time when tab regains focus (setInterval
  // is throttled/killed by mobile browsers when the app is backgrounded).
  useEffect(() => {
    if (!session?.started_at || session.status !== 'in_progress') return
    const onVisible = () => {
      if (!document.hidden) {
        const { elapsedSeconds: resolved } = resolveElapsedForSession(
          session.started_at,
          Date.now(),
        )
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
    // FB-05 follow-up — delegate to pure helper so the three bug rules
    // (rest-timer on every non-final-exercise completion, rest_seconds=0 skip,
    // restKey bump even when duration is unchanged) are unit-tested in isolation.
    const result = computeCompleteSetResult(
      session.exercises,
      exIndex,
      setIndex,
      new Date().toISOString(),
    )
    setSession({ ...session, exercises: result.exercises })
    saveExercises(result.exercises)

    if (result.rest.show) {
      setRestSeconds(result.rest.seconds)
      setShowRestTimer(true)
    }
    if (result.rest.bumpKey) {
      setRestKey((k) => k + 1)
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

  const handleSaveAndExit = () => {
    // Session is already saved (debounced 500ms saves on every input). Just navigate.
    router.push('/activity')
  }

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
    setRemoveConfirmIndex(null)
    // Also clear any collapsed indices that are now out of range / shifted
    setCollapsedIndices((prev) => {
      const updated = new Set<number>()
      prev.forEach((idx) => {
        if (idx < exIndex) updated.add(idx)
        else if (idx > exIndex) updated.add(idx - 1)
      })
      return updated
    })
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
    const restSeconds = addRest ?? 90
    const newExercise: SessionExercise = {
      name: addPick.name,
      muscle_group: addPick.primary_muscles?.[0] ?? null,
      planned_sets: sets,
      planned_reps: reps,
      rest_seconds: restSeconds,
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
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-success" />
          </div>
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

  return (
    <div className="h-dvh flex flex-col bg-background">
      <RestTimer
        isActive={showRestTimer}
        duration={restSeconds}
        resetToken={restKey}
        onSkip={() => setShowRestTimer(false)}
        onComplete={() => setShowRestTimer(false)}
      />

      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
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
            className="w-8 h-8 flex items-center justify-center rounded-full bg-success/10 hover:bg-success/20"
          >
            <Check className="w-4 h-4 text-success" />
          </button>
        </div>
      </div>

      {/* Exercise accordion list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 pb-24">
        {exercises.map((exercise, exIndex) => {
          const isExpanded = !collapsedIndices.has(exIndex)
          const completedSets = exercise.sets.filter((s) => s.completed).length
          const totalSets = exercise.sets.length

          return (
            <div
              key={exIndex}
              className={cn(
                'bg-surface border rounded-xl overflow-hidden',
                exercise.status === 'completed' ? 'border-success/30' :
                isExpanded ? 'border-accent/50' :
                'border-border'
              )}
            >
              {/* Row header — tap to expand/collapse */}
              <div className="w-full flex items-center gap-1 pr-2">
                <button
                  onClick={() => setCollapsedIndices(prev => {
                    const next = new Set(prev)
                    next.has(exIndex) ? next.delete(exIndex) : next.add(exIndex)
                    return next
                  })}
                  className="flex-1 flex items-center gap-3 px-4 py-3 text-left"
                >
                  <div className={cn(
                    'w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
                    exercise.status === 'completed' ? 'bg-success border-success' :
                    exercise.status === 'in_progress' ? 'border-accent' :
                    'border-border'
                  )}>
                    {exercise.status === 'completed' && <Check className="w-3 h-3 text-white" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm font-medium truncate',
                      exercise.status === 'completed' ? 'text-text-secondary line-through' : 'text-text-primary'
                    )}>
                      {exercise.name}
                    </p>
                    <p className="text-[11px] text-text-tertiary mt-0.5">
                      {exercise.muscle_group && (
                        <span className="text-accent mr-2">{exercise.muscle_group}</span>
                      )}
                      {completedSets}/{totalSets} sets
                      {exercise.rest_seconds && (
                        <span className="ml-2 text-text-tertiary">{exercise.rest_seconds >= 60 ? `${Math.floor(exercise.rest_seconds / 60)}m${exercise.rest_seconds % 60 ? ` ${exercise.rest_seconds % 60}s` : ''}` : `${exercise.rest_seconds}s`} rest</span>
                      )}
                    </p>
                  </div>

                  <ChevronDown className={cn(
                    'w-4 h-4 text-text-tertiary flex-shrink-0 transition-transform duration-200',
                    isExpanded && 'rotate-180'
                  )} />
                </button>

                {/* Inline remove confirm */}
                {removeConfirmIndex === exIndex ? (
                  <div data-remove-confirm="true" className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-[11px] text-text-secondary">Remove?</span>
                    <button
                      type="button"
                      onClick={() => setRemoveConfirmIndex(null)}
                      className="text-[11px] px-2 py-1 rounded-md text-text-secondary hover:bg-surface-hover"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(exIndex)}
                      className="text-[11px] px-2 py-1 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRemoveConfirmIndex(exIndex)}
                    aria-label={`Remove ${exercise.name}`}
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-text-tertiary hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Expanded: sets table + notes */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border/50">
                  {exercise.instructions && exercise.instructions.length > 0 && (
                    <details className="my-3">
                      <summary className="text-xs text-text-secondary cursor-pointer hover:text-accent">
                        How to perform
                      </summary>
                      <ol className="mt-2 space-y-1 pl-4 list-decimal">
                        {exercise.instructions.map((step, i) => (
                          <li key={i} className="text-xs text-text-secondary">{step}</li>
                        ))}
                      </ol>
                    </details>
                  )}

                  {/* Sets table */}
                  <div className="bg-background border border-border rounded-xl overflow-hidden mt-3">
                    <div className="grid grid-cols-[40px_1fr_1fr_1fr_44px] gap-1 px-3 py-2 border-b border-border text-[10px] font-medium text-text-tertiary uppercase tracking-wide">
                      <span>Set</span>
                      <span>Previous</span>
                      <span>Reps</span>
                      <span>kg</span>
                      <span />
                    </div>

                    {exercise.sets.map((set, setIdx) => (
                      <div
                        key={setIdx}
                        className={cn(
                          'grid grid-cols-[40px_1fr_1fr_1fr_44px] gap-1 items-center px-3 py-2.5 border-b border-border/50 last:border-b-0',
                          set.completed && 'bg-success/5'
                        )}
                      >
                        <span className="text-sm font-medium text-text-primary">{set.set_number}</span>
                        <span className="text-xs text-text-tertiary tabular-nums">
                          {set.previous_reps && set.previous_weight_kg
                            ? `${set.previous_reps}×${set.previous_weight_kg}`
                            : '—'}
                        </span>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={set.actual_reps ?? ''}
                          placeholder={String(set.planned_reps)}
                          onChange={(e) => updateSet(exIndex, setIdx, 'actual_reps', e.target.value ? Number(e.target.value) : null)}
                          className="w-full h-8 text-center text-sm bg-surface border border-border rounded-lg focus:border-accent outline-none tabular-nums"
                        />
                        <input
                          type="number"
                          inputMode="decimal"
                          value={set.actual_weight_kg ?? ''}
                          placeholder={set.planned_weight_kg ? String(set.planned_weight_kg) : '—'}
                          onChange={(e) => updateSet(exIndex, setIdx, 'actual_weight_kg', e.target.value ? Number(e.target.value) : null)}
                          className="w-full h-8 text-center text-sm bg-surface border border-border rounded-lg focus:border-accent outline-none tabular-nums"
                        />
                        <button
                          onClick={() => completeSet(exIndex, setIdx)}
                          className={cn(
                            'w-8 h-8 rounded-full border-2 flex items-center justify-center mx-auto transition-colors',
                            set.completed ? 'bg-success border-success' : 'border-border hover:border-accent'
                          )}
                        >
                          {set.completed && <Check className="w-4 h-4 text-white" />}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  <textarea
                    placeholder="Notes (form cues, how it felt...)"
                    aria-label={`Notes for ${exercise.name}`}
                    value={exercise.notes || ''}
                    onChange={(e) => {
                      if (!session) return
                      const updated = [...session.exercises]
                      updated[exIndex] = { ...updated[exIndex], notes: e.target.value }
                      setSession({ ...session, exercises: updated })
                      saveExercises(updated)
                    }}
                    className="w-full mt-3 text-xs text-text-secondary bg-surface border border-border rounded-xl px-3 py-2 resize-none h-16 placeholder:text-text-tertiary outline-none focus:border-accent"
                  />
                </div>
              )}
            </div>
          )
        })}

        {/* Add exercise (mid-workout) */}
        <div className="pt-2">
          {showAddForm ? (
            <div className="bg-surface border border-accent/40 rounded-xl p-4 space-y-3">
              <SearchablePicker<ExerciseSearchResult>
                label="Exercise"
                placeholder="Search exercises…"
                search={searchExercises}
                renderItem={(item) => (
                  <div className="flex flex-col">
                    <span className="text-sm text-text-primary">{item.name}</span>
                    {item.primary_muscles && item.primary_muscles.length > 0 ? (
                      <span className="text-[11px] text-text-tertiary">{item.primary_muscles.join(', ')}</span>
                    ) : null}
                  </div>
                )}
                getItemKey={(item) => item.id}
                onSelect={(item) => setAddPick(item)}
                value={addPick?.name}
                onClear={() => setAddPick(null)}
              />
              <div className="grid grid-cols-3 gap-2">
                <NumberField label="Sets" value={addSets} onChange={setAddSets} min={1} max={20} step={1} />
                <NumberField label="Reps" value={addReps} onChange={setAddReps} min={1} max={100} step={1} />
                <NumberField label="Rest" value={addRest} onChange={setAddRest} min={0} max={600} step={5} suffix="s" />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={resetAddForm}
                  className="flex-1 rounded-lg border border-border py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddExercise}
                  disabled={!addPick}
                  className="flex-1 rounded-lg bg-accent hover:bg-accent-hover py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <AddRowButton label="Add Exercise" onClick={() => setShowAddForm(true)} />
            </div>
          )}
        </div>
      </div>

      {/* Floating Geo button */}
      <button
        onClick={() => useUIStore.getState().openSheet('geo-companion')}
        className="fixed bottom-6 right-4 w-12 h-12 rounded-full bg-accent shadow-lg shadow-accent/30 flex items-center justify-center z-20"
        aria-label="Ask Geo"
      >
        <MessageCircle className="w-5 h-5 text-white" />
      </button>

      {/* Exit confirmation sheet */}
      <AnimatePresence>
        {showExitSheet && (
          <>
            <motion.div
              key="exit-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setShowExitSheet(false)}
            />
            <motion.div
              key="exit-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl px-5 pt-3 pb-6 shadow-2xl"
            >
              <div className="flex justify-center mb-3">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>
              <p className="text-base font-semibold text-text-primary text-center mb-1">End workout?</p>
              <p className="text-xs text-text-secondary text-center mb-5">Pick what you&apos;d like to do with this session.</p>
              <div className="space-y-2">
                <button
                  onClick={handleSaveAndExit}
                  className="w-full rounded-xl bg-accent hover:bg-accent-hover py-3 text-sm font-semibold text-white"
                >
                  Save &amp; Exit
                </button>
                <button
                  onClick={handleDiscard}
                  className="w-full rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive py-3 text-sm font-semibold"
                >
                  Discard Workout
                </button>
                <button
                  onClick={() => setShowExitSheet(false)}
                  className="w-full rounded-xl py-3 text-sm font-medium text-text-secondary hover:bg-surface-hover"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
