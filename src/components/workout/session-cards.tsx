'use client'

import { useEffect, useRef, type PointerEvent } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { CountUp } from '@/components/ui/fiqr/count-up'
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/fiqr/icons'
import { RoundButton } from '@/components/ui/fiqr/round-button'
import { reducedFade, spring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { isExerciseComplete } from '@/lib/workout-session'
import type { SessionExercise } from '@/types/workout-session.types'
import { DigitTiles } from './digit-tiles'
import { clockHMS, formatKg, formatLast, sessionVolumeKg, setReps, setWeight } from './train-data'

const CARD = 'rounded-card bg-card shadow-[var(--shadow-card)]'

function TickIcon({ className = 'size-[18px]' }: { className?: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4 10-10" /></svg>
}

function PlusMinus({ plus }: { plus?: boolean }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d={plus ? 'M5 12h14M12 5v14' : 'M5 12h14'} /></svg>
}

/** One segment per exercise; each fills from its left edge as its sets are ticked (scaleX only). */
export function SetProgress({ exercises, currentIndex }: { exercises: SessionExercise[]; currentIndex: number }) {
  const reduce = useReducedMotion()
  const totalSets = exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)
  const completedSets = exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.completed).length, 0)
  const doneExercises = exercises.filter(isExerciseComplete).length
  return (
    <div>
      <div
        role="progressbar" aria-label="Sets done" aria-valuemin={0} aria-valuemax={totalSets} aria-valuenow={completedSets}
        aria-valuetext={`${completedSets} of ${totalSets} sets`}
        data-fraction={totalSets ? completedSets / totalSets : 0}
        className="flex gap-1"
      >
        {exercises.map((exercise, index) => {
          const done = exercise.sets.filter((set) => set.completed).length
          const fraction = exercise.sets.length ? done / exercise.sets.length : 0
          return (
            <span key={`${exercise.name}-${index}`} className={cn('relative h-1.5 flex-1 overflow-hidden rounded-full', index === currentIndex ? 'bg-ink-12' : 'bg-ink-06')}>
              <motion.span className="absolute inset-0 origin-left rounded-full bg-ink" initial={false} animate={{ scaleX: fraction }} transition={reduce ? reducedFade : spring.glide} />
            </span>
          )
        })}
      </div>
      <p className="mt-1.5 flex justify-between gap-3 text-caption font-medium text-ink-65 tabular-nums">
        <span>{completedSets} of {totalSets} sets</span>
        <span>{doneExercises} of {exercises.length} exercises done</span>
      </p>
    </div>
  )
}

/** Live session hero (Q27): digit-tile clock, volume count-up, segmented set progress. */
export function SessionTimerCard({ elapsedSeconds, exercises, currentIndex }: { elapsedSeconds: number; exercises: SessionExercise[]; currentIndex: number }) {
  const hms = clockHMS(elapsedSeconds)
  const minutes = Math.floor(elapsedSeconds / 60)
  return (
    <section className={cn(CARD, 'px-4 pb-3.5 pt-3.5')} aria-label="Session">
      <div className="flex items-center justify-between gap-3">
        <DigitTiles text={hms} label={`Time ${minutes} min ${elapsedSeconds % 60} s`} size="sm" />
        <p className="text-right">
          <span className="block text-caption font-semibold leading-none text-ink-65">Volume</span>
          <span className="mt-1 flex items-baseline justify-end font-display text-hero font-extrabold text-ink tabular-nums"><CountUp value={sessionVolumeKg(exercises)} delay={0} /><span className="text-caption font-semibold text-ink-65">&nbsp;kg</span></span>
        </p>
      </div>
      <div className="mt-3"><SetProgress exercises={exercises} currentIndex={currentIndex} /></div>
    </section>
  )
}

/** "Exercise n of N" with Previous and Next either side; the middle opens the All exercises sheet. */
export function ExerciseNav({ index, count, onPrev, onNext, onAll }: { index: number; count: number; onPrev: () => void; onNext: () => void; onAll: () => void }) {
  return (
    <nav aria-label="Exercises" className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-1.5">
      <RoundButton aria-label="Previous exercise" onClick={onPrev} disabled={index <= 0} className="disabled:opacity-40"><ChevronLeftIcon /></RoundButton>
      <button type="button" onClick={onAll} aria-haspopup="dialog" className="flex min-h-11 flex-col items-center justify-center rounded-full px-2.5 text-center">
        <span className="text-body-sm font-bold text-ink tabular-nums">Exercise {index + 1} of {count}</span>
        <span className="text-caption font-semibold text-ink-65 underline underline-offset-2">All exercises</span>
      </button>
      <RoundButton aria-label="Next exercise" onClick={onNext} disabled={index >= count - 1} className="disabled:opacity-40"><ChevronRightIcon /></RoundButton>
    </nav>
  )
}

