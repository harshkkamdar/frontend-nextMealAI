'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useCountUp } from '@/lib/use-count-up'
import { DRAW_MS } from '@/lib/motion'
import { cn } from '@/lib/utils'

/** Each bento is decorative (the slide's title and line carry the meaning), so it is hidden from screen readers.
 *  `live` turns true the first time the slide is in view and stays true: values fill once, then hold. */
type BentoProps = { live: boolean; active: boolean }

function Card({ className, children, style }: { className?: string; children: ReactNode; style?: CSSProperties }) {
  return <div className={cn('rounded-[var(--radius-bento)] bg-card p-4 shadow-[var(--shadow-card)]', className)} style={style}>{children}</div>
}

const fill = (live: boolean, delay = 0): CSSProperties => ({ transform: `scaleX(${live ? 1 : 0})`, transition: `transform 900ms cubic-bezier(.22,1,.36,1) ${delay}ms` })

export function FoodBento({ live }: BentoProps) {
  const kcal = useCountUp(live ? 1240 : null)
  const r = 38
  const c = 2 * Math.PI * r
  const macros = [
    { label: 'Protein', g: 96, of: 140, color: 'var(--color-ink)' },
    { label: 'Carbs', g: 128, of: 190, color: 'var(--color-macro-teal)' },
    { label: 'Fat', g: 41, of: 65, color: 'var(--color-macro-ochre)' },
  ]
  const rows = [['Oats with berries', 380], ['Chicken rice bowl', 612], ['Greek yogurt', 148]] as const
  return (
    <div aria-hidden="true" className="grid grid-cols-2 gap-3">
      <Card className="col-span-2 flex items-center gap-4">
        <div className="relative size-[96px] shrink-0">
          <svg viewBox="0 0 96 96" className="size-full -rotate-90">
            <circle cx="48" cy="48" r={r} fill="none" stroke="var(--color-ink)" strokeOpacity=".07" strokeWidth="10" />
            <circle cx="48" cy="48" r={r} fill="none" stroke="var(--color-accent)" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={live ? c * (1 - 1240 / 1950) : c} style={{ transition: 'stroke-dashoffset 1100ms cubic-bezier(.22,1,.36,1)' }} />
          </svg>
          <div className="absolute inset-0 grid place-content-center text-center">
            <span className="font-wide text-[19px] font-bold leading-none tabular-nums text-ink">{kcal.toLocaleString('en-AU')}</span>
            <span className="mt-0.5 text-[11px] font-medium text-ink-65">of 1,950</span>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          {macros.map((m, i) => (
            <div key={m.label}>
              <div className="flex justify-between text-[12.5px] font-semibold text-ink"><span>{m.label}</span><span className="tabular-nums text-ink-65">{m.g} g</span></div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-06">
                <div className="h-full origin-left rounded-full" style={{ width: `${(m.g / m.of) * 100}%`, background: m.color, ...fill(live, 150 + i * 90) }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="relative flex flex-col items-center justify-center pb-3 pt-5">
        <div className="relative size-[86px]">
          {['left-0 top-0 border-l-[3px] border-t-[3px] rounded-tl-[10px]', 'right-0 top-0 border-r-[3px] border-t-[3px] rounded-tr-[10px]', 'bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-[10px]', 'bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-[10px]'].map((k) => <span key={k} className={cn('absolute size-4 border-ink', k)} />)}
          {/* A rice bowl from above: rice, sliced chicken and greens in three sections. */}
          <svg viewBox="0 0 64 64" className="absolute inset-3" fill="none" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="32" cy="32" r="28" strokeOpacity=".2" />
            <circle cx="32" cy="32" r="22" />
            <path d="M32 10v22l19 11M32 32L13 43" strokeOpacity=".35" />
            <path d="M20 22h3M24 17h3M17 28h3M24 26h3M27 21h2" strokeWidth="2.4" />
            <path d="M37 18l8 4M38 23l9 4M38 28l8 4" strokeWidth="3.2" strokeOpacity=".85" />
            <path d="M26 46c2-6 8-7 11-3-3 5-8 6-11 3zM26 46l9-4" />
          </svg>
          <span className="absolute inset-x-1 top-1/2 h-[2px] rounded-full bg-accent/70" style={{ transform: `translateY(${live ? 30 : -30}px)`, opacity: live ? 0 : 1, transition: 'transform 1100ms ease-in-out 200ms, opacity 200ms linear 1250ms' }} />
        </div>
        <p className="mt-3 text-[13px] font-semibold text-ink">Chicken rice bowl</p>
        <p className="text-[12px] font-medium tabular-nums text-ink-65">612 kcal</p>
      </Card>
      <Card className="flex flex-col justify-center gap-2.5">
        {rows.map(([name, k], i) => (
          <div key={name} className="flex items-baseline justify-between gap-2" style={{ opacity: live ? 1 : 0, transform: `translateY(${live ? 0 : 8}px)`, transition: `opacity 400ms ${300 + i * 160}ms, transform 500ms cubic-bezier(.22,1,.36,1) ${300 + i * 160}ms` }}>
            <span className="truncate text-[12.5px] font-semibold text-ink">{name}</span>
            <span className="shrink-0 text-[12px] font-medium tabular-nums text-ink-65">{k}</span>
          </div>
        ))}
      </Card>
    </div>
  )
}

/** mm:ss on one tile per digit; leading zeros dimmed. */
function DigitTiles({ seconds }: { seconds: number }) {
  const text = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
  const firstSignificant = text.search(/[1-9]/)
  return (
    <div className="flex items-center gap-1">
      {text.split('').map((ch, i) => ch === ':' ? (
        <span key={i} className="px-0.5 text-[22px] font-bold text-ink-35">:</span>
      ) : (
        // Each tile rolls its digit up when it changes, like a split-flap clock, so the tick is motion, not a jump.
        <span key={i} className={cn('font-wide relative grid h-11 w-[34px] place-items-center overflow-hidden rounded-[10px] bg-ink-04 text-[26px] font-bold tabular-nums', firstSignificant !== -1 && i < firstSignificant ? 'text-ink-20' : 'text-ink')}>
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span key={ch} initial={{ y: '-70%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '70%', opacity: 0 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>{ch}</motion.span>
          </AnimatePresence>
        </span>
      ))}
    </div>
  )
}

export function TrainBento({ live, active }: BentoProps) {
  const [left, setLeft] = useState(90)
  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setLeft((s) => (s <= 1 ? 90 : s - 1)), 1000)
    return () => window.clearInterval(id)
  }, [active])
  const week = [0.55, 0, 0.8, 0.45, 0, 0.95, 0.3]
  return (
    <div aria-hidden="true" className="grid grid-cols-2 gap-3">
      <Card className="col-span-2">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-ink">Rest</span>
          <span className="text-[12px] font-medium text-ink-65">Set 3 of 4 next</span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <DigitTiles seconds={left} />
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-06">
            <div className="h-full origin-left rounded-full bg-accent" style={{ transform: `scaleX(${left / 90})`, transition: 'transform 1000ms linear' }} />
          </div>
        </div>
      </Card>
      <Card>
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-ink-06">
            <svg viewBox="0 0 24 24" className="size-5 text-ink" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10" /></svg>
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-ink">Bench press</p>
            <p className="text-[12px] font-medium tabular-nums text-ink-65">60 kg × 8</p>
          </div>
        </div>
        <div className="mt-3.5 grid grid-cols-4 gap-1">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="h-1.5 overflow-hidden rounded-full bg-ink-06">
              <span className="block h-full origin-left rounded-full bg-ink" style={{ transform: `scaleX(${i < 2 || (i === 2 && live) ? 1 : 0})`, transition: `transform 700ms cubic-bezier(.22,1,.36,1) ${i === 2 ? 500 : 0}ms` }} />
            </span>
          ))}
        </div>
      </Card>
      <Card className="flex flex-col">
        <span className="text-[13px] font-semibold text-ink">This week</span>
        <div className="mt-2 flex flex-1 items-end gap-1.5">
          {week.map((v, i) => (
            <span key={i} className={cn('flex-1 origin-bottom rounded-full', i === 5 ? 'bg-ink' : 'bg-ink-20')} style={{ height: `${Math.max(v, 0.08) * 44}px`, transform: `scaleY(${live ? 1 : 0.1})`, transition: `transform 700ms cubic-bezier(.22,1,.36,1) ${120 + i * 60}ms` }} />
          ))}
        </div>
      </Card>
    </div>
  )
}

