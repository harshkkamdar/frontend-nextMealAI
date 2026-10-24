'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { DRAW_MS, reducedFade, spring } from '@/lib/motion'

const W = 320
const H = 168
const X0 = 28
const X1 = 292
const TOP = 34
const BOTTOM = 124

/** Today's weight to the target over `weeks`, drawn in once. A curve that eases off, as real progress does; flat for maintenance. */
export function WeightPath({ fromKg, toKg, weeks, today = new Date() }: { fromKg: number; toKg: number; weeks: number | null; today?: Date }) {
  const reduce = useReducedMotion()
  const flat = fromKg === toKg
  const losing = toKg < fromKg
  const yFrom = flat ? (TOP + BOTTOM) / 2 : losing ? TOP : BOTTOM
  const yTo = flat ? yFrom : losing ? BOTTOM : TOP
  const line = `M${X0} ${yFrom} C ${X0 + 90} ${yFrom + (yTo - yFrom) * 0.75}, ${X1 - 110} ${yTo}, ${X1} ${yTo}`
  const end = new Date(today.getTime() + (weeks ?? 12) * 7 * 86400000).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
  const draw = reduce ? reducedFade : { duration: (DRAW_MS * 1.4) / 1000, ease: [0.22, 1, 0.36, 1] as const, delay: 0.25 }
  const after = reduce ? reducedFade : { ...spring.tap, delay: 0.25 + (DRAW_MS * 1.4) / 1000 - 0.1 }
  const label = `${fromKg.toFixed(1)} kg today to ${toKg.toFixed(1)} kg by ${end}`

  return (
    <figure className="rounded-[var(--radius-card)] bg-card px-3 pb-3 pt-4 outline outline-1 -outline-offset-1 outline-ink-08">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="block w-full overflow-visible">
        {[TOP, (TOP + BOTTOM) / 2, BOTTOM].map((y) => <line key={y} x1={X0} x2={X1} y1={y} y2={y} stroke="var(--color-ink)" strokeOpacity=".07" strokeDasharray="2 4" />)}
        <motion.path
          d={`${line} L ${X1} ${BOTTOM + 14} L ${X0} ${BOTTOM + 14} Z`}
          fill="var(--color-ink)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.05 }}
          transition={reduce ? reducedFade : { duration: 0.6, delay: 0.25 + (DRAW_MS * 1.4) / 1000 - 0.2 }}
        />
        <motion.path d={line} fill="none" stroke="var(--color-ink)" strokeWidth="3" strokeLinecap="round" initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={draw} />
        <circle cx={X0} cy={yFrom} r="5" fill="var(--color-card)" stroke="var(--color-ink)" strokeWidth="2.5" />
        <text x={X0} y={yFrom - 14} className="fill-ink-65 text-[12px] font-semibold tabular-nums">{fromKg.toFixed(1)} kg</text>
        <motion.g initial={{ opacity: 0, scale: reduce ? 1 : 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={after} style={{ transformOrigin: `${X1}px ${yTo}px`, transformBox: 'view-box' }}>
          <circle cx={X1} cy={yTo} r="7" fill="var(--color-ink)" />
          <rect x={X1 - 66} y={yTo + (losing || flat ? -40 : 14)} width="70" height="26" rx="13" fill="var(--color-ink)" />
          <text x={X1 - 31} y={yTo + (losing || flat ? -22 : 32)} textAnchor="middle" className="fill-cream text-[13px] font-bold tabular-nums">{toKg.toFixed(1)} kg</text>
        </motion.g>
        <text x={X0} y={H - 4} className="fill-ink-65 text-[12px] font-medium">Today</text>
        <text x={X1} y={H - 4} textAnchor="end" className="fill-ink-65 text-[12px] font-medium">{flat ? 'Every week' : end}</text>
      </svg>
    </figure>
  )
}
