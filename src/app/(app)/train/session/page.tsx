'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createPortal } from 'react-dom'
import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { NumberField, SearchablePicker } from '@/components/plans/plan-builder-shared'
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from 'framer-motion'
import { PushedHeader } from '@/components/layout/screen-header'
import { OfflineBand } from '@/components/shared/offline-band'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { ErrorState } from '@/components/ui/fiqr/error-state'
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '@/components/ui/fiqr/icons'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { RoundButton } from '@/components/ui/fiqr/round-button'
import { ExerciseVisual } from '@/components/workout/muscle-map'
import { RestTimer } from '@/components/workout/rest-timer'
import { AllExercisesList, ExerciseNav, SessionSkeleton, SessionTimerCard, SetTable } from '@/components/workout/session-cards'
import { SessionReceipt } from '@/components/workout/session-receipt'
import { setReps, setWeight, stepReps, stepWeight, upNextText } from '@/components/workout/train-data'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import { useUserTimezone } from '@/hooks/useUserTimezone'
import { unlockAudio } from '@/lib/audio'
import { searchExercises, type ExerciseSearchResult } from '@/lib/api/exercises.api'
import { abandonWorkoutSession, completeWorkoutSession, getWorkoutSession, updateWorkoutSession } from '@/lib/api/workout-sessions.api'
import { haptic } from '@/lib/platform/app'
import { writeWorkoutToHealth } from '@/lib/platform/health'
import { reducedFade, spring } from '@/lib/motion'
import { computeCompleteSetResult, firstIncompleteExerciseIndex, isExerciseComplete, nextIncompleteExerciseIndex, resolveElapsedForSession } from '@/lib/workout-session'
import { useUIStore } from '@/stores/ui.store'
import type { SessionExercise, SetData, WorkoutSession } from '@/types/workout-session.types'
import { goBack } from '@/lib/navigation'

/** "2 min", "90 s" or "1 min 30 s" for the plan line. */
function restText(seconds: number): string {
  if (seconds < 60 || seconds === 90) return `${seconds} s`
  return seconds % 60 ? `${Math.floor(seconds / 60)} min ${seconds % 60} s` : `${seconds / 60} min`
}

/**
 * One exercise per screen, changed by a depth step: Next sends the current card back (smaller, fading) while the next
 * comes forward from just in front; Previous plays it in reverse. Scale and opacity only, critically damped.
 */
const STEP = {
  enter: (dir: number) => ({ opacity: 0, scale: dir > 0 ? 1.05 : 0.92 }),
  center: { opacity: 1, scale: 1 },
  exit: (dir: number) => ({ opacity: 0, scale: dir > 0 ? 0.92 : 1.05 }),
}
const STEP_SPRING = { scale: spring.glide, opacity: { duration: 0.28, ease: 'easeOut' } } as const

