'use client'

import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MacroBar } from '@/components/ui/fiqr/macro-bar'
import { cn } from '@/lib/utils'
import { summaryCopy, type DayKind } from './diary-logic'

const CARD = 'rounded-card card-glass'

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

/** The day summary: four bars compare today's totals with their targets. */
export function DayHero({ calories, macros, kind, logged, dayLabel }: DayHeroProps) {
  const copy = summaryCopy({ eaten: calories.current, target: calories.target, kind, logged, dayLabel })
  return (
    <section aria-label="Day total">
      <div className="flex flex-col gap-[8px]">
        <MacroBar name="Calories" lead current={calories.current} target={calories.target} />
        <MacroBar name="Protein" unit="g" current={macros.protein[0]} target={macros.protein[1]} />
        <MacroBar name="Carbs" unit="g" current={macros.carbs[0]} target={macros.carbs[1]} />
        <MacroBar name="Fat" unit="g" current={macros.fat[0]} target={macros.fat[1]} />
      </div>
      {logged ? (
        <p className="mt-2.5 text-[13px] text-ink-65 tabular-nums">
          <FadeText text={`${copy.strong ?? ''}${copy.rest}`}>
            {copy.strong ? <span className="font-semibold text-ink">{copy.strong}</span> : null}{copy.rest}
          </FadeText>
        </p>
      ) : null}
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
      <div>
        <div className="flex flex-col gap-[14px]">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="flex flex-col gap-[9px]">
              <span className="flex justify-between">
                <span className="block h-3.5 w-16 rounded-full bg-ink-06" />
                <span className="block h-3 w-28 rounded-full bg-ink-06" />
              </span>
              <span className="block h-[7px] w-full rounded-full bg-ink-06" />
            </span>
          ))}
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
