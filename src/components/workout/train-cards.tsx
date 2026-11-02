'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronRightIcon } from '@/components/ui/fiqr/icons'
import { CountUp } from '@/components/ui/fiqr/count-up'
import { MetricStrip } from '@/components/ui/fiqr/metric-strip'
import { reducedFade, spring } from '@/lib/motion'
import { cn, plural } from '@/lib/utils'
import type { WorkoutPlanDay } from '@/types/plans.types'
import type { WorkoutSession } from '@/types/workout-session.types'
import { formatExDetail, formatHistoryDate } from './train-data'

export const CARD = 'rounded-card tile'
const fmt = (n: number) => Math.round(n).toLocaleString('en-AU')

type Layer = 'hero' | 'tile' | 'row'
const FROM: Record<Layer, { opacity: number; y?: number; scale?: number }> = { hero: { opacity: 0, scale: 0.98 }, tile: { opacity: 0, y: 12 }, row: { opacity: 0, y: 8 } }
const DELAY: Record<Layer, (i: number) => number> = { hero: () => 0, tile: (i) => 0.16 + i * 0.04, row: (i) => 0.24 + Math.min(i, 5) * 0.03 }

/** First-paint entrance per layer (motion-feel 3e): hero scales, tiles rise 12 px, rows 8 px; revisits paint at rest. */
export function Enter({ first, layer, index = 0, className, children }: { first: boolean; layer: Layer; index?: number; className?: string; children: ReactNode }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={first ? (reduce ? { opacity: 0 } : FROM[layer]) : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={reduce ? reducedFade : { ...spring.glide, delay: DELAY[layer](index) }}
    >
      {children}
    </motion.div>
  )
}

export function SectionTitle({ children, trailing }: { children: ReactNode; trailing?: ReactNode }) {
  return (
    <div className="mb-2.5 mt-5 flex items-baseline justify-between gap-3">
      <h2 className="text-[11.5px] font-semibold uppercase tracking-[1.8px] text-ink-62">{children}</h2>
      {trailing ? <span className="min-w-0 truncate text-[13px] text-ink-62 tabular-nums">{trailing}</span> : null}
    </div>
  )
}

/** George's Next Up card (DESIGN.md component 4), the same as Home's: navy, the workout name as the largest type. */
export function NextUpCard({ eyebrow, title, meta, action }: { eyebrow: string; title: string; meta: string; action: ReactNode }) {
  return (
    <section className="rounded-[22px] bg-ink p-[22px] text-cream" aria-label="Next session" data-testid="activity-next-up-card">
      <p className="text-[11.5px] font-semibold uppercase tracking-[1.8px] text-cream-55">{eyebrow}</p>
      <h2 className="mt-[3px] line-clamp-2 break-words text-[28px] font-bold leading-[1.1] tracking-[-0.6px] text-cream">{title}</h2>
      <p className="mt-[3px] text-[14px] text-cream-60">{meta}</p>
      <div className="mt-[18px]">{action}</div>
    </section>
  )
}

/** This week's volume: total counts up, one bar per day grows from its base (Q23, transform only). */
export function VolumeCard({ perDay, labels, todayIndex, sessions, planned, first }: { perDay: number[]; labels: string[]; todayIndex: number; sessions: number; planned: number | null; first: boolean }) {
  const reduce = useReducedMotion()
  const total = perDay.reduce((a, b) => a + b, 0)
  if (total === 0 && sessions === 0) {
    return <MetricStrip items={[
      { label: 'Sessions', value: '0', unit: planned === null ? undefined : `of ${planned}`, sub: 'this week' },
      { label: 'Volume', value: '0', unit: 'kg', sub: 'lifted' },
    ]} />
  }
  const max = Math.max(...perDay, 1)
  return (
    <section className={cn(CARD, 'p-4')} aria-label="This week">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[1.4px] text-ink-62">Volume</p>
          <p className="mt-1 flex items-baseline gap-1">
            <span className="text-[28px] font-bold leading-none tracking-[-0.6px] text-ink tabular-nums"><CountUp value={total} delay={0.2} /></span>
            <span className="text-body-sm font-semibold text-ink-65">kg</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[1.4px] text-ink-62">Sessions</p>
          <p className="mt-1 text-[28px] font-bold leading-none tracking-[-0.6px] text-ink tabular-nums">{sessions}<span className="text-body font-semibold text-ink-65">{planned === null ? '' : ` of ${planned}`}</span></p>
        </div>
      </div>
      <div className="relative mt-4 grid grid-cols-7 gap-1.5" aria-hidden="true">
        {perDay.map((kg, index) => {
          const fraction = kg / max
          return (
            <span key={labels[index] + index} className="flex flex-col items-center gap-1.5">
              {/* Every day stands on one continuous baseline; empty days are just the line. */}
              <span className="flex h-[96px] w-full items-end justify-center border-b-[1.5px] border-ink-10">
                {kg > 0 ? (
                  <motion.span
                    className="block h-full w-full max-w-[36px] origin-bottom rounded-t-[10px] bg-ink"
                    initial={first && !reduce ? { scaleY: 0 } : false}
                    animate={{ scaleY: Math.max(0.06, fraction) }}
                    transition={reduce ? reducedFade : { ...spring.glide, delay: 0.16 + index * 0.04 }}
                  />
                ) : index === todayIndex ? <span className="block h-1 w-full max-w-[36px] rounded-t-[3px] bg-ink-20" /> : null}
              </span>
              <span className={cn('text-label text-ink-65', index === todayIndex ? 'font-bold text-ink' : 'font-medium')}>{labels[index]}</span>
            </span>
          )
        })}
      </div>
      <p className="sr-only">{fmt(total)} kg lifted this week across {plural(sessions, 'session')}.</p>
    </section>
  )
}

