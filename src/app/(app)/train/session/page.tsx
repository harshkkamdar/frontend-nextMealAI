'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { NumberField, SearchablePicker } from '@/components/plans/plan-builder-shared'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { PushedHeader } from '@/components/layout/screen-header'
import { GeoAvatar } from '@/components/shared/geo-avatar'
import { OfflineBand } from '@/components/shared/offline-band'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { CountUp } from '@/components/ui/fiqr/count-up'
import { ErrorState } from '@/components/ui/fiqr/error-state'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { RoundButton } from '@/components/ui/fiqr/round-button'
import { SecondaryButton } from '@/components/ui/fiqr/secondary-button'
import { ExerciseVisual } from '@/components/workout/muscle-map'
import { RestTimer } from '@/components/workout/rest-timer'
import { SessionSkeleton, SessionTimerCard } from '@/components/workout/session-cards'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import { unlockAudio } from '@/lib/audio'
import { searchExercises, type ExerciseSearchResult } from '@/lib/api/exercises.api'
import { abandonWorkoutSession, completeWorkoutSession, getWorkoutSession, updateWorkoutSession } from '@/lib/api/workout-sessions.api'
import { haptic } from '@/lib/platform/app'
import { writeWorkoutToHealth } from '@/lib/platform/health'
import { reducedFade, spring } from '@/lib/motion'
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
  if (!sessionId) return <p className="p-4 text-sm text-ink-65">Nothing selected. <Link href="/train">Back to training.</Link></p>
  return <WorkoutFollowSession sessionId={sessionId} />
}

