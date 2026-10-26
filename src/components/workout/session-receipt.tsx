'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { CountUp } from '@/components/ui/fiqr/count-up'
import { GeoLine } from '@/components/ui/fiqr/geo-line'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { reducedFade, spring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { WorkoutSession } from '@/types/workout-session.types'
import { bestText, compareExercise, deltaText, formatHistoryDate, receiptLine, sessionVolumeKg, type ExerciseCompare } from './train-data'

const CARD = 'rounded-card bg-card shadow-[var(--shadow-card)]'
const fmt = (n: number) => Math.round(n).toLocaleString('en-AU')

/** Volume per exercise, today (ink) against last time (light ink); bars grow from the left (scaleX only). */
function VolumeCompareChart({ compares, animate }: { compares: ExerciseCompare[]; animate: boolean }) {
  const reduce = useReducedMotion()
  const max = Math.max(1, ...compares.flatMap((c) => [c.volume, c.lastVolume]))
  const bar = (value: number, tone: string, index: number, lag: number) => (
    <span className="block h-2.5 overflow-hidden rounded-full">
      <motion.span
        className={cn('block h-full w-full origin-left rounded-full', tone)}
        initial={animate && !reduce ? { scaleX: 0 } : false}
        animate={{ scaleX: Math.max(value > 0 ? 0.02 : 0, value / max) }}
        transition={reduce ? reducedFade : { ...spring.glide, delay: 0.3 + index * 0.05 + lag }}
      />
    </span>
  )
  return (
    <section className={cn(CARD, 'p-4')} aria-label="Volume by exercise">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2 className="whitespace-nowrap text-headline text-ink">Volume by exercise</h2>
        <p className="flex shrink-0 items-center gap-3 text-label text-ink-65" aria-hidden="true">
          <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-ink" />Today</span>
          <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-ink-20" />Last time</span>
        </p>
      </div>
      <ul className="mt-3 space-y-3" aria-hidden="true">
        {compares.map((c, index) => (
          <li key={`${c.name}-${index}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-3 gap-y-1">
            <span className="truncate text-caption font-semibold text-ink">{c.name}</span>
            <span className="text-caption font-semibold text-ink tabular-nums">{fmt(c.volume)}<span className="font-medium text-ink-65"> kg</span></span>
            <span className="col-span-2 grid gap-1">
              {bar(c.volume, 'bg-ink', index, 0)}
              {bar(c.lastVolume, 'bg-ink-20', index, 0.03)}
            </span>
          </li>
        ))}
      </ul>
      <ul className="sr-only">
        {compares.map((c, index) => <li key={index}>{c.name}: {fmt(c.volume)} kg today{c.lastVolume ? `, ${fmt(c.lastVolume)} kg last time` : ', no last time'}.</li>)}
      </ul>
    </section>
  )
}

/**
 * D2 Session receipt plus a graph: time, sets and volume in one receipt row, Geo's line, volume per exercise against
 * last time, then each exercise's best set and its change. All from the session itself (each set carries last
 * time's numbers), so it needs no extra request.
 */
export function SessionReceipt({ session, tz, title = 'Session done', animate, onDone }: { session: WorkoutSession; tz: string; title?: string; animate: boolean; onDone: () => void }) {
  const reduce = useReducedMotion()
  const compares = session.exercises.map(compareExercise)
  const sets = compares.reduce((sum, c) => sum + c.setsDone, 0)
  const volume = session.total_volume_kg ?? sessionVolumeKg(session.exercises)
  const when = session.completed_at ?? session.started_at
  const charted = compares.some((c) => c.volume > 0 || c.lastVolume > 0)
  const enter = (index: number) => ({
    initial: animate ? (reduce ? { opacity: 0 } : { opacity: 0, y: 12 }) : false,
    animate: { opacity: 1, y: 0 },
    transition: reduce ? reducedFade : { ...spring.glide, delay: 0.08 + index * 0.04 },
  }) as const
  const tiles = [
    { label: 'Time', value: session.duration_minutes ?? 0, unit: 'min' },
    { label: 'Sets', value: sets, unit: '' },
    { label: 'Volume', value: volume, unit: 'kg' },
  ]
  return (
    <div className="flex min-h-full flex-col">
      <motion.h1 {...enter(0)} className="font-display text-title text-ink">{title}</motion.h1>
      <motion.p {...enter(0)} className="mt-1 break-words text-body-sm text-ink-65">{session.day_name}{when ? ` · ${formatHistoryDate(when, tz)}` : ''}</motion.p>

      <motion.section {...enter(1)} aria-label="Session totals" className={cn(CARD, 'mt-4 grid grid-cols-3 divide-x divide-ink-06')}>
        {tiles.map((tile) => (
          <p key={tile.label} className="min-w-0 px-4 py-3.5">
            <span className="block text-caption font-semibold text-ink-65">{tile.label}</span>
            <span className="mt-1.5 flex items-baseline gap-1">
              <span className="font-display text-hero text-ink tabular-nums"><CountUp value={tile.value} delay={animate ? 0.3 : 0} /></span>
              {tile.unit ? <span className="text-caption font-semibold text-ink-65">{tile.unit}</span> : null}
            </span>
          </p>
        ))}
      </motion.section>

      <motion.div {...enter(2)} className="px-1"><GeoLine>{receiptLine(compares)}</GeoLine></motion.div>

      {charted ? <motion.div {...enter(3)}><VolumeCompareChart compares={compares} animate={animate} /></motion.div> : null}

      <motion.section {...enter(4)} className="mt-5" aria-label="Against last time">
        <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
          <h2 className="text-headline text-ink">Against last time</h2>
          <span className="text-caption font-semibold text-ink-65 tabular-nums">{compares.filter((c) => c.best).length} of {compares.length} exercises</span>
        </div>
        <ul className={cn(CARD, 'overflow-hidden')}>
          {compares.map((c, index) => {
            const delta = deltaText(c)
            return (
              <li key={`${c.name}-${index}`} className="flex min-h-row items-center gap-3 border-b border-ink-06 px-4 py-2.5 last:border-b-0">
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-body font-semibold text-ink">{c.name}</span>
                  <span className="block text-caption text-ink-65 tabular-nums">{bestText(c)}</span>
                </span>
                <span className={cn('shrink-0 text-body-sm tabular-nums', delta.up ? 'font-bold text-ink' : 'font-semibold text-ink-65')}>{delta.text}</span>
              </li>
            )
          })}
        </ul>
      </motion.section>

      <div className="sticky bottom-0 mt-auto bg-cream pt-4" style={{ paddingBottom: 'calc(12px + var(--safe-bottom))' }}>
        <PrimaryButton type="button" onClick={onDone}>Done</PrimaryButton>
      </div>
    </div>
  )
}
