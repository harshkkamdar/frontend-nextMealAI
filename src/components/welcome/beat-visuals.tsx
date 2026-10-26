'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useCountUp } from '@/lib/use-count-up'
import { DRAW_MS } from '@/lib/motion'
import { cn } from '@/lib/utils'

/**
 * What sits on the welcome stage for each beat (mocks/aurora-onboarding.html). Decorative: the beat's title and line
 * carry the meaning, so each visual is hidden from screen readers. `live` turns true the first time the beat is shown
 * and stays true, so values fill once and then hold; `active` is true while the beat is the settled one.
 */
export type BeatVisualProps = { live: boolean; active: boolean }

const EASE = 'cubic-bezier(.22,1,.36,1)'
const grow = (live: boolean, v: number, delay: number): CSSProperties => ({ transform: `scaleX(${live ? v : 0})`, transition: `transform 900ms ${EASE} ${delay}ms` })
const arrive = (live: boolean, delay: number): CSSProperties => ({ opacity: live ? 1 : 0, transform: `translateY(${live ? 0 : 6}px)`, transition: `opacity 400ms ${delay}ms, transform 500ms ${EASE} ${delay}ms` })

/** A rice bowl from above: rice, sliced chicken and greens. Ink, cream and orange only. */
function Bowl() {
  return (
    <svg viewBox="0 0 120 120" className="size-full drop-shadow-[0_8px_10px_rgba(17,28,53,.18)]">
      <circle cx="60" cy="60" r="54" fill="var(--color-card)" />
      <circle cx="60" cy="60" r="46" fill="var(--color-cream)" stroke="var(--color-ink)" strokeOpacity=".08" />
      {[[40, 44], [48, 37], [36, 56], [46, 52], [54, 46], [42, 66], [52, 60], [58, 34]].map(([x, y]) => <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="3.4" ry="2" fill="var(--color-ink)" fillOpacity=".22" transform={`rotate(${x * 7} ${x} ${y})`} />)}
      {[0, 1, 2].map((i) => <rect key={i} x={66 + i * 3} y={40 + i * 11} width="22" height="8" rx="4" fill="var(--color-accent)" fillOpacity={0.9 - i * 0.15} transform={`rotate(28 ${77 + i * 3} ${44 + i * 11})`} />)}
      <path d="M48 84c6-12 20-14 27-5-7 11-20 13-27 5z" fill="var(--color-macro-teal)" />
    </svg>
  )
}

export function FoodVisual({ live }: BeatVisualProps) {
  const kcal = useCountUp(live ? 612 : null)
  const macros = [
    { label: 'Protein', g: 48, v: 0.72, color: 'var(--color-ink)' },
    { label: 'Carbs', g: 71, v: 0.6, color: 'var(--color-macro-teal)' },
    { label: 'Fat', g: 14, v: 0.3, color: 'var(--color-macro-ochre)' },
  ]
  return (
    <div aria-hidden="true" className="flex h-full flex-col justify-between">
      <div className="flex items-center gap-3.5">
        <span className="size-[68px] shrink-0"><Bowl /></span>
        <div className="min-w-0">
          <p className="text-body-sm font-bold text-ink">Chicken rice bowl</p>
          <p className="font-wide text-[30px] font-[800] leading-none tracking-[-0.02em] tabular-nums text-ink">{kcal}<span className="ml-1 text-caption font-semibold tracking-normal text-ink-65" style={{ fontStretch: '100%' }}>kcal</span></p>
        </div>
      </div>
      <div className="mt-3.5 flex flex-col gap-2">
        {macros.map((m, i) => (
          <div key={m.label}>
            <div className="flex items-baseline justify-between text-label">
              <span className="text-ink">{m.label}</span>
              <span className="tabular-nums text-ink-65">{m.g} g</span>
            </div>
            <span className="mt-1 block h-1 origin-left rounded-full" style={{ background: m.color, ...grow(live, m.v, 500 + i * 90) }} />
          </div>
        ))}
      </div>
      <div className="mt-3.5 flex flex-col gap-1 rounded-[16px] bg-ink-04 px-3 py-2.5">
        <span className="text-label text-ink-65">Today</span>
        {([['Oats with berries', 380], ['Rice bowl', 612], ['Greek yogurt', 148]] as const).map(([name, k], i) => (
          <p key={name} className="flex justify-between text-caption font-semibold text-ink" style={arrive(live, 300 + i * 120)}>
            <span>{name}</span><span className="tabular-nums text-ink-65">{k}</span>
          </p>
        ))}
      </div>
    </div>
  )
}

/** The sample rest is 2:22 long and starts at 1:28 left, so the bar opens about 60% full as in the mock. */
const REST_S = 142

