'use client'

import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import { DRAW_MS } from '@/lib/motion'
import { usePressTilt } from '@/components/ui/fiqr/press-tilt'
import { cn } from '@/lib/utils'
import { summaryCopy, type DayKind } from './diary-logic'

const CARD = 'rounded-card card-glass'
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

/**
 * Text that crossfades when it changes (old out over 120 ms, new in over 180 ms, overlapping), never a hard swap.
 * `children` (optional) is the styled form of `text`; `text` keys the crossfade.
 */
export function FadeText({ text, children }: { text: string; children?: ReactNode }) {
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
          {children ?? text}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

/** The calorie ring (Spatial size 112): ink track, orange arc for eaten against target, drawn once on first paint. */
function CalorieRing({ fraction, animateIn, children }: { fraction: number; animateIn: boolean; children: ReactNode }) {
  const reduce = useReducedMotion()
  return (
    <div className="relative size-ring shrink-0">
      <svg viewBox="0 0 112 112" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="56" cy="56" r="47" fill="none" stroke="var(--color-ink-06)" strokeWidth="9" />
        <motion.circle
          cx="56" cy="56" r="47" fill="none" stroke="var(--color-accent)" strokeWidth="9" strokeLinecap="round"
          initial={animateIn && !reduce ? { pathLength: 0 } : false}
          animate={{ pathLength: fraction, opacity: fraction > 0 ? 1 : 0 }}
          transition={{ duration: reduce ? 0 : DRAW_MS / 1000, ease: [0.22, 1, 0.36, 1], delay: animateIn ? 0.12 : 0 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center">{children}</div>
    </div>
  )
}

interface MacroValue { label: string; current: number; target: number; color: string }

/** Label, grams over target, and a 10-step dash meter in the macro's hue (Q17: steps, not bars). */
function Macro({ macro }: { macro: MacroValue }) {
  const steps = macro.target > 0 ? Math.min(10, Math.round((macro.current / macro.target) * 10)) : 0
  return (
    <li className="min-w-0">
      <p className="truncate text-caption text-ink-65 tabular-nums">
        {macro.label} <span className="font-bold text-ink">{fmt(macro.current)}</span>
        <span className="text-label font-medium">{macro.target > 0 ? ` / ${fmt(macro.target)}` : ''} g</span>
      </p>
      <span className="mt-1.5 flex gap-[3px]" aria-hidden="true">
        {Array.from({ length: 10 }, (_, index) => (
          <span key={index} className="relative h-[6px] flex-1 rounded-full bg-ink-06">
            {/* Filled layer fades, so a day change re-fills the steps without animating colour. */}
            <span
              className="absolute inset-0 rounded-full transition-opacity duration-200"
              style={{ background: macro.color, opacity: index < steps ? 1 : 0, transitionDelay: `${index * 15}ms` }}
            />
          </span>
        ))}
      </span>
    </li>
  )
}

interface DayHeroProps {
  calories: { current: number; target: number }
  macros: { protein: [number, number]; carbs: [number, number]; fat: [number, number] }
  kind: DayKind
  /** Any food logged on the day (an empty past day says so instead of "0 under"). */
  logged: boolean
  /** "Thu 22 Oct", for the empty-day line. */
  dayLabel: string
  /** First paint of the session: count from 0 and draw the ring (Q23). Later the numbers roll from the last value. */
  animateIn: boolean
}

/** The day summary (journey-food A1 Ring): the ring answers "how much is left", the macros sit beside it. */
export function DayHero({ calories, macros, kind, logged, dayLabel, animateIn }: DayHeroProps) {
  const tilt = usePressTilt<HTMLElement>()
  const copy = summaryCopy({ eaten: calories.current, target: calories.target, kind, logged, dayLabel })
  const list: MacroValue[] = [
    { label: 'Protein', current: macros.protein[0], target: macros.protein[1], color: 'var(--color-ink)' },
    { label: 'Carbs', current: macros.carbs[0], target: macros.carbs[1], color: 'var(--color-macro-teal)' },
    { label: 'Fat', current: macros.fat[0], target: macros.fat[1], color: 'var(--color-macro-ochre)' },
  ]
  const fraction = calories.target > 0 ? Math.min(1, calories.current / calories.target) : 0
  return (
    <section {...tilt} className={cn(CARD, 'p-4')} aria-label="Day total">
      <div className="flex items-center gap-4">
        <CalorieRing fraction={fraction} animateIn={animateIn}>
          <span className={`font-display leading-none text-ink tabular-nums ${copy.value >= 10000 ? 'text-[19px]' : 'text-hero'}`}>
            <CountUp value={copy.value} from={animateIn ? 0 : copy.value} />
          </span>
          <span className="mt-1 text-label text-ink-65"><FadeText text={copy.unit} /></span>
        </CalorieRing>
        <ul className="grid min-w-0 flex-1 gap-3">
          {list.map((macro) => <Macro key={macro.label} macro={macro} />)}
        </ul>
      </div>
      <p className="mt-3 text-caption text-ink-65 tabular-nums">
        <FadeText text={`${copy.strong ?? ''}${copy.rest}`}>
          {copy.strong ? <span className="font-semibold text-ink">{copy.strong}</span> : null}{copy.rest}
        </FadeText>
      </p>
    </section>
  )
}

/** Loading: flat grey shapes at the real sizes inside the real cards, pulsing only after 600 ms (motion-feel 3h). */
export function DaySkeleton() {
  const bar = (className: string) => <span className={cn('block rounded-full bg-ink-06', className)} />
  return (
    <motion.div
      className="mt-5 space-y-4"
      role="status"
      aria-busy="true"
      aria-label="Loading this day"
      animate={{ opacity: [1, 0.6, 1] }}
      transition={{ duration: 1.2, repeat: Infinity, delay: 0.6, ease: 'easeInOut' }}
    >
      <div className={cn(CARD, 'p-4')}>
        <div className="flex items-center gap-4">
          <span className="block size-ring shrink-0 rounded-full border-[9px] border-ink-06" />
          <div className="flex flex-1 flex-col gap-4">
            {[0, 1, 2].map((i) => <div key={i} className="space-y-2">{bar('h-3 w-3/5')}{bar('h-1.5 w-full')}</div>)}
          </div>
        </div>
        {bar('mt-4 h-3 w-2/5')}
      </div>
      {[0, 1, 2].map((index) => (
        <div key={index}>
          <div className="mb-1 flex min-h-11 items-center pl-1">{bar('h-4 w-24')}</div>
          <div className={cn(CARD, 'flex items-center gap-3.5 px-4 py-3')}>
            <span className="block size-12 shrink-0 rounded-[14px] bg-ink-06" />
            <div className="flex-1 space-y-2">{bar('h-3.5 w-3/4')}{bar('h-3 w-1/2')}</div>
          </div>
        </div>
      ))}
    </motion.div>
  )
}
