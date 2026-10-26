'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

import { CARD, HueDot } from '@/components/plans/spatial-parts'
import { haptic } from '@/lib/platform/app'
import { spring } from '@/lib/motion'
import { cn } from '@/lib/utils'

import type { DayTargets } from './apply-targets'
import { useDrawn } from './parts'

const fmt = (n: number) => Math.round(n).toLocaleString('en-AU')

/** The track runs to 125% of target so the target is a tick at 80% and over or under reads against it (as the stat meters). */
const SPAN = 1.25

/** Calorie ring, 112 pt, orange. The arc follows the target it is read against. */
function Ring({ fraction, children }: { fraction: number; children: ReactNode }) {
  const drawn = useDrawn()
  const stroke = 9
  const r = 50 - stroke / 2
  const c = 2 * Math.PI * r
  const f = Math.min(1, Math.max(0, fraction))
  const offset = f >= 1 ? 0 : Math.min(c, c * (1 - f) + stroke)
  return (
    <span className="relative block size-ring shrink-0">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-ink-06)" strokeWidth={stroke} />
        <circle
          cx="50" cy="50" r={r} fill="none" stroke="var(--color-accent)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={drawn ? offset : c}
          style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(.22,1,.36,1)', opacity: f > 0 ? 1 : 0 }}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">{children}</span>
    </span>
  )
}

function MacroBar({ label, macro, eaten, target, was }: { label: string; macro: 'protein' | 'carbs' | 'fat'; eaten: number; target: number; was: number | null }) {
  const drawn = useDrawn()
  const fill = target > 0 ? Math.min(SPAN, eaten / target) / SPAN : 0
  return (
    <div className="mt-3">
      <div className="flex items-baseline justify-between gap-2 text-caption">
        <span className="flex items-center gap-1.5 font-semibold text-ink"><HueDot macro={macro} />{label}</span>
        <span className="text-ink-65 tabular-nums">
          <b className="font-bold text-ink">{fmt(eaten)}</b> of {fmt(target)} g
          {was !== null && was !== target ? <> <s className="decoration-[1.5px]" aria-label={`was ${fmt(was)} g`}>{fmt(was)}</s></> : null}
        </span>
      </div>
      <span aria-hidden="true" className="relative mt-1.5 block h-[5px] rounded-full bg-ink-06">
        <span className="absolute inset-0 overflow-hidden rounded-full">
          <span
            className="absolute inset-0 origin-left rounded-full transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)]"
            style={{ background: `var(--color-${macro === 'protein' ? 'ink' : macro === 'carbs' ? 'macro-teal' : 'macro-ochre'})`, transform: `scaleX(${drawn ? fill : 0})` }}
          />
        </span>
        <span className="absolute -top-[2px] h-[9px] w-[1.5px] rounded-full bg-ink" style={{ left: `${100 / SPAN}%` }} />
      </span>
    </div>
  )
}

export interface TodayPreviewProps {
  current: DayTargets
  /** The targets Apply would write (or wrote); null when nothing changes. */
  next: DayTargets | null
  eaten: { calories: number; protein: number; carbs: number; fat: number }
  showNew: boolean
  onShowNew?: (showNew: boolean) => void
  /** After Apply: no toggle, the new targets settle in. */
  settled?: boolean
}

/**
 * A3 Today preview: the change as its effect on today. The ring and macro bars switch between the current and the new
 * targets, so "less" reads as "885 left instead of 1,060". Carbs and fat are shown because Apply rewrites them too.
 */
export function TodayPreview({ current, next, eaten, showNew, onShowNew, settled }: TodayPreviewProps) {
  const reduce = useReducedMotion()
  const isNew = !!next && (showNew || !!settled)
  const t = isNew && next ? next : current
  const left = t.calories - eaten.calories
  return (
    <section className={cn(CARD, 'p-4')} aria-label={`Today with ${isNew ? 'new' : 'current'} targets`}>
      {next && !settled ? (
        <div role="group" aria-label="Show today with" className="relative grid grid-cols-2 rounded-[24px] bg-ink-06 p-[3px]">
          <motion.span
            aria-hidden="true"
            className="absolute left-[3px] top-[3px] h-11 w-[calc(50%-3px)] rounded-[22px] bg-[var(--surface-card)] shadow-[0_2px_8px_-4px_rgba(17,28,53,.25)]"
            initial={false}
            animate={{ x: showNew ? '100%' : '0%' }}
            transition={reduce ? { duration: 0 } : spring.glide}
          />
          {([['Current', false], ['New targets', true]] as const).map(([label, value]) => (
            <button
              key={label}
              type="button"
              aria-pressed={showNew === value}
              onClick={() => { if (showNew !== value) { void haptic('selection'); onShowNew?.(value) } }}
              className={`relative z-[1] min-h-11 rounded-[22px] text-body-sm font-semibold transition-colors duration-200 ${showNew === value ? 'text-ink' : 'text-ink-65'}`}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
      <div className={cn('grid grid-cols-[112px_1fr] items-center gap-3.5', next && !settled && 'mt-3.5')}>
        <Ring fraction={t.calories > 0 ? eaten.calories / t.calories : 0}>
          <b className="font-display text-[20px] font-[750] leading-none tracking-[-0.015em] text-ink tabular-nums">{fmt(Math.abs(left))}</b>
          <span className="mt-0.5 text-caption text-ink-65">{left < 0 ? 'kcal over' : 'kcal left'}</span>
        </Ring>
        <div className="min-w-0">
          <p className="text-caption text-ink-65">Eaten so far</p>
          <p className="font-display text-[20px] font-[750] tracking-[-0.015em] text-ink tabular-nums">{fmt(eaten.calories)}<span className="text-caption font-semibold tracking-normal text-ink-65"> kcal</span></p>
          <p className="mt-1.5 text-caption text-ink-65 tabular-nums">of {fmt(t.calories)}{isNew && t.calories !== current.calories ? `, was ${fmt(current.calories)}` : ''}</p>
        </div>
      </div>
      <MacroBar label="Protein" macro="protein" eaten={eaten.protein} target={t.protein} was={isNew ? current.protein : null} />
      <MacroBar label="Carbs" macro="carbs" eaten={eaten.carbs} target={t.carbs} was={isNew ? current.carbs : null} />
      <MacroBar label="Fat" macro="fat" eaten={eaten.fat} target={t.fat} was={isNew ? current.fat : null} />
    </section>
  )
}
