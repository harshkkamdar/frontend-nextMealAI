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

/** The seven dates of the week that contains `iso`; weeks start on Sunday (0) or Monday (1). */
export function weekDays(iso: string, weekStartsOn: 0 | 1 = 0): string[] {
  const [y, m, d] = iso.split('-').map(Number)
  const back = (new Date(y, m - 1, d, 12).getDay() - weekStartsOn + 7) % 7
  return Array.from({ length: 7 }, (_, i) => addDays(iso, i - back))
}

const local = (iso: string) => new Date(`${iso}T12:00:00`)

interface WeekStripProps {
  selected: string
  today: string
  onSelect: (iso: string) => void
  /** Days with something logged: ink check badge. */
  marked?: ReadonlySet<string>
  /** Read out after a marked day, e.g. "food logged". */
  markLabel?: string
  weekStartsOn?: 0 | 1
  className?: string
}

/**
 * Week strip for main tabs (Q11, Q19, Q26): a tick ruler with an orange marker over today, then seven days.
 * The selected day sits in a lifted white capsule that glides between days. Swipe the days to change week;
 * the month sheet is the non-drag way to reach other weeks.
 */
export function WeekStrip({ selected, today, onSelect, marked, markLabel = 'logged', weekStartsOn = 0, className }: WeekStripProps) {
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
    <div className={cn('select-none', className)}>
      <div aria-hidden="true" className="grid h-3 grid-cols-7 items-end">
        {days.map((iso) => (
          <span key={iso} className="flex justify-center">
            {iso === today
              ? <svg viewBox="0 0 10 7" className="h-[7px] w-[10px] text-accent"><path d="M0 0h10L5 7Z" fill="currentColor" /></svg>
              : <span className="h-[6px] w-px bg-ink-20" />}
          </span>
        ))}
      </div>
      <motion.div
        drag={reduce ? false : 'x'}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        dragSnapToOrigin
        dragTransition={{ bounceStiffness: 300, bounceDamping: 35 }}
        onDragStart={() => { dragged.current = true }}
        onDragEnd={onDragEnd}
        className="mt-1.5 grid touch-pan-y"
      >
        <AnimatePresence initial={false} custom={dir}>
          <motion.div
            key={days[0]}
            custom={dir}
            className="grid grid-cols-7"
            style={{ gridArea: '1 / 1' }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0, transition: reducedFade } : { opacity: 0, x: dir * -24, transition: { opacity: { duration: 0.12 }, x: spring.glide } }}
            transition={reduce ? reducedFade : { opacity: { duration: 0.18 }, x: spring.glide }}
          >
            {days.map((iso) => {
              const date = local(iso)
              const isSelected = iso === selected
              const isMarked = marked?.has(iso) ?? false
              const future = iso > today
              const label = `${date.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}${iso === today ? ', today' : ''}${isMarked ? `, ${markLabel}` : ''}`
              return (
                <button
                  key={iso}
                  type="button"
                  aria-label={label}
                  aria-pressed={isSelected}
                  aria-current={iso === today ? 'date' : undefined}
                  onClick={() => { if (!dragged.current) { setDir(0); onSelect(iso) } }}
                  className="relative flex min-h-[84px] flex-col items-center justify-center gap-1 rounded-[18px] transition-transform active:scale-[.96]"
                >
                  {isSelected ? (
                    <motion.span
                      layoutId={capsule}
                      transition={reduce ? reducedFade : spring.glide}
                      className="absolute inset-x-[3px] inset-y-0 rounded-[18px] bg-card shadow-[var(--shadow-card)]"
                    />
                  ) : null}
                  <span className="relative text-[12px] font-semibold text-ink-65">
                    {date.toLocaleDateString('en-AU', { weekday: 'narrow' })}
                  </span>
                  <span className={cn('relative text-[17px] leading-none text-ink tabular-nums', iso === today ? 'font-bold' : 'font-semibold')}>
                    {date.getDate()}
                  </span>
                  <span className="relative mt-1 grid size-[18px] place-items-center" aria-hidden="true">
                    {isMarked ? (
                      <span className="grid size-[18px] place-items-center rounded-full bg-ink text-cream">
                        <svg viewBox="0 0 12 12" className="size-[10px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m2.5 6.2 2.3 2.3 4.7-5" /></svg>
                      </span>
                    ) : (
                      <span className={cn('size-[16px] rounded-full border-[1.5px] border-ink-20', future && 'border-dashed')} />
                    )}
                  </span>
                </button>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