/** A stepper: tap for one step, hold to repeat (after 420 ms, every 90 ms). Keyboard clicks step once. */
function Stepper({ label, value, unit, onStep }: { label: string; value: string; unit: string; onStep: (dir: 1 | -1) => void }) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stop = () => { if (timer.current) clearTimeout(timer.current); timer.current = null }
  useEffect(() => stop, [])
  const hold = (dir: 1 | -1) => (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    stop()
    onStep(dir)
    const repeat = () => { onStep(dir); timer.current = setTimeout(repeat, 90) }
    timer.current = setTimeout(repeat, 420)
  }
  const button = (dir: 1 | -1) => (
    <button
      type="button" aria-label={`${dir > 0 ? 'More' : 'Less'} ${label}`}
      onPointerDown={hold(dir)} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}
      onClick={(event) => { if (event.detail === 0) onStep(dir) }}
      className="grid h-stepper place-items-center rounded-[14px] text-ink active:bg-ink-08"
    >
      <PlusMinus plus={dir > 0} />
    </button>
  )
  return (
    <div className="grid h-stepper grid-cols-[48px_minmax(0,1fr)_48px] items-center rounded-[14px] bg-ink-06">
      {button(-1)}
      <output aria-live="polite" aria-label={`${label} ${value}`} className="whitespace-nowrap text-center text-[20px] font-extrabold text-ink tabular-nums">
        {value}<small className="text-label font-semibold text-ink-65"> {unit}</small>
      </output>
      {button(1)}
    </div>
  )
}

const ROW = 'grid grid-cols-[26px_minmax(0,1fr)_72px_56px_48px] items-center gap-x-1.5'

/**
 * B1 Stepper rows: the set being worked on opens into two 56 pt steppers and a tall tick; every other set is one
 * compact row. Tapping an open set's numbers makes it the working set.
 */
