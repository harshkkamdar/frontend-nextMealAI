/**
 * FB-R6.7 Build C — Dashboard Check-In Card
 *
 * Replaces the per-meal-average narrative + 4-metric grid with George's locked
 * format: compact 7-day daily table + 1-line "Focus this week:" takeaway.
 *
 *   Day      Cal       P     C     F
 *   Mon    1900/2200  140  195  55
 *   Tue    2180/2200  198  218  58  ✓
 *   ...
 *   → Focus this week: protein. You're 30g/day short on avg.
 *
 * Tap → opens Geo chat with a prefill asking for a deeper trends discussion.
 * Visual contract preserved: `bg-surface border border-border rounded-2xl`.
 *
 * Back-compat: handles older payloads (v=1, with `narrative` and no `days`)
 * by falling through to the legacy paragraph until the BE cache rolls over.
 */

'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import type {
  DashboardCheckIn,
  DashboardCheckInDay,
} from '@/lib/api/dashboard.api'

const PREFILL = encodeURIComponent(
  'Walk me through my trends from this week — what should I focus on?'
)

function shortMacro(cell: { actual: number; target: number }): string {
  return `${Math.round(cell.actual)}/${Math.round(cell.target)}`
}

export function CheckInCard({ checkIn }: { checkIn: DashboardCheckIn }) {
  // /cso P1 — stable UUID across re-renders so we don't leak orphan session IDs.
  const drilldownHref = useMemo(
    () => `/chat/${crypto.randomUUID()}?prefill=${PREFILL}`,
    []
  )

  const hasDays =
    Array.isArray(checkIn.days) && checkIn.days.length > 0

  return (
    <div
      className="bg-surface border border-border rounded-2xl p-4"
      data-testid="check-in-card"
    >
      <div className="flex items-center gap-1.5 mb-3">
        <Sparkles className="w-4 h-4 text-accent" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
          Check-in
        </span>
      </div>

      {hasDays ? (
        <DaysTable days={checkIn.days} />
      ) : checkIn.narrative ? (
        // v=1 back-compat: a stale cache row from before Build C deployed.
        <p className="text-sm text-text-primary leading-relaxed mb-3">
          {checkIn.narrative}
        </p>
      ) : null}

      <p
        className="text-sm text-text-primary leading-relaxed mb-3 mt-3"
        data-testid="check-in-takeaway"
      >
        <span className="text-accent" aria-hidden>
          →{' '}
        </span>
        {checkIn.takeaway}
      </p>

      <Link
        href={drilldownHref}
        className="text-xs font-medium text-accent hover:underline"
        data-testid="check-in-drilldown-link"
      >
        Ask Geo for the deeper view &rarr;
      </Link>
    </div>
  )
}

// Header labels share a column count with the rows so the zebra stripes line up.
const HEAD_CLS =
  'text-[10px] uppercase tracking-[0.04em] text-text-tertiary py-1 px-1.5'

function DaysTable({ days }: { days: DashboardCheckInDay[] }) {
  return (
    <div
      className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] text-xs tabular-nums overflow-hidden rounded-lg border border-border/60"
      data-testid="check-in-days-table"
      role="table"
      aria-label="7-day adherence"
    >
      {/* Header row */}
      <div className={`${HEAD_CLS} bg-surface-hover/60`} role="columnheader">
        Day
      </div>
      <div className={`${HEAD_CLS} bg-surface-hover/60`} role="columnheader">
        Cal
      </div>
      <div className={`${HEAD_CLS} bg-surface-hover/60 text-right`} role="columnheader">
        P
      </div>
      <div className={`${HEAD_CLS} bg-surface-hover/60 text-right`} role="columnheader">
        C
      </div>
      <div className={`${HEAD_CLS} bg-surface-hover/60 text-right`} role="columnheader">
        F
      </div>
      <div className={`${HEAD_CLS} bg-surface-hover/60 text-right`} role="columnheader" aria-label="hit">
        ✓
      </div>

      {/* Day rows */}
      {days.map((d, i) => (
        <DayRow key={d.date} day={d} index={i} />
      ))}
    </div>
  )
}

function DayRow({ day: d, index }: { day: DashboardCheckInDay; index: number }) {
  // Zebra striping + per-row padding turns a cramped wall of numbers into
  // scannable rows (Harsh: dashboard table "looks like an eye sore"). Hit days
  // get a faint success tint so adherence reads at a glance.
  const rowBg = d.hit
    ? 'bg-success/[0.07]'
    : index % 2 === 1
      ? 'bg-text-primary/[0.025]'
      : ''
  const cell = `py-1.5 px-1.5 ${rowBg}`
  return (
    <>
      <div className={`${cell} text-text-secondary font-medium`} role="cell">
        {d.day_of_week}
      </div>
      <div className={`${cell} text-text-primary`} role="cell">
        {shortMacro(d.calories)}
      </div>
      <div className={`${cell} text-text-primary text-right`} role="cell">
        {Math.round(d.protein.actual)}
      </div>
      <div className={`${cell} text-text-primary text-right`} role="cell">
        {Math.round(d.carbs.actual)}
      </div>
      <div className={`${cell} text-text-primary text-right`} role="cell">
        {Math.round(d.fat.actual)}
      </div>
      <div
        className={`${cell} text-right text-success font-semibold`}
        role="cell"
        aria-label={d.hit ? 'hit target' : 'missed target'}
      >
        {d.hit ? '✓' : <span className="text-text-tertiary">·</span>}
      </div>
    </>
  )
}
