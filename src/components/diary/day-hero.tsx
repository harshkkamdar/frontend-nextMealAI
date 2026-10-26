'use client'

import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import { DRAW_MS } from '@/lib/motion'
import { cn } from '@/lib/utils'

const CARD = 'rounded-[24px] bg-card shadow-[var(--shadow-card)]'
const fmt = (n: number) => Math.round(n).toLocaleString('en-AU')

/** Rolls from the last shown value to `value` through a motion value (no re-render per frame, motion-feel 3f). */
function CountUp({ value, from }: { value: number; from: number }) {
  const reduce = useReducedMotion()
  const mv = useMotionValue(reduce ? value : from)
  const text = useTransform(mv, fmt)
  useEffect(() => {
    const controls = animate(mv, value, { duration: reduce ? 0 : 0.9, ease: [0.33, 1, 0.68, 1] })
    return () => controls.stop()
  }, [mv, value, reduce])
  return <motion.span>{text}</motion.span>
}

/** Text that crossfades when it changes (old out over 120 ms, new in over 180 ms, overlapping), never a hard swap. */
export function FadeText({ text }: { text: string }) {
  return (
    <span className="inline-grid">
      <AnimatePresence initial={false}>
        <motion.span
          key={text}
          style={{ gridArea: '1 / 1' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.18, ease: 'easeOut' } }}
          exit={{ opacity: 0, transition: { duration: 0.12, ease: 'easeOut' } }}
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

function Ring({ fraction, animateIn }: { fraction: number; animateIn: boolean }) {
  const reduce = useReducedMotion()
  return (
    <svg viewBox="0 0 64 64" className="size-16 shrink-0 -rotate-90" aria-hidden="true">
      <circle cx="32" cy="32" r="27" fill="none" stroke="var(--color-ink-06)" strokeWidth="8" />
      <motion.circle
        cx="32" cy="32" r="27" fill="none" stroke="var(--color-accent)" strokeWidth="8" strokeLinecap="round"
        initial={animateIn && !reduce ? { pathLength: 0, opacity: 0 } : false}
        animate={{ pathLength: fraction, opacity: fraction > 0 ? 1 : 0 }}
        transition={{ pathLength: { duration: reduce ? 0 : DRAW_MS / 1000, ease: [0.22, 1, 0.36, 1], delay: animateIn ? 0.12 : 0 }, opacity: { duration: 0.15 } }}
      />
    </svg>
  )
}

interface MacroValue { label: string; current: number; target: number; color: string }

function Macro({ macro }: { macro: MacroValue }) {
  const steps = macro.target > 0 ? Math.min(10, Math.round((macro.current / macro.target) * 10)) : 0
  return (
    <div className="min-w-0">
      <p className="text-[13px] font-semibold text-ink-65">{macro.label}</p>
      <p className="mt-0.5 truncate text-[14px] font-semibold text-ink tabular-nums">
        {fmt(macro.current)}<span className="font-medium text-ink-65">{macro.target > 0 ? ` / ${fmt(macro.target)}` : ''} g</span>
      </p>
      <span className="mt-2 flex gap-[3px]" aria-hidden="true">
        {Array.from({ length: 10 }, (_, index) => (
          <span key={index} className="relative h-[6px] flex-1 rounded-full bg-ink-06">
            {/* Filled layer fades, so a day change re-fills the dots without animating colour. */}
            <span
              className="absolute inset-0 rounded-full transition-opacity duration-200"
              style={{ background: macro.color, opacity: index < steps ? 1 : 0, transitionDelay: `${index * 15}ms` }}
            />
          </span>
        ))}
      </span>
    </div>
  )
}

interface DayHeroProps {
  calories: { current: number; target: number }
  macros: { protein: [number, number]; carbs: [number, number]; fat: [number, number] }
  /** First paint of the session: count from 0 and draw the ring (Q23). Later the numbers roll from the last value. */
  animateIn: boolean
  footer?: ReactNode
}

/** The day's total: kcal count-up, a small orange ring, and the three macros with targets (Q18, Q26). */
export function DayHero({ calories, macros, animateIn, footer }: DayHeroProps) {
  const { current, target } = calories
  const left = target - current
  const list: MacroValue[] = [
    { label: 'Protein', current: macros.protein[0], target: macros.protein[1], color: 'var(--color-ink)' },
    { label: 'Carbs', current: macros.carbs[0], target: macros.carbs[1], color: 'var(--color-macro-teal)' },
    { label: 'Fat', current: macros.fat[0], target: macros.fat[1], color: 'var(--color-macro-ochre)' },
  ]
  return (
    <section className={cn(CARD, 'p-5')} aria-label="Day total">
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline gap-1.5">
            <span className="font-wide text-[40px] font-[750] leading-none tracking-[-1px] text-ink tabular-nums">
              <CountUp value={current} from={animateIn ? 0 : current} />
            </span>
            <span className="text-[15px] font-semibold text-ink-65">kcal</span>
          </p>
          <p className="mt-1.5 text-[14px] text-ink-65 tabular-nums">
            <FadeText text={target <= 0 ? 'No daily target set' : current <= 0 ? `Nothing logged · target ${fmt(target)}` : left >= 0 ? `${fmt(left)} left of ${fmt(target)}` : `${fmt(-left)} over ${fmt(target)}`} />
          </p>
        </div>
        <Ring fraction={target > 0 ? Math.min(1, current / target) : 0} animateIn={animateIn} />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-4">
        {list.map((macro) => <Macro key={macro.label} macro={macro} />)}
      </div>
      {footer}
    </section>
  )
}

/** Loading: the same boxes as the hero and four meal sections, pulsing only after 600 ms (motion-feel 3h). */
export function DaySkeleton() {
  const block = (className: string) => (
    <motion.div
      className={className}
      animate={{ opacity: [1, 0.6, 1] }}
      transition={{ duration: 1.2, repeat: Infinity, delay: 0.6, ease: 'easeInOut' }}
    />
  )
  return (
    <div className="mt-5 space-y-6" role="status" aria-busy="true" aria-label="Loading this day">
      {block(cn(CARD, 'h-[174px]'))}
      {[0, 1, 2, 3].map((index) => (
        <div key={index}>
          <div className="mb-2 h-11 w-28 rounded-[14px] bg-ink-04" />
          {block('h-16 rounded-[22px] bg-ink-04')}
        </div>
      ))}
    </div>
  )
}
