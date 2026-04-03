'use client'

import { useRef, useEffect, memo } from 'react'
import { cn } from '@/lib/utils'

interface CalendarStripProps {
  selectedDate: string // ISO date string (YYYY-MM-DD)
  onSelectDate: (date: string) => void
  indicators?: Map<string, { food?: boolean; workout?: boolean }>
}

function toISO(d: Date): string {
  return d.toISOString().split('T')[0]
}

function generateDays(centerDate: string): Array<{ date: string; dayName: string; dayNum: number; isToday: boolean }> {
  const center = new Date(centerDate + 'T12:00:00')
  const today = toISO(new Date())
  const days: Array<{ date: string; dayName: string; dayNum: number; isToday: boolean }> = []

  for (let offset = -3; offset <= 3; offset++) {
    const d = new Date(center)
    d.setDate(d.getDate() + offset)
    const iso = toISO(d)
    days.push({
      date: iso,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
      isToday: iso === today
    })
  }

  return days
}

export const CalendarStrip = memo(function CalendarStrip({
  selectedDate,
  onSelectDate,
  indicators
}: CalendarStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const today = toISO(new Date())
  const days = generateDays(selectedDate)

  // Center-scroll on mount
  useEffect(() => {
    if (scrollRef.current) {
      const container = scrollRef.current
      const selected = container.querySelector('[data-selected="true"]') as HTMLElement
      if (selected) {
        const offset = selected.offsetLeft - container.offsetWidth / 2 + selected.offsetWidth / 2
        container.scrollTo({ left: offset, behavior: 'instant' })
      }
    }
  }, [])

  return (
    <div
      ref={scrollRef}
      className="flex gap-1 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4"
    >
      {days.map((day) => {
        const isSelected = day.date === selectedDate
        const ind = indicators?.get(day.date)

        return (
          <button
            key={day.date}
            data-selected={isSelected}
            onClick={() => onSelectDate(day.date)}
            className={cn(
              'snap-center flex flex-col items-center gap-0.5 min-w-[52px] py-2 px-1.5 rounded-xl transition-colors shrink-0',
              isSelected
                ? 'bg-accent text-white'
                : 'bg-surface border border-border text-text-primary hover:bg-surface-hover'
            )}
          >
            <span className={cn(
              'text-[10px] font-medium uppercase tracking-wide',
              isSelected ? 'text-white/80' : 'text-text-tertiary'
            )}>
              {day.dayName}
            </span>
            <span className={cn(
              'text-base font-semibold',
              isSelected ? 'text-white' : 'text-text-primary'
            )}>
              {day.dayNum}
            </span>

            {/* Indicator dots */}
            <div className="flex gap-0.5 h-1.5">
              {day.isToday && !ind?.food && !ind?.workout && (
                <div className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  isSelected ? 'bg-white/60' : 'bg-accent'
                )} />
              )}
              {ind?.food && (
                <div className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  isSelected ? 'bg-white' : 'bg-success'
                )} />
              )}
              {ind?.workout && (
                <div className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  isSelected ? 'bg-white' : 'bg-info'
                )} />
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
})