function WorkoutFollowSession({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const [session, setSession] = useState<WorkoutSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
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
  const programmaticScrollRef = useRef(false)
  const reduce = useReducedMotion()

  const exercises = session?.exercises ?? []
  const current = exercises[currentIndex] ?? null

  useSetGeoScreen('workout_follow', { sessionId, currentExercise: current?.name ?? null, exerciseIndex: currentIndex })

  const loadSession = useCallback((showToast = false) => {
    return getWorkoutSession(sessionId)
      .then((nextSession) => {
        setSession(nextSession)
        setLoadFailed(false)
        if (showToast) toast.success('Workout updated!')
      })
      // Stay on the page: going back from a deep link or cold start lands on a blank page.
      .catch(() => setLoadFailed(true))
  }, [sessionId])

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
    const pager = pagerRef.current
    const card = pager?.querySelector<HTMLElement>(`[data-exercise-index="${currentIndex}"]`)
    // Horizontal only: the page itself scrolls now, so scrollIntoView would also move it vertically.
    if (!pager || !card) return
    const left = card.offsetLeft - pager.offsetLeft - (pager.clientWidth - card.clientWidth) / 2
    if (Math.abs(pager.scrollLeft - left) < 2) return
    // A scroll we started must not be read back as a swipe: an interrupted one ends on the old card.
    programmaticScrollRef.current = true
    pager.scrollTo?.({ left, behavior: 'smooth' })
  }, [currentIndex, exercises.length])

  useEffect(() => {
    const pager = pagerRef.current
    if (!pager) return
    const onScrollEnd = () => {
      if (programmaticScrollRef.current) { programmaticScrollRef.current = false; return }
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
    // Q28: success on a new tick, nothing on an untick.
    if (!session.exercises[exerciseIndex]?.sets[setIndex]?.completed) void haptic('success')
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

  const optionsButton = (
    <RoundButton aria-label="Workout options" onClick={() => setShowMenu(true)}>
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>
    </RoundButton>
  )

  if (loading) {
    return (
      <div className="mx-auto min-h-dvh w-full max-w-md bg-cream px-4">
        <PushedHeader title="" onBack={() => router.push('/train')} backLabel="Back to training" />
        {/* motion-feel 3h: skeletons only after 150 ms without data, so a quick load goes straight to content. */}
        <motion.div className="pt-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.12, delay: 0.15 }}><SessionSkeleton /></motion.div>
      </div>
    )
  }
  if (!session) {
    return (
      <div className="mx-auto min-h-dvh w-full max-w-md bg-cream px-4">
        <PushedHeader title="Workout" onBack={() => router.push('/train')} backLabel="Back to training" />
        <div className="-mx-4"><OfflineBand /></div>
        {loadFailed ? (
          <div className="mt-4">
            <ErrorState onRetry={() => { setLoading(true); void loadSession().finally(() => setLoading(false)) }}>
              I couldn&apos;t load this workout. Check your connection and try again.
            </ErrorState>
          </div>
        ) : null}
      </div>
    )
  }

  // The summary fades in over the live screen, so finishing never cuts to an empty frame.
  let summary: ReactNode = null
  if (showSummary) {
    const completedExercises = exercises.filter((exercise) => exercise.status === 'completed').length
    const enter = (index: number) => ({
      initial: reduce ? { opacity: 0 } : { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0 },
      transition: reduce ? reducedFade : { ...spring.glide, delay: 0.12 + index * 0.04 },
    })
    summary = (
      <motion.div key="summary" role="dialog" aria-label="Session done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="fixed inset-0 z-[80] mx-auto flex w-full max-w-md flex-col overflow-y-auto bg-cream px-4" style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'calc(16px + var(--safe-bottom))' }}>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <motion.div initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={reduce ? reducedFade : spring.lens}>
            <GeoAvatar variant="face" state="coach" size={64} />
          </motion.div>
          <motion.h1 {...enter(0)} className="font-wide mt-5 text-[30px] font-bold leading-[1.1] tracking-[-0.5px] text-ink">Session done</motion.h1>
          <motion.p {...enter(1)} className="mt-1 max-w-full break-words text-[15px] text-ink-65">{session.day_name}</motion.p>
          <div className="mt-6 grid w-full grid-cols-3 gap-[10px]">
            {[
              { label: 'Time', value: session.duration_minutes ?? 0, unit: 'min' },
              { label: 'Exercises', value: completedExercises, unit: '' },
              { label: 'Volume', value: session.total_volume_kg ?? 0, unit: 'kg' },
            ].map((tile, index) => (
              <motion.div key={tile.label} {...enter(index + 2)} className="flex flex-col items-start rounded-[22px] bg-card p-4 text-left shadow-[var(--shadow-card)]">
                <span className="text-[13px] font-semibold text-ink-65">{tile.label}</span>
                <span className="mt-2 flex items-baseline gap-1">
                  <span className="font-wide text-[24px] font-bold leading-none text-ink tabular-nums"><CountUp value={tile.value} delay={0.3} /></span>
                  {tile.unit ? <span className="text-[13px] font-semibold text-ink-65">{tile.unit}</span> : null}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
        <PrimaryButton type="button" onClick={() => router.push('/train')}>Done</PrimaryButton>
      </motion.div>
    )
  }

  const allComplete = exercises.length > 0 && exercises.every(isExerciseComplete)
  const currentComplete = current ? isExerciseComplete(current) : false

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md bg-cream text-ink">
      <AnimatePresence>{summary}</AnimatePresence>
      <RestTimer isActive={showRestTimer && !showSummary} duration={restSeconds} resetToken={restKey} onSkip={() => setShowRestTimer(false)} onComplete={() => setShowRestTimer(false)} />

      <div className="px-4"><PushedHeader title={session.day_name} onBack={handleBack} backLabel="Go back" actions={optionsButton} /></div>
      <OfflineBand />

      {/* Content fades in on its own; an opacity ancestor would also hide the nav's backdrop filter. */}
      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18, ease: 'easeOut' }} className="pt-3" style={{ paddingBottom: `calc(${showRestTimer ? 300 : 120}px + var(--safe-bottom))` }}>
        {exercises.length === 0 ? (
          <div className="px-4">
            <button type="button" onClick={() => setShowAddForm(true)} className="flex min-h-16 w-full items-center justify-center rounded-[24px] border-[1.5px] border-dashed border-ink-20 text-[15px] font-semibold text-ink-65 transition-transform active:scale-[.98]">
              No exercises yet. Add one
            </button>
          </div>
        ) : (
          <>
            <div className="px-4"><SessionTimerCard elapsedSeconds={elapsedSeconds} exercises={exercises} currentIndex={currentIndex} /></div>
            <div ref={pagerRef} className="scrollbar-hide -mb-2 mt-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 pt-2">
              {exercises.map((exercise, exerciseIndex) => (
                <article key={`${exercise.name}-${exerciseIndex}`} data-exercise-index={exerciseIndex} aria-current={exerciseIndex === currentIndex ? 'step' : undefined} className="w-[calc(100vw-44px)] max-w-[388px] shrink-0 snap-center rounded-[24px] bg-card p-5 shadow-[var(--shadow-card)]">
                  <ExerciseVisual group={exercise.muscle_group} name={exercise.name} />
                  <h2 className="font-wide mt-4 line-clamp-3 break-words text-[26px] font-bold leading-[1.12] tracking-[-0.4px] text-ink">{exercise.name}</h2>
                  <p className="mt-1.5 text-[14px] text-ink-65 tabular-nums">{exercise.planned_sets} × {exercise.planned_reps}{exercise.rest_seconds ? ` · ${exercise.rest_seconds} s rest` : ''}</p>

                  {exercise.instructions && exercise.instructions.length > 0 && (
                    <details className="mt-2">
                      <summary className="flex min-h-11 cursor-pointer items-center text-[14px] font-semibold text-ink-65">How to do it</summary>
                      <ol className="mt-1 list-decimal space-y-1 pl-5">{exercise.instructions.map((step, index) => <li key={index} className="text-[14px] text-ink-65">{step}</li>)}</ol>
                    </details>
                  )}

                  <div className="mt-4 grid grid-cols-[32px_1fr_1fr_1fr_44px] items-center gap-1.5 text-[12px] font-semibold text-ink-65">
                    <span>Set</span><span>Last</span><span className="text-center">kg</span><span className="text-center">Reps</span><span className="text-center">Done</span>
                  </div>
                  <div className="mt-1">
                    {exercise.sets.map((set, setIndex) => (
                      <div key={setIndex} className="grid h-14 grid-cols-[32px_1fr_1fr_1fr_44px] items-center gap-1.5 border-t border-ink-06 first:border-t-0">
                        <span className="text-[15.5px] font-semibold text-ink tabular-nums">{set.set_number}</span>
                        <span className="text-[13.5px] tabular-nums text-ink-65">{set.previous_reps != null && set.previous_weight_kg != null ? `${set.previous_reps}×${set.previous_weight_kg}` : '—'}</span>
                        <input
                          type="number" inputMode="decimal" aria-label={`${exercise.name} set ${set.set_number} kilograms`}
                          value={set.actual_weight_kg ?? ''} placeholder={set.planned_weight_kg != null ? String(set.planned_weight_kg) : '—'}
                          onChange={(event) => updateSet(exerciseIndex, setIndex, 'actual_weight_kg', event.target.value ? Number(event.target.value) : null)}
                          className={cn('h-11 w-full rounded-[14px] border-0 text-center text-[17px] font-semibold tabular-nums text-ink outline-none placeholder:text-ink focus:ring-[1.5px] focus:ring-ink transition-colors duration-200', set.completed ? 'bg-transparent' : 'bg-ink-04')}
                        />
                        <input
                          type="number" inputMode="numeric" aria-label={`${exercise.name} set ${set.set_number} reps`}
                          value={set.actual_reps ?? ''} placeholder={String(set.planned_reps)}
                          onChange={(event) => updateSet(exerciseIndex, setIndex, 'actual_reps', event.target.value ? Number(event.target.value) : null)}
                          className={cn('h-11 w-full rounded-[14px] border-0 text-center text-[17px] font-semibold tabular-nums text-ink outline-none placeholder:text-ink focus:ring-[1.5px] focus:ring-ink transition-colors duration-200', set.completed ? 'bg-transparent' : 'bg-ink-04')}
                        />
                        <button
                          type="button" onClick={() => completeSet(exerciseIndex, setIndex)} aria-label={`Complete set ${set.set_number}`}
                          aria-pressed={set.completed}
                          className="mx-auto grid size-11 place-items-center transition-transform active:scale-[.9]"
                        >
                          <span className="relative grid size-10 place-items-center rounded-full border-[1.5px] border-ink-20">
                            {set.completed ? (
                              // The ink disc grows in and the tick pops after it (transform and opacity only).
                              <motion.span
                                key={set.completed_at ?? 'done'}
                                className="absolute -inset-[1.5px] grid place-items-center rounded-full bg-ink text-cream"
                                initial={reduce ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
                                animate={{ scale: celebrate && exerciseIndex === currentIndex ? 1.08 : 1, opacity: 1 }}
                                transition={reduce ? reducedFade : spring.tap}
                              >
                                <TickIcon />
                              </motion.span>
                            ) : null}
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>

                  <button type="button" onClick={() => addSet(exerciseIndex)} className="mt-1 min-h-11 text-[14px] font-semibold text-ink-65">+ Add set</button>

                  <textarea
                    placeholder="Notes: form cues, how it felt" aria-label={`Notes for ${exercise.name}`} value={exercise.notes || ''}
                    onChange={(event) => {
                      if (!session) return
                      const updated = [...session.exercises]
                      updated[exerciseIndex] = { ...updated[exerciseIndex], notes: event.target.value }
                      setSession({ ...session, exercises: updated })
                      saveExercises(updated)
                    }}
                    className="mt-3 h-16 w-full resize-none rounded-[14px] border-0 bg-ink-04 px-3 py-2.5 text-[14px] text-ink outline-none placeholder:text-ink-65 focus:ring-[1.5px] focus:ring-ink"
                  />
                </article>
              ))}
            </div>
          </>
        )}

        {showAddForm && (
          <div className="mx-4 mt-4 space-y-3 rounded-[24px] bg-card p-5 shadow-[var(--shadow-card)]">
            <SearchablePicker<ExerciseSearchResult>
              label="Exercise" placeholder="Search exercises…" search={searchExercises}
              renderItem={(item) => <div className="flex flex-col"><span className="text-sm text-ink">{item.name}</span>{item.primary_muscles?.length ? <span className="text-[12px] text-ink-65">{item.primary_muscles.join(', ')}</span> : null}</div>}
              getItemKey={(item) => item.id} onSelect={(item) => setAddPick(item)} value={addPick?.name} onClear={() => setAddPick(null)}
            />
            <div className="grid grid-cols-3 gap-2">
              <NumberField label="Sets" value={addSets} onChange={setAddSets} min={1} max={20} step={1} />
              <NumberField label="Reps" value={addReps} onChange={setAddReps} min={1} max={100} step={1} />
              <NumberField label="Rest" value={addRest} onChange={setAddRest} min={0} max={600} step={5} suffix="s" />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={resetAddForm} className="h-12 flex-1 rounded-[14px] bg-ink-06 text-[15px] font-semibold text-ink">Cancel</button>
              <button type="button" onClick={handleAddExercise} disabled={!addPick} className="h-12 flex-1 rounded-[14px] bg-ink text-[15px] font-semibold text-cream disabled:bg-ink-08 disabled:text-ink-35">Add</button>
            </div>
          </div>
        )}
      </motion.main>

      {/* Rises in on transform only: a backdrop-filter bar under fading opacity does not paint until it is opaque. */}
      {exercises.length > 0 ? (
      <motion.nav initial={reduce ? false : { y: 96 }} animate={{ y: 0 }} transition={spring.sheet} className="glass-cream fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md rounded-t-[28px] px-4 pt-3" style={{ paddingBottom: 'calc(12px + var(--safe-bottom))' }}>
        {allComplete || currentIndex === exercises.length - 1 ? (
          <PrimaryButton type="button" onClick={() => void handleComplete()} disabled={completing}>{completing ? 'Finishing…' : 'Finish workout'}</PrimaryButton>
        ) : (
          <div className="flex gap-[10px]">
            <button type="button" onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))} disabled={currentIndex <= 0} className="flex h-14 flex-1 items-center justify-center gap-1 rounded-[18px] bg-ink-06 text-[16px] font-semibold text-ink transition-transform enabled:active:scale-[.97] disabled:text-ink-35"><Chevron direction="left" /> Previous</button>
            <button
              type="button"
              onClick={() => {
                if (currentComplete) {
                  const next = nextIncompleteExerciseIndex(exercises, currentIndex)
                  if (next >= 0) setCurrentIndex(next)
                } else setCurrentIndex((index) => Math.min(exercises.length - 1, index + 1))
              }}
              disabled={!currentComplete && currentIndex >= exercises.length - 1}
              className="flex h-14 flex-[1.4] items-center justify-center gap-1 rounded-[18px] bg-ink text-[16px] font-semibold text-cream transition-transform enabled:active:scale-[.97] disabled:bg-ink-08 disabled:text-ink-35"
            >
              {currentComplete ? 'Next exercise' : 'Next'} <Chevron direction="right" />
            </button>
          </div>
        )}
      </motion.nav>
      ) : null}

      <BottomSheet open={showMenu} onClose={() => { setShowMenu(false); setRemoveConfirm(false); setDiscardConfirm(false) }} ariaLabel="Workout options">
        <div className="px-4 pb-5 pt-2">
          <div className="overflow-hidden rounded-[22px] bg-card shadow-[var(--shadow-card)]">
            <button type="button" onClick={() => { setShowMenu(false); setShowAddForm(true) }} className="flex min-h-14 w-full items-center border-b border-ink-06 px-5 text-left text-[16px] font-semibold text-ink last:border-b-0 active:bg-ink-04">Add exercise</button>
            <button type="button" onClick={() => void handleComplete()} disabled={completing} className="flex min-h-14 w-full items-center border-b border-ink-06 px-5 text-left text-[16px] font-semibold text-ink last:border-b-0 active:bg-ink-04">Finish workout</button>
            {current && (
              removeConfirm ? (
                <div className="flex min-h-14 items-center gap-3 border-b border-ink-06 px-5"><button type="button" onClick={() => setRemoveConfirm(false)} className="min-h-11 flex-1 text-left text-[16px] text-ink-65">Keep it</button><button type="button" onClick={() => handleRemoveExercise(currentIndex)} className="min-h-11 text-[16px] font-semibold text-ink">Remove</button></div>
              ) : <button type="button" onClick={() => setRemoveConfirm(true)} className="flex min-h-14 w-full items-center border-b border-ink-06 px-5 text-left text-[16px] font-semibold text-ink last:border-b-0 active:bg-ink-04"><span className="truncate">Remove {current.name}</span></button>
            )}
            {discardConfirm ? (
              <div className="flex min-h-14 items-center gap-3 border-b border-ink-06 px-5"><button type="button" onClick={() => setDiscardConfirm(false)} className="min-h-11 flex-1 text-left text-[16px] text-ink-65">Keep workout</button><button type="button" onClick={() => void handleDiscard()} className="min-h-11 text-[16px] font-semibold text-ink">Discard</button></div>
            ) : <button type="button" onClick={() => setDiscardConfirm(true)} className="flex min-h-14 w-full items-center border-b border-ink-06 px-5 text-left text-[16px] font-semibold text-ink last:border-b-0 active:bg-ink-04">Discard workout</button>}
            <button type="button" onClick={() => { setShowMenu(false); useUIStore.getState().openSheet('geo-companion') }} className="flex min-h-14 w-full items-center border-b border-ink-06 px-5 text-left text-[16px] font-semibold text-ink last:border-b-0 active:bg-ink-04">Ask Geo</button>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet open={showExitSheet} onClose={() => { setShowExitSheet(false); setDiscardConfirm(false) }} ariaLabel="Exit workout">
        <div className="px-5 pb-5 pt-3">
          <h2 className="font-wide text-[22px] font-bold leading-tight text-ink">Leave this workout?</h2>
          <p className="mt-1 text-[15px] text-ink-65">Your sets are saved. Pick it up again from Train.</p>
          <button type="button" onClick={handleSaveAndExit} className="mt-5 flex h-14 w-full items-center justify-center rounded-[18px] bg-ink text-[17px] font-semibold text-cream transition-transform active:scale-[.97]">Save and exit</button>
          {discardConfirm ? (
            <div className="mt-2 flex items-center justify-center gap-6"><button type="button" onClick={() => setDiscardConfirm(false)} className="min-h-11 text-[15px] font-semibold text-ink-65">Keep workout</button><button type="button" onClick={() => void handleDiscard()} className="min-h-11 text-[15px] font-semibold text-ink">Discard for good</button></div>
          ) : <button type="button" onClick={() => setDiscardConfirm(true)} className="mt-2 min-h-11 w-full text-[15px] font-semibold text-ink-65">Discard workout</button>}
          <button type="button" onClick={() => setShowExitSheet(false)} className="min-h-11 w-full text-[15px] font-semibold text-ink-65">Keep going</button>
        </div>
      </BottomSheet>
    </div>
  )
}
