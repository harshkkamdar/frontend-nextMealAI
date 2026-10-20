'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { NumberField, SearchablePicker } from '@/components/plans/plan-builder-shared'
import { GeoAvatar } from '@/components/shared/geo-avatar'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { MetricTile } from '@/components/ui/fiqr/metric-tile'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { SecondaryButton } from '@/components/ui/fiqr/secondary-button'
import { RestTimer } from '@/components/workout/rest-timer'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import { unlockAudio } from '@/lib/audio'
import { searchExercises, type ExerciseSearchResult } from '@/lib/api/exercises.api'
import { abandonWorkoutSession, completeWorkoutSession, getWorkoutSession, updateWorkoutSession } from '@/lib/api/workout-sessions.api'
import { writeWorkoutToHealth } from '@/lib/platform/health'
import { cn } from '@/lib/utils'
import { computeCompleteSetResult, firstIncompleteExerciseIndex, isExerciseComplete, nextIncompleteExerciseIndex, resolveElapsedForSession } from '@/lib/workout-session'
import { useUIStore } from '@/stores/ui.store'
import type { SessionExercise, SetData, WorkoutSession } from '@/types/workout-session.types'

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={direction === 'left' ? 'm15 5-7 7 7 7' : 'm9 5 7 7-7 7'} />
    </svg>
  )
}

function TickIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4 10-10" /></svg>
}

export default function WorkoutFollowPage() {
  return <Suspense fallback={null}><WorkoutFollowRoute /></Suspense>
}

function WorkoutFollowRoute() {
  const sessionId = useSearchParams().get('id') ?? ''
  if (!sessionId) return <p className="p-4 text-sm text-ink-62">Nothing selected. <Link href="/train">Back to training.</Link></p>
  return <WorkoutFollowSession sessionId={sessionId} />
}

