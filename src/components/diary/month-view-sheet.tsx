'use client'

/**
 * FB-07 — Food Diary Month View Sheet
 *
 * Bottom-sheet calendar grid. Opens when the user taps the month label
 * above the weekly strip. Shows per-day kcal totals + a workout dot.
 * Tapping a day jumps the diary to that date.
 *
 * All aggregation comes from the existing `getLogsSummary('month')`
 * endpoint — no backend change.
 */

import { useEffect, useState, useCallback, useMemo } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { getLogs } from '@/lib/api/logs.api'
import {
  buildMonthGrid,
  shiftMonth,
  type DailyBreakdownRow,
} from '@/lib/month-grid'
import { todayLocalISO } from '@/lib/timezone'
import { shiftISO } from './diary-logic'
import { cn } from '@/lib/utils'
import type { Log, FoodPayload } from '@/types/logs.types'

interface MonthViewSheetProps {
  isOpen: boolean
  initialDate: string // YYYY-MM-DD — diary's currently selected date
  onClose: () => void
  onSelectDate: (date: string) => void
  /** IANA timezone string from useUserTimezone(). Drives the isToday highlight. */
  tz?: string
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

function monthTitle(anchorISO: string): string {
  const [y, m] = anchorISO.split('-').map(Number)
  return `${MONTH_NAMES[m - 1]} ${y}`
}

// Anchor the sheet to the first day of the month that contains `iso`.
function firstOfMonth(iso: string): string {
  const [y, m] = iso.split('-')
  return `${y}-${m}-01`
}

export function MonthViewSheet({
  isOpen,
  initialDate,
  onClose,
  onSelectDate,
  tz,
}: MonthViewSheetProps) {
  const [anchor, setAnchor] = useState<string>(() => firstOfMonth(initialDate))
  const [breakdown, setBreakdown] = useState<DailyBreakdownRow[]>([])
  const [loading, setLoading] = useState(false)

  // Reset anchor to the diary's selected month each time the sheet opens.
  useEffect(() => {
    if (isOpen) {
      setAnchor(firstOfMonth(initialDate))
    }
  }, [isOpen, initialDate])

  // Fetch + aggregate the ANCHORED month on open + on anchor change.
  // The /v1/logs/summary?period=month endpoint only ever returns the CURRENT
  // month (no month param), so navigating to a past month rendered every cell
  // empty. Instead we pull logs covering the anchor month via getLogs (which
  // does lookback-from-now) and bucket per local day client-side.
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    setLoading(true)
    const today = todayLocalISO(tz)
    const daysBack = Math.max(
      31,
      Math.round((Date.parse(today) - Date.parse(anchor)) / 86_400_000) + 32
    )
    const dayOf = (l: Log) =>
      l.local_date ?? new Date(l.created_at).toISOString().split('T')[0]
    Promise.all([
      getLogs({ type: 'food', days: daysBack }).catch(() => [] as Log[]),
      getLogs({ type: 'workout', days: daysBack }).catch(() => [] as Log[]),
    ])
      .then(([foodLogs, workoutLogs]) => {
        if (cancelled) return
        const byDate = new Map<string, DailyBreakdownRow>()
        const get = (d: string) =>
          byDate.get(d) ?? { date: d, calories: 0, protein: 0, carbs: 0, fat: 0, workouts: 0 }
        for (const l of foodLogs) {
          const d = dayOf(l)
          const m = (l.payload as FoodPayload)?.est_macros
          const row = get(d)
          row.calories += m?.calories ?? 0
          row.protein += m?.protein ?? 0
          row.carbs += m?.carbs ?? 0
          row.fat += m?.fat ?? 0
          byDate.set(d, row)
        }
        for (const l of workoutLogs) {
          const d = dayOf(l)
          const row = get(d)
          row.workouts += 1
          byDate.set(d, row)
        }
        setBreakdown(
          [...byDate.values()].map((r) => ({ ...r, calories: Math.round(r.calories) }))
        )
      })
      .catch(() => {
        if (!cancelled) setBreakdown([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, anchor, tz])

  const today = todayLocalISO(tz)
  const grid = useMemo(
    () => buildMonthGrid(anchor, breakdown, today),
    [anchor, breakdown, today]
  )

  // Footer: days with food logged in the shown month, and their average (journey-food month sheet).
  const monthDays = breakdown.filter((r) => r.date.startsWith(anchor.slice(0, 7)) && r.calories > 0)
  const average = monthDays.length ? Math.round(monthDays.reduce((t, r) => t + r.calories, 0) / monthDays.length) : 0
  // The backend accepts logs up to 7 days ahead, so later days have nothing to open.
  const lastOpenDay = shiftISO(today, 7)

  const handlePrev = useCallback(() => setAnchor((a) => shiftMonth(a, -1)), [])
  const handleNext = useCallback(() => setAnchor((a) => shiftMonth(a, 1)), [])

  const handleDayTap = useCallback(
    (date: string) => {
      onSelectDate(date)
      onClose()
    },
    [onSelectDate, onClose]
  )

  return (
    <BottomSheet open={isOpen} onClose={onClose} ariaLabel="Select date">
      <div className="flex items-center gap-1 px-3 pb-3 pt-1">
        <h2 id="month-sheet-title" className="min-w-0 flex-1 pl-2 text-[22px] font-bold tracking-[-0.3px] text-ink tabular-nums">
          {monthTitle(anchor)}
        </h2>
        <button type="button" onClick={handlePrev} aria-label="Previous month" className="grid size-11 place-items-center rounded-full text-ink transition-transform active:scale-[.94]">
          <ChevronLeft className="size-5" strokeWidth={1.75} />
        </button>
        <button type="button" onClick={handleNext} aria-label="Next month" className="grid size-11 place-items-center rounded-full text-ink transition-transform active:scale-[.94]">
          <ChevronRight className="size-5" strokeWidth={1.75} />
        </button>
        <button type="button" onClick={onClose} aria-label="Close" className="grid size-11 place-items-center rounded-full bg-ink-06 text-ink transition-transform active:scale-[.94]">
          <X className="size-5" strokeWidth={1.75} />
        </button>
      </div>

      <div className="grid grid-cols-7 px-3 pb-1" aria-hidden="true">
        {WEEKDAY_LABELS.map((label, i) => (
          <div key={`${label}-${i}`} className="py-1 text-center text-[12px] font-semibold text-ink-65">
            {label}
          </div>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3" aria-busy={loading || undefined}>
        <div className="grid grid-cols-7 gap-y-1">
          {grid.flat().map((cell) => {
            const isSelected = cell.date === initialDate
            const isFuture = cell.date > today
            const beyond = cell.date > lastOpenDay
            if (!cell.inMonth) return <span key={cell.date} aria-hidden="true" />
            return (
              <button
                key={cell.date}
                type="button"
                onClick={() => handleDayTap(cell.date)}
                disabled={beyond}
                aria-pressed={isSelected}
                aria-current={cell.isToday ? 'date' : undefined}
                aria-label={`${cell.date}${cell.isToday ? ', today' : ''}${cell.calories !== null ? `, ${cell.calories} kcal` : ''}${cell.workouts > 0 ? ', workout logged' : ''}`}
                className={cn(
                  'relative flex h-[54px] flex-col items-center justify-center gap-1 rounded-[14px] tabular-nums transition-transform enabled:active:scale-[.94] disabled:opacity-40',
                  isFuture ? 'text-ink-65' : 'text-ink',
                  isSelected && 'bg-card shadow-[var(--shadow-card)] outline outline-[1.5px] -outline-offset-[1.5px] outline-ink',
                )}
              >
                <span className={cn('text-[16px] leading-none', cell.isToday ? 'font-bold' : isFuture ? 'font-medium' : 'font-semibold')}>{cell.dayNum}</span>
                {cell.calories !== null
                  ? <span className="text-[11px] font-semibold leading-none text-ink-65">{cell.calories.toLocaleString('en-AU')}</span>
                  : loading && !isFuture ? <span aria-hidden="true" className="h-[9px] w-7 rounded-full bg-ink-06" /> : <span className="h-[11px]" />}
                {cell.isToday ? (
                  <svg viewBox="0 0 10 7" className="absolute top-0.5 h-[5px] w-[7px] text-accent" aria-hidden="true"><path d="M0 0h10L5 7Z" fill="currentColor" /></svg>
                ) : null}
                {cell.workouts > 0 ? <span className="absolute bottom-1 size-1 rounded-full bg-ink" aria-hidden="true" /> : null}
              </button>
            )
          })}
        </div>
      </div>
      {/* pb-7 lifts the footer clear of the 38 pt sheet corners. */}
      <p className="flex justify-between px-5 pb-7 pt-3 text-caption text-ink-65 tabular-nums">
        {loading ? <span>Loading this month</span> : <span>{monthDays.length ? `${monthDays.length} day${monthDays.length === 1 ? '' : 's'} logged` : 'No logs this month'}</span>}
        {!loading && monthDays.length ? <span>Average {average.toLocaleString('en-AU')} kcal</span> : null}
      </p>
    </BottomSheet>
  )
}
