'use client'

import { useId, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'framer-motion'
import { reducedFade, spring } from '@/lib/motion'
import { cn } from '@/lib/utils'

/** YYYY-MM-DD plus `n` days, computed at local noon so DST never shifts the day. */
export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d + n, 12)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/** The seven dates of the week that contains `iso`; weeks start on Monday (1) unless told Sunday (0). */
export function weekDays(iso: string, weekStartsOn: 0 | 1 = 1): string[] {
  const [y, m, d] = iso.split('-').map(Number)
  const back = (new Date(y, m - 1, d, 12).getDay() - weekStartsOn + 7) % 7
  return Array.from({ length: 7 }, (_, i) => addDays(iso, i - back))
}

const local = (iso: string) => new Date(`${iso}T12:00:00`)

interface WeekStripProps {
  selected: string
  today: string
  onSelect: (iso: string) => void
  /** Days with something logged: a small ink dot under the date. */
  marked?: ReadonlySet<string>
  /** Read out after a marked day, e.g. "food logged". */
  markLabel?: string
  /** Optional: future days with something scheduled get a muted dot. Unset, the strip looks as before. */
  planned?: ReadonlySet<string>
  weekStartsOn?: 0 | 1
  className?: string
}

/**
 * Week strip for main tabs (Q11, Q19, Q26): a tick ruler with an orange marker over today, then seven days.
 * The selected day sits in a lifted white capsule that glides between days. Swipe the days to change week;
 * the month sheet is the non-drag way to reach other weeks.
 */
export function WeekStrip({ selected, today, onSelect, marked, markLabel = 'logged', planned, weekStartsOn = 1, className }: WeekStripProps) {
  const reduce = useReducedMotion()
  const capsule = useId()
  const days = weekDays(selected, weekStartsOn)
  const [dir, setDir] = useState(0)
  const dragged = useRef(false)

  const shiftWeek = (step: 1 | -1) => {
    setDir(step)
    onSelect(addDays(selected, step * 7))
  }
  const onDragEnd = (_: unknown, info: PanInfo) => {
    const swing = info.offset.x + info.velocity.x * 0.2
    if (Math.abs(swing) > 56) shiftWeek(swing < 0 ? 1 : -1)
    // Let the click that ends a drag fall through without selecting a day.
    setTimeout(() => { dragged.current = false }, 0)
  }

  return (
    // Clip sideways so a drag past the edge never widens the page (mobile browsers zoom out to fit it).
    <div data-no-swipe-back className={cn('-mx-gutter select-none overflow-x-clip px-gutter', className)}>
      <motion.div
        drag={reduce ? false : 'x'}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        dragSnapToOrigin
        dragTransition={{ bounceStiffness: 300, bounceDamping: 35 }}
        onDragStart={() => { dragged.current = true }}
        onDragEnd={onDragEnd}
        className="grid touch-pan-y"
      >
        <AnimatePresence initial={false} custom={dir}>
          <motion.div
            key={days[0]}
            custom={dir}
            style={{ gridArea: '1 / 1' }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0, transition: reducedFade } : { opacity: 0, x: dir * -24, transition: { opacity: { duration: 0.12 }, x: spring.glide } }}
            transition={reduce ? reducedFade : { opacity: { duration: 0.18 }, x: spring.glide }}
          >
            <div className="grid grid-cols-7">
            {days.map((iso) => {
              const date = local(iso)
              const isSelected = iso === selected
              const isMarked = marked?.has(iso) ?? false
              const future = iso > today
              const isPlanned = !isMarked && future && (planned?.has(iso) ?? false)
              const label = `${date.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}${iso === today ? ', today' : ''}${isMarked ? `, ${markLabel}` : ''}${isPlanned ? ', planned' : ''}`
              return (
                <button
                  key={iso}
                  type="button"
                  aria-label={label}
                  aria-pressed={isSelected}
                  aria-current={iso === today ? 'date' : undefined}
                  onClick={() => { if (!dragged.current) { setDir(0); onSelect(iso) } }}
                  className="relative flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-[18px] transition-transform active:scale-[.96]"
                >
                  {/* The selected day is a navy capsule (our 20 Oct build); today, when not selected, a quiet outline. */}
                  {isSelected ? (
                    <motion.span
                      layoutId={capsule}
                      transition={reduce ? reducedFade : spring.glide}
                      className="absolute inset-x-[3px] inset-y-0 rounded-[16px] bg-ink"
                    />
                  ) : iso === today ? (
                    <span aria-hidden="true" className="absolute inset-x-[3px] inset-y-0 rounded-[16px] border border-ink-16" />
                  ) : null}
                  <span className={cn('relative text-[11px] font-semibold uppercase tracking-[1px]', isSelected ? 'text-cream-60' : 'text-ink-62')}>
                    {date.toLocaleDateString('en-AU', { weekday: 'short' }).slice(0, 3)}
                  </span>
                  <span className={cn('relative text-[17px] leading-none tabular-nums', isSelected ? 'text-cream' : future ? 'text-ink-65' : 'text-ink', iso === today || isSelected ? 'font-bold' : 'font-semibold')}>
                    {date.getDate()}
                  </span>
                  {/* Logged days get one small dot; planned future days (when passed) a muted one. */}
                  <span className={cn('relative mt-1 size-[5px] rounded-full', isMarked ? (isSelected ? 'bg-cream' : 'bg-ink') : isPlanned ? 'bg-ink-35' : 'bg-transparent')} aria-hidden="true" />
                </button>
              )
            })}
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
