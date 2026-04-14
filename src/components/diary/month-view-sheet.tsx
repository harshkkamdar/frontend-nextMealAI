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
import { AnimatePresence, motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { getLogsSummary } from '@/lib/api/logs.api'
import {
  buildMonthGrid,
  shiftMonth,
  type DailyBreakdownRow,
} from '@/lib/month-grid'
import { cn } from '@/lib/utils'

interface MonthViewSheetProps {
  isOpen: boolean
  initialDate: string // YYYY-MM-DD — diary's currently selected date
  onClose: () => void
  onSelectDate: (date: string) => void
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

  // Fetch month summary on open + on anchor change.
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    setLoading(true)
    getLogsSummary('month')
      .then((res) => {
        if (cancelled) return
        const rows = Array.isArray(res?.daily_breakdown) ? res.daily_breakdown : []
        setBreakdown(rows as DailyBreakdownRow[])
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
  }, [isOpen, anchor])

  const grid = useMemo(() => buildMonthGrid(anchor, breakdown), [anchor, breakdown])

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
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="month-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
          />

          <motion.div
            key="month-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="month-sheet-title"
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl flex flex-col"
            style={{ maxHeight: '85vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header: prev | title | next | close */}
            <div className="flex items-center justify-between px-4 pb-3">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous month"
                className="p-2 rounded-full hover:bg-surface-hover"
              >
                <ChevronLeft className="w-4 h-4 text-text-secondary" />
              </button>

              <h2
                id="month-sheet-title"
                className="text-base font-semibold text-text-primary tabular-nums"
              >
                {monthTitle(anchor)}
              </h2>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next month"
                  className="p-2 rounded-full hover:bg-surface-hover"
                >
                  <ChevronRight className="w-4 h-4 text-text-secondary" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="p-2 rounded-full hover:bg-surface-hover"
                >
                  <X className="w-4 h-4 text-text-secondary" />
                </button>
              </div>
            </div>

            {/* Weekday header row */}
            <div className="grid grid-cols-7 gap-1 px-4 pb-1">
              {WEEKDAY_LABELS.map((label, i) => (
                <div
                  key={`${label}-${i}`}
                  className="text-[10px] font-medium uppercase tracking-[0.08em] text-text-tertiary text-center py-1"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Grid body */}
            <div
              className="flex-1 overflow-y-auto px-4 pb-6"
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
                        'aspect-square flex flex-col items-center justify-center gap-0.5 rounded-xl border transition-colors tabular-nums',
                        cell.inMonth
                          ? 'bg-surface border-border hover:bg-surface-hover text-text-primary'
                          : 'bg-transparent border-transparent text-text-tertiary/40 cursor-default',
                        isSelected && cell.inMonth && 'bg-accent border-accent text-white hover:bg-accent',
                        cell.isToday && cell.inMonth && !isSelected && 'border-accent'
                      )}
                    >
                      <span
                        className={cn(
                          'text-sm font-semibold leading-none',
                          isSelected && cell.inMonth ? 'text-white' : undefined
                        )}
                      >
                        {cell.dayNum}
                      </span>
                      {cell.inMonth && (
                        <span
                          className={cn(
                            'text-[9px] leading-none',
                            isSelected ? 'text-white/80' : 'text-text-tertiary'
                          )}
                        >
                          {cell.calories !== null ? `${cell.calories}` : '\u2014'}
                        </span>
                      )}
                      {cell.inMonth && cell.workouts > 0 && (
                        <span
                          className={cn(
                            'w-1 h-1 rounded-full',
                            isSelected ? 'bg-white' : 'bg-info'
                          )}
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
