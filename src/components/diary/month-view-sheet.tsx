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

  const grid = useMemo(
    () => buildMonthGrid(anchor, breakdown, todayLocalISO(tz)),
    [anchor, breakdown, tz]
  )

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
            {/* Header: prev | title | next | close */}
            <div className="flex items-center justify-between px-gutter pb-3">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous month"
                className="rounded-full p-2 text-ink-65"
              >
                <ChevronLeft className="size-5" />
              </button>

              <h2
                id="month-sheet-title"
                className="text-[22px] font-semibold tracking-[-0.4px] text-ink tabular-nums"
              >
                {monthTitle(anchor)}
              </h2>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next month"
                  className="rounded-full p-2 text-ink-65"
                >
                  <ChevronRight className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="rounded-full p-2 text-ink-65"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Weekday header row */}
            <div className="grid grid-cols-7 gap-1 px-gutter pb-1">
              {WEEKDAY_LABELS.map((label, i) => (
                <div
                  key={`${label}-${i}`}
                  className="py-1 text-center text-[11px] font-semibold uppercase tracking-[1.4px] text-ink-65"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Grid body */}
            <div
              className="min-h-0 flex-1 overflow-y-auto px-gutter pb-6"
              aria-busy={loading || undefined}
            >
              <div className="grid grid-cols-7 gap-1">
                {grid.flat().map((cell) => {
                  const isSelected = cell.date === initialDate
                  return (
                    <button
                      key={cell.date}
                      type="button"
                      onClick={() => handleDayTap(cell.date)}
                      disabled={!cell.inMonth}
                      aria-label={
                        cell.inMonth
                          ? `${cell.date}${cell.calories !== null ? `, ${cell.calories} kcal` : ''}${cell.workouts > 0 ? ', workout logged' : ''}`
                          : undefined
                      }
                      className={cn(
                        'aspect-square flex flex-col items-center justify-center gap-0.5 rounded-[12px] tabular-nums',
                        cell.inMonth
                          ? 'text-ink'
                          : 'cursor-default bg-transparent text-ink-35',
                        cell.isToday && cell.inMonth && 'bg-ink text-cream',
                        isSelected && cell.inMonth && !cell.isToday && 'border border-ink'
                      )}
                    >
                      <span
                        className={cn(
                          'text-sm font-semibold leading-none',
                          cell.isToday && cell.inMonth ? 'text-cream' : undefined
                        )}
                      >
                        {cell.dayNum}
                      </span>
                      {cell.inMonth && (
                        <span
                          className={cn(
                            'text-[11px] leading-none',
                            cell.isToday ? 'text-cream-55' : 'text-ink-65'
                          )}
                        >
                          {cell.calories !== null ? `${cell.calories}` : '\u2014'}
                        </span>
                      )}
                      {cell.inMonth && cell.workouts > 0 && (
                        <span
                          className={cn(
                            'size-1 rounded-full bg-accent'
                          )}
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
    </BottomSheet>
  )
}