/** The card while it leaves stops being the current step and takes no input. */
function ExerciseCard({ index, count, direction, then, children }: { index: number; count: number; direction: number; then: string; children: ReactNode }) {
  const present = useIsPresent()
  const reduce = useReducedMotion()
  // The "Then:" line travels with its card, so nothing below jumps when the leaving card unmounts.
  return (
    <motion.div
      custom={direction}
      variants={reduce ? { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } } : STEP}
      initial="enter" animate="center" exit="exit"
      transition={reduce ? reducedFade : STEP_SPRING}
      inert={!present}
      className="origin-[50%_30%] [grid-area:1/1]"
    >
      <article aria-current={present ? 'step' : undefined} aria-label={`Exercise ${index + 1} of ${count}`} className="rounded-card bg-[var(--surface-card,var(--color-card))] p-3.5 shadow-[var(--shadow-card)]">
        {children}
      </article>
      <p className="mt-2 truncate px-1 text-label text-ink-65">{then}</p>
    </motion.div>
  )
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
  const tz = useUserTimezone()
  const [session, setSession] = useState<WorkoutSession | null>(null)
  const sessionRef = useRef<WorkoutSession | null>(null)
  useLayoutEffect(() => { sessionRef.current = session }, [session])
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [showRestTimer, setShowRestTimer] = useState(false)
  const [howToOpen, setHowToOpen] = useState(false)
  const [restSeconds, setRestSeconds] = useState(90)
  const [restKey, setRestKey] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [completing, setCompleting] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  // Once the summary is opaque the live controls under it are removed (one orange action, nothing tabbable behind).
  const [summaryCovered, setSummaryCovered] = useState(false)
  const [showExitSheet, setShowExitSheet] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [removeConfirm, setRemoveConfirm] = useState(false)
  const [discardConfirm, setDiscardConfirm] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  // The set the lifter tapped to edit; null means the first set still to do.
  const [focusSet, setFocusSet] = useState<number | null>(null)
  const initedRef = useRef(false)
  const [celebrate, setCelebrate] = useState(false)
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addPick, setAddPick] = useState<ExerciseSearchResult | null>(null)
  const [addSets, setAddSets] = useState<number | undefined>(3)
  const [addReps, setAddReps] = useState<number | undefined>(10)
  const [addRest, setAddRest] = useState<number | undefined>(90)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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

  const saveExercises = useCallback((nextExercises: SessionExercise[]) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      updateWorkoutSession(sessionId, { exercises: nextExercises }).catch(() => {})
    }, 500)
  }, [sessionId])

  /** Writes new exercises through a ref, so a held stepper's repeats each build on the last one. */
  const commit = useCallback((nextExercises: SessionExercise[]) => {
    const base = sessionRef.current
    if (!base) return
    const next = { ...base, exercises: nextExercises }
    sessionRef.current = next
    setSession(next)
    saveExercises(nextExercises)
  }, [saveExercises])

  const indexRef = useRef(0)
  useLayoutEffect(() => { indexRef.current = currentIndex }, [currentIndex])
  const goTo = useCallback((index: number) => {
    const from = indexRef.current
    if (index === from || index < 0 || index >= (sessionRef.current?.exercises.length ?? 0)) return
    setDirection(index > from ? 1 : -1)
    setCurrentIndex(index)
    setFocusSet(null)
    setHowToOpen(false)
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }, [reduce])

  const stepSet = (setIndex: number, field: 'kg' | 'reps', dir: 1 | -1) => {
    const base = sessionRef.current
    if (!base) return
    const updated = [...base.exercises]
    const exercise = updated[currentIndex]
    const sets = [...exercise.sets]
    const set = sets[setIndex]
    sets[setIndex] = field === 'kg'
      ? { ...set, actual_weight_kg: stepWeight(setWeight(set), dir) }
      : { ...set, actual_reps: stepReps(setReps(set), dir) }
    updated[currentIndex] = { ...exercise, sets }
    commit(updated)
  }

  const completeSet = (exerciseIndex: number, setIndex: number) => {
    const base = sessionRef.current
    if (!base) return
    unlockAudio()
    // Q28: success on a new tick, nothing on an untick.
    if (!base.exercises[exerciseIndex]?.sets[setIndex]?.completed) void haptic('success')
    const result = computeCompleteSetResult(base.exercises, exerciseIndex, setIndex, new Date().toISOString())
    commit(result.exercises)
    setFocusSet(null)

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
        if (next >= 0) goTo(next)
      }, 1100)
    }
  }

  const addSet = (exerciseIndex: number) => {
    const base = sessionRef.current
    if (!base) return
    const updated = [...base.exercises]
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
    commit(updated)
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
      setShowRestTimer(false)
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
    setDirection(1)
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
      <div className="mx-auto min-h-dvh w-full max-w-md px-4">
        <PushedHeader title="" onBack={() => goBack(router, '/train')} backLabel="Back to training" />
        {/* motion-feel 3h: skeletons only after 150 ms without data, so a quick load goes straight to content. */}
        <motion.div className="pt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.12, delay: 0.15 }}><SessionSkeleton /></motion.div>
      </div>
    )
  }
  if (!session) {
    return (
      <div className="mx-auto min-h-dvh w-full max-w-md px-4">
        <PushedHeader title="Workout" onBack={() => goBack(router, '/train')} backLabel="Back to training" />
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

  // A finished session opened from history is its receipt.
  if (session.status === 'completed' && !showSummary) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4">
        <PushedHeader title="" onBack={() => goBack(router, '/train')} backLabel="Back to training" />
        <div className="flex flex-1 flex-col pt-1">
          <SessionReceipt session={session} tz={tz} animate={false} onDone={() => goBack(router, '/train')} />
        </div>
      </div>
    )
  }

  // The receipt fades in over the live screen, so finishing never cuts to an empty frame.
  const summary = showSummary ? (
    <motion.div key="summary" role="dialog" aria-label="Session done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onAnimationComplete={() => setSummaryCovered(true)} transition={{ duration: 0.2, ease: 'easeOut' }} className="fixed inset-0 z-[80] mx-auto flex w-full max-w-md flex-col overflow-y-auto bg-cream px-4" style={{ paddingTop: 'calc(28px + var(--safe-top))' }}>
      <SessionReceipt session={session} tz={tz} animate onDone={() => router.push('/train')} />
    </motion.div>
  ) : null

  const allComplete = exercises.length > 0 && exercises.every(isExerciseComplete)
  const currentComplete = current ? isExerciseComplete(current) : false
  const isLast = currentIndex === exercises.length - 1
  const nextOpen = nextIncompleteExerciseIndex(exercises, currentIndex)
  const activeSet = current ? (focusSet != null && !current.sets[focusSet]?.completed ? focusSet : current.sets.findIndex((set) => !set.completed)) : -1
  const following = exercises[currentIndex + 1]

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md text-ink">
      <AnimatePresence>{summary}</AnimatePresence>
      <RestTimer isActive={showRestTimer && !showSummary} duration={restSeconds} resetToken={restKey} upNext={upNextText(exercises, currentIndex)} onSkip={() => setShowRestTimer(false)} onComplete={() => setShowRestTimer(false)} />

      <div className="px-4"><PushedHeader title={session.day_name} onBack={handleBack} backLabel="Go back" actions={optionsButton} /></div>
      <OfflineBand />

      {/* Content fades in on its own; an opacity ancestor would also hide the nav's backdrop filter. */}
      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18, ease: 'easeOut' }} className="px-4 pt-2" style={{ paddingBottom: 'calc(120px + var(--safe-bottom))' }}>
        {exercises.length === 0 ? (
          <button type="button" onClick={() => setShowAddForm(true)} className="flex min-h-16 w-full items-center justify-center rounded-card border-[1.5px] border-dashed border-ink-20 text-body-sm font-semibold text-ink-65 transition-transform active:scale-[.98]">
            No exercises yet. Add one
          </button>
        ) : (
          <>
            <SessionTimerCard elapsedSeconds={elapsedSeconds} exercises={exercises} currentIndex={currentIndex} />
            <div className="mt-2.5"><ExerciseNav index={currentIndex} count={exercises.length} onPrev={() => goTo(currentIndex - 1)} onNext={() => goTo(currentIndex + 1)} onAll={() => setShowAll(true)} /></div>
            <div className="mt-2.5 grid">
              <AnimatePresence initial={false} custom={direction}>
                {current ? (
                  <ExerciseCard key={`${currentIndex}-${current.name}`} index={currentIndex} count={exercises.length} direction={direction} then={following ? `Then: ${following.name}` : 'Last exercise'}>
                    <ExerciseVisual group={current.muscle_group} name={current.name} />
                    <h2 className="mt-3 line-clamp-3 break-words text-balance font-display text-[22px] font-extrabold leading-[1.14] tracking-[-0.01em] text-ink">{current.name}</h2>
                    {/* The how-to toggle shares the plan line so the set rows start higher up the screen. */}
                    <div className="flex min-h-11 items-center justify-between gap-3">
                      <p className="text-body-sm text-ink-65 tabular-nums">{current.planned_sets} × {current.planned_reps}{current.rest_seconds ? ` · ${restText(current.rest_seconds)} rest` : ''}</p>
                      {current.instructions && current.instructions.length > 0 ? (
                        <button type="button" aria-expanded={howToOpen} onClick={() => setHowToOpen((open) => !open)} className="-mr-2 min-h-11 shrink-0 px-2 text-body-sm font-bold text-ink">{howToOpen ? 'Hide steps' : 'How to'}</button>
                      ) : null}
                    </div>
                    {howToOpen && current.instructions?.length ? (
                      <ol className="mb-2 list-decimal space-y-1 pl-5">{current.instructions.map((step, index) => <li key={index} className="text-body-sm text-ink-65">{step}</li>)}</ol>
                    ) : null}

                    <SetTable
                      exercise={current} activeSet={activeSet} celebrate={celebrate}
                      onFocus={setFocusSet} onStep={stepSet} onToggle={(setIndex) => completeSet(currentIndex, setIndex)}
                    />

                    <button type="button" onClick={() => addSet(currentIndex)} className="mt-1 min-h-11 text-body-sm font-semibold text-ink-65">+ Add set</button>

                    <textarea
                      placeholder="Notes: form cues, how it felt" aria-label={`Notes for ${current.name}`} value={current.notes || ''}
                      onChange={(event) => {
                        const base = sessionRef.current
                        if (!base) return
                        const updated = [...base.exercises]
                        updated[currentIndex] = { ...updated[currentIndex], notes: event.target.value }
                        commit(updated)
                      }}
                      className="mt-2 h-14 w-full resize-none rounded-[14px] border-0 bg-ink-04 px-3 py-2.5 text-body-sm text-ink outline-none placeholder:text-ink-65 focus:ring-[1.5px] focus:ring-ink"
                    />
                  </ExerciseCard>
                ) : null}
              </AnimatePresence>
            </div>
          </>
        )}

        {showAddForm && (
          <div className="mt-4 space-y-3 rounded-card bg-[var(--surface-card,var(--color-card))] p-4 shadow-[var(--shadow-card)]">
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

      {/* Portalled to body: the route frame's enter transform would otherwise make this fixed bar ride with the page
          and jump into place when the push ends. A solid floating bar so it can animate in (a moving glass bar skips paints). */}
      {exercises.length > 0 && !summaryCovered ? createPortal(
      <motion.nav aria-label="Workout" initial={reduce ? { opacity: 0 } : { y: 32, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={reduce ? reducedFade : spring.sheet} className="fixed inset-x-2 z-20 mx-auto max-w-[calc(28rem-16px)] rounded-[28px] bg-cream p-2 shadow-[var(--shadow-glass)]" style={{ bottom: 'calc(8px + var(--safe-bottom))' }}>
        {/* Previous stays on every exercise; on the last one (or when all are done) Next becomes Finish workout. */}
        <div className="grid grid-cols-[1fr_1.4fr] gap-2">
          <button type="button" onClick={() => goTo(currentIndex - 1)} disabled={currentIndex <= 0} className="flex h-btn items-center justify-center gap-1 rounded-[18px] bg-ink-06 text-body font-bold text-ink transition-transform enabled:active:scale-[.97] disabled:text-ink-35"><ChevronLeftIcon className="size-[18px]" /> Previous</button>
          {allComplete || isLast ? (
            <PrimaryButton type="button" className="rounded-[18px] px-3" onClick={() => void handleComplete()} disabled={completing}>{completing ? 'Finishing…' : 'Finish workout'}</PrimaryButton>
          ) : (
            <button
              type="button"
              onClick={() => goTo(currentComplete && nextOpen >= 0 ? nextOpen : currentIndex + 1)}
              className="flex h-btn items-center justify-center gap-1 rounded-[18px] bg-ink text-body font-bold text-cream transition-transform active:scale-[.97]"
            >
              {currentComplete ? 'Next exercise' : 'Next'} <ChevronRightIcon className="size-[18px]" />
            </button>
          )}
        </div>
      </motion.nav>,
      document.body,
      ) : null}

      <BottomSheet open={showAll} onClose={() => setShowAll(false)} ariaLabel="All exercises">
        <div className="flex items-center justify-between px-5 pb-3 pt-1">
          <h2 className="font-display text-hero text-ink">All exercises</h2>
          <RoundButton aria-label="Close" onClick={() => setShowAll(false)}><CloseIcon /></RoundButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5">
          <AllExercisesList exercises={exercises} currentIndex={currentIndex} nextIndex={nextOpen} onPick={(index) => { setShowAll(false); goTo(index) }} />
        </div>
      </BottomSheet>

      <BottomSheet open={showMenu} onClose={() => { setShowMenu(false); setRemoveConfirm(false); setDiscardConfirm(false) }} ariaLabel="Workout options">
        <div className="px-4 pb-5 pt-2">
          <div className="overflow-hidden rounded-card bg-[var(--surface-card,var(--color-card))] shadow-[var(--shadow-card)]">
            <button type="button" onClick={() => { setShowMenu(false); setShowAddForm(true) }} className="flex min-h-row w-full items-center border-b border-ink-06 px-5 text-left text-body font-semibold text-ink last:border-b-0 active:bg-ink-04">Add exercise</button>
            <button type="button" onClick={() => void handleComplete()} disabled={completing} className="flex min-h-row w-full items-center border-b border-ink-06 px-5 text-left text-body font-semibold text-ink last:border-b-0 active:bg-ink-04">Finish workout</button>
            {current && (
              removeConfirm ? (
                <div className="flex min-h-row items-center gap-3 border-b border-ink-06 px-5"><button type="button" onClick={() => setRemoveConfirm(false)} className="min-h-11 flex-1 text-left text-body text-ink-65">Keep it</button><button type="button" onClick={() => handleRemoveExercise(currentIndex)} className="min-h-11 text-body font-semibold text-ink">Remove</button></div>
              ) : <button type="button" onClick={() => setRemoveConfirm(true)} className="flex min-h-row w-full items-center border-b border-ink-06 px-5 text-left text-body font-semibold text-ink last:border-b-0 active:bg-ink-04"><span className="truncate">Remove {current.name}</span></button>
            )}
            {discardConfirm ? (
              <div className="flex min-h-row items-center gap-3 border-b border-ink-06 px-5"><button type="button" onClick={() => setDiscardConfirm(false)} className="min-h-11 flex-1 text-left text-body text-ink-65">Keep workout</button><button type="button" onClick={() => void handleDiscard()} className="min-h-11 text-body font-semibold text-ink">Discard</button></div>
            ) : <button type="button" onClick={() => setDiscardConfirm(true)} className="flex min-h-row w-full items-center border-b border-ink-06 px-5 text-left text-body font-semibold text-ink last:border-b-0 active:bg-ink-04">Discard workout</button>}
            <button type="button" onClick={() => { setShowMenu(false); useUIStore.getState().openSheet('geo-companion') }} className="flex min-h-row w-full items-center border-b border-ink-06 px-5 text-left text-body font-semibold text-ink last:border-b-0 active:bg-ink-04">Ask Geo</button>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet open={showExitSheet} onClose={() => { setShowExitSheet(false); setDiscardConfirm(false) }} ariaLabel="Exit workout">
        <div className="px-5 pb-5 pt-3">
          <h2 className="font-display text-hero text-ink">Leave this workout?</h2>
          <p className="mt-1 text-body-sm text-ink-65">Your sets are saved. Pick it up again from Train.</p>
          <button type="button" onClick={handleSaveAndExit} className="mt-5 flex h-btn w-full items-center justify-center rounded-full bg-ink text-body font-bold text-cream transition-transform active:scale-[.97]">Save and exit</button>
          {discardConfirm ? (
            <div className="mt-2 flex items-center justify-center gap-6"><button type="button" onClick={() => setDiscardConfirm(false)} className="min-h-11 text-body-sm font-semibold text-ink-65">Keep workout</button><button type="button" onClick={() => void handleDiscard()} className="min-h-11 text-body-sm font-semibold text-ink">Discard for good</button></div>
          ) : <button type="button" onClick={() => setDiscardConfirm(true)} className="mt-2 min-h-11 w-full text-body-sm font-semibold text-ink-65">Discard workout</button>}
          <button type="button" onClick={() => setShowExitSheet(false)} className="min-h-11 w-full text-body-sm font-semibold text-ink-65">Keep going</button>
        </div>
      </BottomSheet>
    </div>
  )
}