export function GeoBento({ live }: BentoProps) {
  // 0 nothing, 1 question, 2 Geo typing, 3 reply. Plays once, the first time the slide is seen.
  const [stage, setStage] = useState(0)
  useEffect(() => {
    if (!live) return
    const timers = [window.setTimeout(() => setStage(1), 150), window.setTimeout(() => setStage(2), 700), window.setTimeout(() => setStage(3), 1700)]
    return () => timers.forEach(window.clearTimeout)
  }, [live])
  const show = (on: boolean): CSSProperties => ({ opacity: on ? 1 : 0, transform: `translateY(${on ? 0 : 10}px)`, transition: 'opacity 300ms, transform 450ms cubic-bezier(.22,1,.36,1)' })
  return (
    <div aria-hidden="true">
      <Card className="flex flex-col gap-3 p-4">
        <p className="ml-auto max-w-[82%] rounded-[18px] rounded-br-[6px] bg-ink px-3.5 py-2.5 text-[14px] leading-[1.4] text-cream" style={show(stage >= 1)}>
          Hit my protein with what&apos;s in my fridge? Eggs, yogurt, tuna, rice.
        </p>
        {/* Typing dots and the reply share one grid cell, so the card never changes height mid-sequence. */}
        <div className="grid">
          <span className="col-start-1 row-start-1 flex h-fit w-fit gap-1 rounded-[18px] rounded-bl-[6px] bg-ink-06 px-3.5 py-3" style={{ opacity: stage === 2 ? 1 : 0, transition: 'opacity 200ms' }}>
            {[0, 1, 2].map((i) => <span key={i} className="size-1.5 rounded-full bg-ink-65 motion-safe:animate-bounce" style={{ animationDelay: `${i * 120}ms` }} />)}
          </span>
          <div className="col-start-1 row-start-1 max-w-[88%]" style={show(stage >= 3)}>
            <p className="text-[14px] leading-[1.4] text-ink">A tuna rice bowl with a yogurt dressing gets you most of the way.</p>
            <div className="mt-2.5 overflow-hidden rounded-[14px] outline outline-1 -outline-offset-1 outline-ink-08">
              {[['Tuna rice bowl', '42 g protein'], ['Greek yogurt, 150 g', '15 g protein']].map(([name, p]) => (
                <div key={name} className="flex items-center justify-between border-t border-ink-06 px-3 py-2.5 first:border-t-0">
                  <span className="text-[13px] font-semibold text-ink">{name}</span>
                  <span className="text-[12px] font-medium tabular-nums text-ink-65">{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export function CheckInBento({ live }: BentoProps) {
  const reduce = useReducedMotion()
  const calories = useCountUp(live ? 1900 : null)
  const pts = [[8, 18], [52, 24], [96, 20], [140, 34], [184, 32], [228, 44], [272, 50]] as const
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')
  return (
    <div aria-hidden="true" className="grid grid-cols-2 gap-3">
      <Card className="col-span-2">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] font-semibold text-ink">Weight</span>
          <span className="font-wide text-[17px] font-bold tabular-nums text-ink">-0.6 kg</span>
        </div>
        <svg viewBox="0 0 280 62" className="mt-2 block w-full overflow-visible">
          <motion.path d={d} fill="none" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: live ? 1 : 0 }} transition={{ duration: reduce ? 0 : (DRAW_MS * 1.3) / 1000, ease: [0.22, 1, 0.36, 1] }} />
          <circle cx={272} cy={50} r="5" fill="var(--color-ink)" style={{ opacity: live ? 1 : 0, transition: `opacity 200ms ${reduce ? 0 : DRAW_MS * 1.2}ms` }} />
        </svg>
        <p className="mt-1 text-[12px] font-medium text-ink-65">7-day average, this week</p>
      </Card>
      <Card>
        <span className="text-[13px] font-semibold text-ink">Calories</span>
        <p className="mt-2 text-[12.5px] font-medium tabular-nums text-ink-65 line-through decoration-ink-35">1,950</p>
        <p className="font-wide text-[24px] font-bold leading-tight tabular-nums text-ink">{calories.toLocaleString('en-AU')}</p>
        <p className="text-[12px] font-medium text-ink-65">from next week</p>
      </Card>
      <Card>
        <span className="text-[13px] font-semibold text-ink">Workouts</span>
        <p className="font-wide mt-2 text-[24px] font-bold leading-tight tabular-nums text-ink">4 of 4</p>
        <div className="mt-2.5 grid grid-cols-4 gap-1">
          {[0, 1, 2, 3].map((i) => <span key={i} className="h-5 origin-bottom rounded-full bg-ink" style={{ transform: `scaleY(${live ? 1 : 0.15})`, opacity: live ? 1 : 0.2, transition: `transform 500ms cubic-bezier(.22,1,.36,1) ${200 + i * 110}ms, opacity 300ms ${200 + i * 110}ms` }} />)}
        </div>
      </Card>
    </div>
  )
}