export function TrainVisual({ live, active }: BeatVisualProps) {
  const [left, setLeft] = useState(88)
  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setLeft((s) => (s <= 1 ? 88 : s - 1)), 1000)
    return () => window.clearInterval(id)
  }, [active])
  const week = [0.5, 0.15, 0.8, 0.15, 0.6, 1, 0.15]
  return (
    <div aria-hidden="true" className="flex h-full flex-col justify-between">
      <div>
      <div className="flex justify-between text-caption font-semibold">
        <span className="text-ink">Rest</span>
        <span className="text-ink-65">Set 3 of 4 next</span>
      </div>
      <p className="font-wide mt-2 text-[52px] font-[800] leading-none tracking-[-0.02em] tabular-nums text-ink">
        {String(Math.floor(left / 60)).padStart(2, '0')}<span className="text-ink-35">:</span>{String(left % 60).padStart(2, '0')}
      </p>
      <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-ink-06">
        <span className="block h-full origin-left rounded-full bg-accent" style={{ transform: `scaleX(${left / REST_S})`, transition: 'transform 1000ms linear' }} />
      </span>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-ink-06">
          <svg viewBox="0 0 24 24" className="size-5 text-ink" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10" /></svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-body-sm font-semibold text-ink">Bench press</p>
          <p className="text-caption tabular-nums text-ink-65">60 kg × 8</p>
        </div>
        <span className="flex gap-1">{[0, 1, 2, 3].map((i) => <span key={i} className={cn('h-1.5 w-4 rounded-full', i < 2 ? 'bg-ink' : 'bg-ink-09')} />)}</span>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <span className="text-label text-ink-65">This week</span>
        <span className="flex h-12 items-end gap-2">
          {week.map((h, i) => <span key={i} className={cn('h-12 w-2.5 origin-bottom rounded-full', i === 5 ? 'bg-ink' : 'bg-ink-16')} style={{ transform: `scaleY(${live ? h : 0.1})`, transition: `transform 700ms ${EASE} ${120 + i * 60}ms` }} />)}
        </span>
      </div>
    </div>
  )
}

export function GeoVisual({ live }: BeatVisualProps) {
  // 0 nothing, 1 question, 2 Geo typing, 3 reply. Plays once, the first time the beat is shown.
  const [stage, setStage] = useState(0)
  useEffect(() => {
    if (!live) return
    const timers = [window.setTimeout(() => setStage(1), 150), window.setTimeout(() => setStage(2), 700), window.setTimeout(() => setStage(3), 1600)]
    return () => timers.forEach(window.clearTimeout)
  }, [live])
  return (
    <div aria-hidden="true" className="flex flex-col gap-3 text-body-sm">
      <p className="ml-auto max-w-[84%] rounded-[18px] rounded-br-[6px] bg-ink px-3.5 py-2.5 text-cream" style={arrive(stage >= 1, 0)}>
        Hit my protein with what&apos;s in my fridge? Eggs, yogurt, tuna, rice.
      </p>
      {/* Typing dots and the reply share one grid cell, so the stage never changes height mid-sequence. */}
      <div className="grid">
        <span className="col-start-1 row-start-1 flex h-fit w-fit gap-1 rounded-[18px] rounded-bl-[6px] bg-ink-06 px-3.5 py-3" style={{ opacity: stage === 2 ? 1 : 0, transition: 'opacity 200ms' }}>
          {[0, 1, 2].map((i) => <span key={i} className="size-1.5 rounded-full bg-ink-65 motion-safe:animate-bounce" style={{ animationDelay: `${i * 120}ms` }} />)}
        </span>
        <div className="col-start-1 row-start-1" style={arrive(stage >= 3, 0)}>
          <p className="max-w-[90%] text-ink">A tuna rice bowl with a yogurt dressing gets you most of the way.</p>
          <div className="mt-3 rounded-[16px] bg-ink-04">
            {[['Tuna rice bowl', '42 g protein'], ['Greek yogurt, 150 g', '15 g protein']].map(([name, p]) => (
              <p key={name} className="flex items-center justify-between px-3 py-2.5 text-caption font-semibold text-ink not-first:pt-0">
                <span>{name}</span><span className="font-medium tabular-nums text-ink-65">{p}</span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function CheckInVisual({ live }: BeatVisualProps) {
  const reduce = useReducedMotion()
  const calories = useCountUp(live ? 1900 : null)
  return (
    <div aria-hidden="true">
      <div>
      <div className="flex items-baseline justify-between">
        <span className="text-caption font-semibold text-ink">Weight</span>
        <span className="font-wide text-headline font-[800] tabular-nums text-ink">-0.6 kg</span>
      </div>
      <svg viewBox="0 0 220 48" className="mb-1 mt-2 block w-full overflow-visible">
        <motion.path d="M4 12 L40 16 L76 10 L112 20 L150 18 L186 26 L214 30" fill="none" stroke="var(--color-ink)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: live ? 1 : 0 }} transition={{ duration: reduce ? 0 : (DRAW_MS * 1.3) / 1000, ease: [0.22, 1, 0.36, 1] }} />
        <circle cx="214" cy="30" r="4" fill="var(--color-ink)" style={{ opacity: live ? 1 : 0, transition: `opacity 200ms ${reduce ? 0 : DRAW_MS * 1.2}ms` }} />
      </svg>
      <p className="text-label text-ink-65">7-day average, this week</p>
      </div>
      <div className="mt-3.5 grid grid-cols-2 gap-2.5">
        <div className="flex flex-col rounded-[16px] bg-ink-04 px-3 py-2.5">
          <span className="text-label text-ink-65">Calories</span>
          <s className="mt-1 text-label tabular-nums text-ink-65">1,950</s>
          <span className="font-wide text-hero tabular-nums text-ink">{calories.toLocaleString('en-AU')}</span>
          <span className="text-label text-ink-65">from next week</span>
        </div>
        <div className="flex flex-col rounded-[16px] bg-ink-04 px-3 py-2.5">
          <span className="text-label text-ink-65">Workouts</span>
          <span className="font-wide mt-1 text-hero tabular-nums text-ink">4 of 4</span>
          <span className="mt-auto grid grid-cols-4 gap-1 pt-2">
            {[0, 1, 2, 3].map((i) => <span key={i} className="h-3 rounded-full bg-ink" style={{ opacity: live ? 1 : 0.15, transition: `opacity 300ms ${200 + i * 110}ms` }} />)}
          </span>
        </div>
      </div>
    </div>
  )
}