export function SetTable({ exercise, activeSet, celebrate, onFocus, onStep, onToggle }: {
  exercise: SessionExercise
  activeSet: number
  celebrate: boolean
  onFocus: (set: number) => void
  onStep: (set: number, field: 'kg' | 'reps', dir: 1 | -1) => void
  onToggle: (set: number) => void
}) {
  const reduce = useReducedMotion()
  return (
    <div>
      <div className={cn(ROW, 'pb-1 text-label text-ink-65')}>
        <span>Set</span><span>Last time</span><span className="text-center">kg</span><span className="text-center">Reps</span><span className="text-center">Done</span>
      </div>
      {exercise.sets.map((set, index) => {
        const kg = setWeight(set)
        const kgText = kg == null ? '—' : formatKg(kg)
        const reps = setReps(set)
        if (index === activeSet && !set.completed) {
          return (
            <motion.div
              key={index}
              initial={reduce ? false : { opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={reduce ? reducedFade : spring.glide}
              className="grid grid-cols-[minmax(0,1fr)_64px] gap-1.5 border-t border-ink-06 pb-2.5 pt-2 first:border-t-0"
              data-active-set={index}
            >
              <p className="col-span-2 text-body-sm font-semibold text-ink-65 tabular-nums">Set {index + 1} · last time {formatLast(set)}</p>
              <div className="grid gap-1.5">
                <Stepper label="weight" value={kgText} unit="kg" onStep={(dir) => onStep(index, 'kg', dir)} />
                <Stepper label="reps" value={String(reps)} unit="reps" onStep={(dir) => onStep(index, 'reps', dir)} />
              </div>
              <button type="button" onClick={() => onToggle(index)} aria-label={`Complete set ${set.set_number}`} aria-pressed={false} className="grid place-items-center rounded-[16px] bg-ink text-cream transition-transform active:scale-[.96]">
                <TickIcon className="size-[22px]" />
              </button>
            </motion.div>
          )
        }
        return (
          <div key={index} className={cn(ROW, 'min-h-14 border-t border-ink-06 tabular-nums first:border-t-0')}>
            <span className="text-[17px] font-bold text-ink">{set.set_number}</span>
            <span className="truncate text-body-sm text-ink-65">{formatLast(set)}</span>
            {set.completed ? (
              <>
                <span className="text-center text-[19px] font-bold text-ink">{kgText}</span>
                <span className="text-center text-[19px] font-bold text-ink">{reps}</span>
              </>
            ) : (
              <>
                <button type="button" onClick={() => onFocus(index)} aria-label={`Set ${set.set_number} ${kgText} kilograms, edit`} className="h-11 min-w-0 rounded-[12px] bg-ink-06 text-[19px] font-bold text-ink">{kgText}</button>
                <button type="button" onClick={() => onFocus(index)} aria-label={`Set ${set.set_number} ${reps} reps, edit`} className="h-11 min-w-0 rounded-[12px] bg-ink-06 text-[19px] font-bold text-ink">{reps}</button>
              </>
            )}
            <button type="button" onClick={() => onToggle(index)} aria-label={`Complete set ${set.set_number}`} aria-pressed={set.completed} className="mx-auto grid size-11 place-items-center transition-transform active:scale-[.9]">
              <span className="relative grid size-[38px] place-items-center rounded-full border-[1.5px] border-ink-20">
                {set.completed ? (
                  // The ink disc grows in and the tick pops after it (transform and opacity only).
                  <motion.span
                    key={set.completed_at ?? 'done'}
                    className="absolute -inset-[1.5px] grid place-items-center rounded-full bg-ink text-cream"
                    initial={reduce ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
                    animate={{ scale: celebrate ? 1.08 : 1, opacity: 1 }}
                    transition={reduce ? reducedFade : spring.tap}
                  >
                    <TickIcon />
                  </motion.span>
                ) : null}
              </span>
            </button>
          </div>
        )
      })}
    </div>
  )
}

/** The All exercises sheet: done, now and next, set counts; a tap jumps to that exercise. */
export function AllExercisesList({ exercises, currentIndex, nextIndex, onPick }: { exercises: SessionExercise[]; currentIndex: number; nextIndex: number; onPick: (index: number) => void }) {
  const totalSets = exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)
  const completedSets = exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.completed).length, 0)
  return (
    <>
      <p className="mb-2 px-1 text-label text-ink-65 tabular-nums">{completedSets} of {totalSets} sets done</p>
      <ol className="overflow-hidden rounded-card bg-card shadow-[var(--shadow-card)]">
        {exercises.map((exercise, index) => {
          const done = isExerciseComplete(exercise)
          const setsDone = exercise.sets.filter((set) => set.completed).length
          const state = index === currentIndex ? 'Now' : done ? 'Done' : index === nextIndex ? 'Next' : ''
          return (
            <li key={`${exercise.name}-${index}`} className="border-b border-ink-06 last:border-b-0">
              <button
                type="button" onClick={() => onPick(index)} aria-current={index === currentIndex ? 'step' : undefined}
                aria-label={`Exercise ${index + 1}: ${exercise.name}, ${setsDone} of ${exercise.sets.length} sets${state ? `, ${state.toLowerCase()}` : ''}`}
                className="flex min-h-row w-full items-center gap-3 px-4 py-2.5 text-left active:bg-ink-04"
              >
                <span className={cn('grid size-8 shrink-0 place-items-center rounded-full text-caption font-bold tabular-nums', index === currentIndex || done ? 'bg-ink text-cream' : 'bg-ink-06 text-ink')}>
                  {done && index !== currentIndex ? <TickIcon className="size-3.5" /> : index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body font-semibold text-ink">{exercise.name}</span>
                  <span className="block text-caption text-ink-65 tabular-nums">{setsDone} of {exercise.sets.length} sets</span>
                </span>
                {state ? <span className="shrink-0 text-caption font-semibold text-ink-65">{state}</span> : null}
              </button>
            </li>
          )
        })}
      </ol>
    </>
  )
}

export function SessionSkeleton() {
  const block = 'rounded-card bg-ink-04 animate-[pulse_1.2s_ease-in-out_600ms_infinite]'
  return (
    <div className="space-y-3" role="status" aria-busy="true" aria-label="Loading workout">
      <div className={cn(block, 'h-[104px]')} />
      <div className={cn(block, 'h-11')} />
      <div className={cn(block, 'h-[460px]')} />
    </div>
  )
}