function WorkoutFollowSession({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const [session, setSession] = useState<WorkoutSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRestTimer, setShowRestTimer] = useState(false)
  const [restSeconds, setRestSeconds] = useState(90)
  const [restKey, setRestKey] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [completing, setCompleting] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [showExitSheet, setShowExitSheet] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [removeConfirm, setRemoveConfirm] = useState(false)
  const [discardConfirm, setDiscardConfirm] = useState(false)
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
  const pagerRef = useRef<HTMLDivElement>(null)

  const exercises = session?.exercises ?? []
  const current = exercises[currentIndex] ?? null

  useSetGeoScreen('workout_follow', { sessionId, currentExercise: current?.name ?? null, exerciseIndex: currentIndex })

  const loadSession = useCallback((showToast = false) => {
    return getWorkoutSession(sessionId)
      .then((nextSession) => {
        setSession(nextSession)
        if (showToast) toast.success('Workout updated!')
      })
      .catch(() => { toast.error('Failed to load workout'); router.back() })
  }, [sessionId, router])

  useEffect(() => {
    loadSession().finally(() => setLoading(false))
  }, [loadSession])

  useEffect(() => {
    const handler = () => loadSession(true)
    window.addEventListener('workout:session-updated', handler)
    return () => window.removeEventListener('workout:session-updated', handler)
  }, [loadSession])

  useEffect(() => {
    if (session && !initedRef.current && session.exercises.length > 0) {
      setCurrentIndex(firstIncompleteExerciseIndex(session.exercises))
      initedRef.current = true
    }
  }, [session])

  useEffect(() => {
    const count = session?.exercises.length ?? 0
    if (count > 0 && currentIndex > count - 1) setCurrentIndex(count - 1)
  }, [session, currentIndex])

  useEffect(() => {
    setRemoveConfirm(false)
  }, [currentIndex])

  useEffect(() => () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
  }, [])

  useEffect(() => {
    if (!session || session.status !== 'in_progress') return
    const interval = setInterval(() => setElapsedSeconds((seconds) => seconds + 1), 1000)
    return () => clearInterval(interval)
  }, [session])

  useEffect(() => {
    if (!session?.started_at) return
    const { elapsedSeconds: resolved, needsReset } = resolveElapsedForSession(session.started_at, Date.now())
    if (needsReset) {
      setElapsedSeconds(0)
      const nowIso = new Date().toISOString()
      updateWorkoutSession(sessionId, { started_at: nowIso }).catch(() => {})
      setSession((previous) => previous ? { ...previous, started_at: nowIso } : previous)
      return
    }
    setElapsedSeconds(resolved)
  }, [session?.started_at, sessionId])

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

  useEffect(() => {
    const card = pagerRef.current?.querySelector<HTMLElement>(`[data-exercise-index="${currentIndex}"]`)
    card?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [currentIndex, exercises.length])

  useEffect(() => {
    const pager = pagerRef.current
    if (!pager) return
    const onScrollEnd = () => {
      const center = pager.getBoundingClientRect().left + pager.clientWidth / 2
      const cards = Array.from(pager.querySelectorAll<HTMLElement>('[data-exercise-index]'))
      let nearest = currentIndex
      let distance = Number.POSITIVE_INFINITY
      for (const card of cards) {
        const rect = card.getBoundingClientRect()
        const nextDistance = Math.abs(rect.left + rect.width / 2 - center)
        if (nextDistance < distance) {
          distance = nextDistance
          nearest = Number(card.dataset.exerciseIndex)
        }
      }
      if (Number.isFinite(nearest)) setCurrentIndex(nearest)
    }
    pager.addEventListener('scrollend', onScrollEnd)
    return () => pager.removeEventListener('scrollend', onScrollEnd)
  }, [currentIndex, exercises.length])

  const saveExercises = useCallback((nextExercises: SessionExercise[]) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      updateWorkoutSession(sessionId, { exercises: nextExercises }).catch(() => {})
    }, 500)
  }, [sessionId])

  const updateSet = (exerciseIndex: number, setIndex: number, field: string, value: any) => {
    if (!session) return
    const updated = [...session.exercises]
    const sets = [...updated[exerciseIndex].sets]
    sets[setIndex] = { ...sets[setIndex], [field]: value }
    updated[exerciseIndex] = { ...updated[exerciseIndex], sets }
    setSession({ ...session, exercises: updated })
    saveExercises(updated)
  }

  const completeSet = (exerciseIndex: number, setIndex: number) => {
    if (!session) return
    unlockAudio()
    const result = computeCompleteSetResult(session.exercises, exerciseIndex, setIndex, new Date().toISOString())
    setSession({ ...session, exercises: result.exercises })
    saveExercises(result.exercises)

    if (result.rest.show) {
      setRestSeconds(result.rest.seconds)
      setShowRestTimer(true)
    }
    if (result.rest.bumpKey) setRestKey((key) => key + 1)

    if (exerciseIndex === currentIndex && isExerciseComplete(result.exercises[exerciseIndex])) {
      setCelebrate(true)
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = setTimeout(() => {
        setCelebrate(false)
        const next = nextIncompleteExerciseIndex(result.exercises, exerciseIndex)
        if (next >= 0) setCurrentIndex(next)
      }, 1100)
    }
  }

  const addSet = (exerciseIndex: number) => {
    if (!session) return
    const updated = [...session.exercises]
    const exercise = updated[exerciseIndex]
    const lastSet = exercise.sets[exercise.sets.length - 1]
    const nextSet: SetData = {
      set_number: exercise.sets.length + 1,
      planned_reps: lastSet?.planned_reps ?? exercise.planned_reps,
      planned_weight_kg: lastSet?.planned_weight_kg ?? null,
      actual_reps: null,
      actual_weight_kg: null,
      completed: false,
      completed_at: null,
    }
    updated[exerciseIndex] = { ...exercise, planned_sets: exercise.planned_sets + 1, sets: [...exercise.sets, nextSet] }
    setSession({ ...session, exercises: updated })
    saveExercises(updated)
  }

  const handleComplete = async () => {
    if (completing) return
    setCompleting(true)
    try {
      const completed = await completeWorkoutSession(sessionId)
      void writeWorkoutToHealth(completed)
      setSession(completed)
      setShowSummary(true)
      setShowMenu(false)
    } catch {
      toast.error('Failed to complete workout')
    } finally {
      setCompleting(false)
    }
  }

  const handleBack = () => {
    if (showSummary || session?.status === 'completed') { router.push('/train'); return }
    setShowExitSheet(true)
  }

  const handleSaveAndExit = () => router.push('/train')

  const handleDiscard = async () => {
    try {
      await abandonWorkoutSession(sessionId)
      toast.success('Workout discarded')
      router.push('/train')
    } catch {
      toast.error('Failed to discard workout')
    }
  }

  const handleRemoveExercise = (exerciseIndex: number) => {
    if (!session) return
    const next = session.exercises.filter((_, index) => index !== exerciseIndex)
    setSession({ ...session, exercises: next })
    setRemoveConfirm(false)
    setShowMenu(false)
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
      sets: Array.from({ length: sets }, (_, index) => ({
        set_number: index + 1,
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

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`

  if (loading) return <div className="flex h-dvh items-center justify-center bg-cream"><div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-16 border-t-ink" /></div>
  if (!session) return null

  if (showSummary) {
    const completedExercises = exercises.filter((exercise) => exercise.status === 'completed').length
    return (
      <div className="flex h-dvh flex-col bg-cream px-gutter">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <GeoAvatar variant="face" state="coach" size={64} />
          <h1 className="mt-5 text-[28px] font-bold tracking-[-0.6px] text-ink">Session done</h1>
          <div className="mt-6 grid w-full grid-cols-3 gap-[10px]">
            <MetricTile label="Time" value={session.duration_minutes ?? 0} unit="min" />
            <MetricTile label="Exercises" value={completedExercises} />
            <MetricTile label="Volume" value={(session.total_volume_kg ?? 0).toLocaleString()} unit="kg" />
          </div>
          <PrimaryButton type="button" onClick={() => router.push('/train')} className="mt-6 justify-center">Done</PrimaryButton>
        </div>
      </div>
    )
  }

  const totalSets = exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)
  const completedSets = exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.completed).length, 0)
  const allComplete = exercises.length > 0 && exercises.every(isExerciseComplete)
  const currentComplete = current ? isExerciseComplete(current) : false

  return (
    <div className="flex h-dvh flex-col bg-cream text-ink">
      <RestTimer isActive={showRestTimer} duration={restSeconds} resetToken={restKey} onSkip={() => setShowRestTimer(false)} onComplete={() => setShowRestTimer(false)} />

      <header className="sticky top-0 z-20 bg-cream px-gutter pb-3" style={{ paddingTop: 'calc(10px + var(--safe-top))' }}>
        <div className="grid grid-cols-[40px_1fr_40px] items-center">
          <button type="button" onClick={handleBack} aria-label="Go back" className="flex h-10 w-10 items-center justify-center text-ink"><Chevron direction="left" /></button>
          <p className="truncate text-center text-[15.5px] font-semibold tabular-nums text-ink">{session.day_name} · {formatTime(elapsedSeconds)}</p>
          <button type="button" onClick={() => setShowMenu(true)} aria-label="Workout options" className="flex h-10 w-10 items-center justify-center text-[24px] leading-none text-ink-60">…</button>
        </div>
        <div className="mt-2 h-[7px] overflow-hidden rounded-[4px] bg-ink-10">
          <div className="h-full bg-ink transition-[width] duration-300" style={{ width: `${totalSets ? (completedSets / totalSets) * 100 : 0}%` }} />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-28 pt-3">
        {exercises.length === 0 ? (
          <div className="px-gutter py-14 text-center">
            <p className="text-[15.5px] text-ink-62">No exercises in this session.</p>
            <SecondaryButton type="button" onClick={() => setShowAddForm(true)} className="mt-4">Add an exercise</SecondaryButton>
          </div>
        ) : (
          <div ref={pagerRef} className="scrollbar-hide -mx-gutter flex snap-x snap-mandatory gap-3 overflow-x-auto px-gutter">
            {exercises.map((exercise, exerciseIndex) => (
              <article key={`${exercise.name}-${exerciseIndex}`} data-exercise-index={exerciseIndex} className="w-[calc(100vw-44px)] max-w-[346px] shrink-0 snap-center rounded-[22px] border border-ink-12 bg-card p-[22px]">
                <h1 className="text-[28px] font-bold leading-[1.1] tracking-[-0.6px] text-ink">{exercise.name}</h1>
                <p className="mt-2 text-[14px] text-ink-62">{exercise.planned_sets} × {exercise.planned_reps}{exercise.rest_seconds ? ` · ${exercise.rest_seconds} s rest` : ''}</p>

                {exercise.instructions && exercise.instructions.length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-[13.5px] font-semibold text-ink-60">How to perform</summary>
                    <ol className="mt-2 list-decimal space-y-1 pl-5">{exercise.instructions.map((step, index) => <li key={index} className="text-[13px] text-ink-62">{step}</li>)}</ol>
                  </details>
                )}

                <div className="mt-5 grid grid-cols-[36px_1fr_1fr_1fr_40px] items-center gap-1 text-[11px] font-semibold uppercase tracking-[1.4px] text-ink-62">
                  <span>Set</span><span>Prev</span><span className="text-center">kg</span><span className="text-center">Reps</span><span className="text-center">✓</span>
                </div>
                <div className="mt-1">
                  {exercise.sets.map((set, setIndex) => (
                    <div key={setIndex} className="grid h-12 grid-cols-[36px_1fr_1fr_1fr_40px] items-center gap-1 border-t border-ink-09 first:border-t-0">
                      <span className="text-[15.5px] font-semibold text-ink">{set.set_number}</span>
                      <span className="text-[13.5px] tabular-nums text-ink-50">{set.previous_reps != null && set.previous_weight_kg != null ? `${set.previous_reps}×${set.previous_weight_kg}` : '—'}</span>
                      <input
                        type="number" inputMode="decimal" aria-label={`${exercise.name} set ${set.set_number} kilograms`}
                        value={set.actual_weight_kg ?? ''} placeholder={set.planned_weight_kg != null ? String(set.planned_weight_kg) : '—'}
                        onChange={(event) => updateSet(exerciseIndex, setIndex, 'actual_weight_kg', event.target.value ? Number(event.target.value) : null)}
                        className="h-11 w-full rounded-[12px] border-0 bg-ink-08 text-center text-[17px] font-semibold tabular-nums text-ink outline-none focus:ring-1 focus:ring-ink"
                      />
                      <input
                        type="number" inputMode="numeric" aria-label={`${exercise.name} set ${set.set_number} reps`}
                        value={set.actual_reps ?? ''} placeholder={String(set.planned_reps)}
                        onChange={(event) => updateSet(exerciseIndex, setIndex, 'actual_reps', event.target.value ? Number(event.target.value) : null)}
                        className="h-11 w-full rounded-[12px] border-0 bg-ink-08 text-center text-[17px] font-semibold tabular-nums text-ink outline-none focus:ring-1 focus:ring-ink"
                      />
                      <button
                        type="button" onClick={() => completeSet(exerciseIndex, setIndex)} aria-label={`Complete set ${set.set_number}`}
                        className={cn('mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-ink-16 transition-transform duration-200', set.completed && 'bg-ink text-cream', celebrate && exerciseIndex === currentIndex && set.completed && 'scale-110')}
                      >
                        {set.completed ? <TickIcon /> : null}
                      </button>
                    </div>
                  ))}
                </div>

                <button type="button" onClick={() => addSet(exerciseIndex)} className="mt-3 text-[13.5px] font-semibold text-ink-60">+ Add set</button>

                <textarea
                  placeholder="Notes (form cues, how it felt...)" aria-label={`Notes for ${exercise.name}`} value={exercise.notes || ''}
                  onChange={(event) => {
                    if (!session) return
                    const updated = [...session.exercises]
                    updated[exerciseIndex] = { ...updated[exerciseIndex], notes: event.target.value }
                    setSession({ ...session, exercises: updated })
                    saveExercises(updated)
                  }}
                  className="mt-4 h-16 w-full resize-none rounded-[12px] border border-ink-12 bg-ink-08 px-3 py-2 text-[13px] text-ink-62 outline-none placeholder:text-ink-50 focus:ring-1 focus:ring-ink"
                />
              </article>
            ))}
          </div>
        )}

        {showAddForm && (
          <div className="mx-[var(--gutter)] mt-4 space-y-3 rounded-[18px] border border-ink-12 bg-card p-4">
            <SearchablePicker<ExerciseSearchResult>
              label="Exercise" placeholder="Search exercises…" search={searchExercises}
              renderItem={(item) => <div className="flex flex-col"><span className="text-sm text-ink">{item.name}</span>{item.primary_muscles?.length ? <span className="text-[11px] text-ink-50">{item.primary_muscles.join(', ')}</span> : null}</div>}
              getItemKey={(item) => item.id} onSelect={(item) => setAddPick(item)} value={addPick?.name} onClear={() => setAddPick(null)}
            />
            <div className="grid grid-cols-3 gap-2">
              <NumberField label="Sets" value={addSets} onChange={setAddSets} min={1} max={20} step={1} />
              <NumberField label="Reps" value={addReps} onChange={setAddReps} min={1} max={100} step={1} />
              <NumberField label="Rest" value={addRest} onChange={setAddRest} min={0} max={600} step={5} suffix="s" />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={resetAddForm} className="h-11 flex-1 rounded-[12px] border border-ink-16 text-[14px] font-semibold text-ink-60">Cancel</button>
              <button type="button" onClick={handleAddExercise} disabled={!addPick} className="h-11 flex-1 rounded-[12px] bg-ink text-[14px] font-semibold text-cream disabled:bg-ink-08 disabled:text-ink-35">Add</button>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-ink-10 bg-cream px-gutter pt-3" style={{ paddingBottom: 'calc(12px + var(--safe-bottom))' }}>
        {allComplete ? (
          <PrimaryButton type="button" onClick={() => void handleComplete()} disabled={completing} className="justify-center">{completing ? 'Finishing…' : 'Finish workout'}</PrimaryButton>
        ) : (
          <div className="flex gap-[10px]">
            <SecondaryButton type="button" onNavy={false} onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))} disabled={currentIndex <= 0} className="flex-1 text-[16px]"><Chevron direction="left" /> Prev</SecondaryButton>
            <SecondaryButton
              type="button" onNavy={false}
              onClick={() => {
                if (currentComplete) {
                  const next = nextIncompleteExerciseIndex(exercises, currentIndex)
                  if (next >= 0) setCurrentIndex(next)
                } else setCurrentIndex((index) => Math.min(exercises.length - 1, index + 1))
              }}
              disabled={!currentComplete && currentIndex >= exercises.length - 1}
              className="flex-1 text-[16px]"
            >
              {currentComplete ? 'Next exercise' : 'Next'} <Chevron direction="right" />
            </SecondaryButton>
          </div>
        )}
      </nav>

      <BottomSheet open={showMenu} onClose={() => { setShowMenu(false); setRemoveConfirm(false); setDiscardConfirm(false) }} ariaLabel="Workout options">
        <div className="px-gutter pb-6 pt-2">
          <button type="button" onClick={() => { setShowMenu(false); setShowAddForm(true) }} className="w-full border-b border-ink-09 py-4 text-left text-[15.5px] font-semibold text-ink">Add exercise</button>
          <button type="button" onClick={() => void handleComplete()} disabled={completing} className="w-full border-b border-ink-09 py-4 text-left text-[15.5px] font-semibold text-ink">Finish workout</button>
          {current && (
            removeConfirm ? (
              <div className="flex items-center gap-3 border-b border-ink-09 py-3"><button type="button" onClick={() => setRemoveConfirm(false)} className="flex-1 py-1 text-left text-[15.5px] text-ink-60">Cancel removal</button><button type="button" onClick={() => handleRemoveExercise(currentIndex)} className="py-1 text-[15.5px] font-semibold text-ink">Confirm remove</button></div>
            ) : <button type="button" onClick={() => setRemoveConfirm(true)} className="w-full border-b border-ink-09 py-4 text-left text-[15.5px] font-semibold text-ink">Remove {current.name}</button>
          )}
          {discardConfirm ? (
            <div className="flex items-center gap-3 border-b border-ink-09 py-3"><button type="button" onClick={() => setDiscardConfirm(false)} className="flex-1 py-1 text-left text-[15.5px] text-ink-60">Cancel discard</button><button type="button" onClick={() => void handleDiscard()} className="py-1 text-[15.5px] font-semibold text-ink">Confirm discard</button></div>
          ) : <button type="button" onClick={() => setDiscardConfirm(true)} className="w-full border-b border-ink-09 py-4 text-left text-[15.5px] font-semibold text-ink">Discard workout</button>}
          <button type="button" onClick={() => { setShowMenu(false); useUIStore.getState().openSheet('geo-companion') }} className="w-full py-4 text-left text-[15.5px] font-semibold text-ink">Ask Geo</button>
        </div>
      </BottomSheet>

      <BottomSheet open={showExitSheet} onClose={() => { setShowExitSheet(false); setDiscardConfirm(false) }} ariaLabel="Exit workout">
        <div className="px-gutter pb-6 pt-2">
          <h2 className="text-center text-[18px] font-semibold text-ink">End workout?</h2>
          <p className="mt-1 text-center text-[13.5px] text-ink-62">Pick what you&apos;d like to do with this session.</p>
          <SecondaryButton type="button" onNavy={false} onClick={handleSaveAndExit} className="mt-5">Save &amp; exit</SecondaryButton>
          {discardConfirm ? (
            <div className="mt-2 flex items-center justify-center gap-4 py-3"><button type="button" onClick={() => setDiscardConfirm(false)} className="text-[14px] font-semibold text-ink-60">Keep workout</button><button type="button" onClick={() => void handleDiscard()} className="text-[14px] font-semibold text-ink">Confirm discard</button></div>
          ) : <button type="button" onClick={() => setDiscardConfirm(true)} className="mt-2 w-full py-3 text-[14px] font-semibold text-ink-60">Discard workout</button>}
          <button type="button" onClick={() => setShowExitSheet(false)} className="w-full py-3 text-[14px] font-semibold text-ink-60">Cancel</button>
        </div>
      </BottomSheet>
    </div>
  )
}
