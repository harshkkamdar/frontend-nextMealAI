'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { CountUp } from '@/components/ui/fiqr/count-up'
import { reducedFade, spring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { SessionExercise } from '@/types/workout-session.types'
import { DigitTiles } from './digit-tiles'
import { clockHMS, sessionVolumeKg } from './train-data'

const CARD = 'rounded-[24px] bg-card shadow-[var(--shadow-card)]'

/** One segment per exercise; each fills from its left edge as its sets are ticked (scaleX only). */
export function SetProgress({ exercises, currentIndex }: { exercises: SessionExercise[]; currentIndex: number }) {
  const reduce = useReducedMotion()
  const totalSets = exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)
  const completedSets = exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.completed).length, 0)
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
              <motion.span
                className="absolute inset-0 origin-left rounded-full bg-ink"
                initial={false}
                animate={{ scaleX: fraction }}
                transition={reduce ? reducedFade : spring.glide}
              />
            </span>
          )
        })}
      </div>
      <p className="mt-1.5 flex justify-between text-[13px] font-medium text-ink-65 tabular-nums">
        <span>{completedSets} of {totalSets} sets</span>
        <span>Exercise {Math.min(currentIndex + 1, exercises.length)} of {exercises.length}</span>
      </p>
    </div>
  )
}

/**
 * Live session hero (Q27): digit-tile clock, volume count-up, segmented set progress. Kept to one compact row plus
 * the progress bar so the current exercise's set rows stay above the fold at 360x800.
 */
export function SessionTimerCard({ elapsedSeconds, exercises, currentIndex }: { elapsedSeconds: number; exercises: SessionExercise[]; currentIndex: number }) {
  const hms = clockHMS(elapsedSeconds)
  const minutes = Math.floor(elapsedSeconds / 60)
  return (
    <section className={cn(CARD, 'px-4 pb-3.5 pt-4')} aria-label="Session">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold leading-none text-ink-65">Time</p>
          <div className="mt-1.5"><DigitTiles text={hms} label={`${minutes} min ${elapsedSeconds % 60} s`} size="sm" /></div>
        </div>
        <p className="text-right">
          <span className="block text-[13px] font-semibold leading-none text-ink-65">Volume</span>
          <span className="mt-1.5 flex h-[34px] items-center justify-end text-[17px] font-bold text-ink tabular-nums"><CountUp value={sessionVolumeKg(exercises)} delay={0} /><span className="text-[13px] font-semibold text-ink-65">&nbsp;kg</span></span>
        </p>
      </div>
      <div className="mt-3"><SetProgress exercises={exercises} currentIndex={currentIndex} /></div>
    </section>
  )
}

export function SessionSkeleton() {
  const block = 'rounded-[24px] bg-ink-04 animate-[pulse_1.2s_ease-in-out_600ms_infinite]'
  return (
    <div className="space-y-3" role="status" aria-busy="true" aria-label="Loading workout">
      <div className={cn(block, 'h-[112px]')} />
      <div className={cn(block, 'h-[460px]')} />
    </div>
  )
}
