'use client'

import { useRef, useEffect, memo, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { todayLocalISO } from '@/lib/timezone'

interface CalendarStripProps {
  selectedDate: string // ISO date string (YYYY-MM-DD)
  onSelectDate: (date: string) => void
  indicators?: Map<string, { food?: boolean; workout?: boolean }>
  /** FB-07: month-spanning label rendered above the strip (e.g. "March – April 2026"). */
  label?: string
  /** FB-07: fires when the user taps the label (to open the month-view sheet). */
  onLabelClick?: () => void
  /** FB-R5-02: IANA timezone for the "today" indicator. */
  tz?: string
}

function toISO(d: Date): string {
  return d.toISOString().split('T')[0]
}

function generateDays(
  centerDate: string,
  todayLocal: string,
): Array<{ date: string; dayName: string; dayNum: number; isToday: boolean }> {
  const center = new Date(centerDate + 'T12:00:00')
  const days: Array<{ date: string; dayName: string; dayNum: number; isToday: boolean }> = []

  for (let offset = -3; offset <= 3; offset++) {
    const d = new Date(center)
    d.setDate(d.getDate() + offset)
    const iso = toISO(d)
    days.push({
      date: iso,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
      isToday: iso === todayLocal,
    })
  }

  return days
}

export const CalendarStrip = memo(function CalendarStrip({
  selectedDate,
  onSelectDate,
  indicators,
  label,
  onLabelClick,
  tz,
}: CalendarStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const todayLocal = useMemo(() => todayLocalISO(tz), [tz])
  const days = useMemo(() => generateDays(selectedDate, todayLocal), [selectedDate, todayLocal])

  // Center-scroll on mount.
  useEffect(() => {
    const selected = scrollRef.current?.querySelector('[data-selected="true"]') as HTMLElement | null
    selected?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [])

  return (
    <div className="space-y-2">
      {label && (
        onLabelClick ? (
          <button
            type="button"
            onClick={onLabelClick}
            aria-label={`${label} — open month view`}
            className="text-[12px] font-medium uppercase tracking-[1.4px] text-ink-65"
          >
            <span>{label}</span>
          </button>
        ) : (
          <div className="text-[12px] font-medium uppercase tracking-[1.4px] text-ink-65">
            <span>{label}</span>
          </div>
        )
      )}
    <div
      ref={scrollRef}
      data-no-swipe-back
      className="flex gap-2 overflow-x-auto scrollbar-hide -mx-gutter px-gutter"
    >
      {days.map((day) => {
        const isSelected = day.date === selectedDate
        const ind = indicators?.get(day.date)

        return (
          <button
            key={day.date}
            data-selected={isSelected}
            onClick={() => onSelectDate(day.date)}
            aria-label={`${day.date}${day.isToday ? ', today' : ''}`}
            className={cn(
              'flex w-11 shrink-0 flex-col items-center gap-1 rounded-[14px] py-2',
              day.isToday
                ? 'bg-ink text-cream'
                : isSelected
                  ? 'border border-ink text-ink'
                  : 'text-ink'
            )}
          >
            <span className={cn(
              'text-[11px] font-semibold uppercase tracking-[1.4px]',
              day.isToday ? 'text-cream-55' : 'text-ink-65'
            )}>
              {day.dayName}
            </span>
            <span className={cn(
              'text-[17px] font-semibold',
              day.isToday ? 'text-cream' : 'text-ink'
            )}>
              {day.dayNum}
            </span>

            <div className="h-1">
              {(ind?.food || ind?.workout) && (
                <div data-indicator="activity" className="size-1 rounded-full bg-accent" />
              )}
            </div>
          </button>
        )
      })}
    </div>
    </div>
  )
})