export function ProgramCard({ days, nextIdx, first }: { days: WorkoutPlanDay[]; nextIdx: number; first: boolean }) {
  const [expanded, setExpanded] = useState<number | null>(null)
  return (
    <section className={cn(CARD, 'overflow-hidden')} data-testid="activity-program-overview" aria-label="Program days">
      {days.map((day, index) => {
        const exercises = day.exercises ?? []
        const canExpand = !day.is_rest_day && exercises.length > 0
        const open = expanded === index
        const isNext = index === nextIdx
        return (
          <Enter key={`${day.name}-${index}`} first={first} layer="row" index={index} className="border-b border-ink-06 last:border-b-0">
            <button
              type="button"
              onClick={() => canExpand && setExpanded(open ? null : index)}
              aria-expanded={canExpand ? open : undefined}
              className="flex min-h-row w-full items-center gap-3 px-4 py-3 text-left active:bg-ink-04"
            >
              <span className={cn('grid size-7 shrink-0 place-items-center rounded-full text-caption font-semibold tabular-nums', isNext ? 'bg-ink text-cream' : 'bg-ink-06 text-ink')}>{index + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body font-semibold text-ink">{day.is_rest_day ? 'Rest' : (day.name || `Day ${index + 1}`)}</span>
                <span className="block text-caption text-ink-65">{day.is_rest_day ? 'Recovery' : plural(exercises.length, 'exercise')}{isNext ? ' · next' : ''}</span>
              </span>
              {canExpand ? <ChevronRightIcon className={cn('size-4 text-ink-35 transition-transform duration-200', open && 'rotate-90')} /> : null}
            </button>
            {open ? (
              <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }} className="space-y-2 pb-4 pl-[56px] pr-4">
                {exercises.map((exercise, exerciseIndex) => {
                  const detail = formatExDetail(exercise)
                  return (
                    <li key={`${exercise.name}-${exerciseIndex}`} className="flex items-baseline justify-between gap-3 text-body-sm">
                      <span className="min-w-0 break-words text-ink">{exercise.name}</span>
                      {detail ? <span className="shrink-0 text-caption text-ink-65 tabular-nums">{detail}</span> : null}
                    </li>
                  )
                })}
              </motion.ul>
            ) : null}
          </Enter>
        )
      })}
    </section>
  )
}

export function HistoryCard({ sessions, tz, first, onOpen, onLog }: { sessions: WorkoutSession[]; tz: string; first: boolean; onOpen: (id: string) => void; onLog: () => void }) {
  if (sessions.length === 0) {
    return (
      <button type="button" onClick={onLog} className="flex min-h-11 w-full items-center justify-center text-[15px] font-semibold text-ink-65 active:opacity-60">
        No workouts yet. Log a freestyle one
      </button>
    )
  }
  return (
    <section className={cn(CARD, 'overflow-hidden')} aria-label="Workout history">
      {sessions.slice(0, 10).map((session, index) => {
        const sets = session.exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.completed).length, 0)
        return (
          <Enter key={session.id} first={first} layer="row" index={index} className="border-b border-ink-06 last:border-b-0">
            <button type="button" onClick={() => onOpen(session.id)} className="flex min-h-row w-full items-center gap-3 px-4 py-3 text-left active:bg-ink-04" data-testid={index === 0 ? 'activity-last-session' : undefined}>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body font-semibold text-ink">{session.day_name}</span>
                <span className="block truncate text-caption text-ink-65">{formatHistoryDate(session.completed_at!, tz)} · {session.duration_minutes ?? 0} min · {plural(sets, 'set')}</span>
              </span>
              {session.total_volume_kg ? <span className="shrink-0 text-body-sm font-semibold text-ink tabular-nums">{fmt(session.total_volume_kg)}<span className="text-caption font-medium text-ink-65"> kg</span></span> : null}
              <ChevronRightIcon className="size-4 shrink-0 text-ink-35" />
            </button>
          </Enter>
        )
      })}
    </section>
  )
}

/** Same boxes as the loaded screen, so the swap never shifts; blocks pulse only after 600 ms. */
export function TrainSkeleton() {
  const block = 'rounded-card bg-ink-04 animate-[pulse_1.2s_ease-in-out_600ms_infinite]'
  return (
    <div className="mt-5 space-y-3" role="status" aria-busy="true" aria-label="Loading training">
      <div className={cn(block, 'h-[196px]')} />
      <div className={cn(block, 'h-[176px]')} />
      <div className={cn(block, 'h-[256px]')} />
    </div>
  )
}
