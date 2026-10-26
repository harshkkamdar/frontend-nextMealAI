'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { haptic } from '@/lib/platform/app'
import { cn } from '@/lib/utils'

export interface RulerUnit {
  key: string
  /** Base value (kg or cm) to the displayed number. */
  toDisplay: (base: number) => number
  fromDisplay: (display: number) => number
  step: number
  /** Every `major`-th tick is long and labelled. */
  major: number
  format: (display: number) => string
  /** Typed text to a display number; defaults to a plain decimal. */
  parse?: (text: string) => number
  label: string
}

interface RulerInputProps {
  label: string
  value: number | null
  onChange: (base: number) => void
  /** Range in base units. */
  min: number
  max: number
  /** Where the ruler starts when there is no value yet; nothing is saved until the user moves it. */
  start: number
  units: RulerUnit[]
}

const GAP = 10 // px between ticks

/** Big typed number over a scrubbable ruler. Typing and scrubbing stay in sync; the value is stored in base units. */
export function RulerInput({ label, value, onChange, min, max, start, units }: RulerInputProps) {
  const [unitKey, setUnitKey] = useState(units[0].key)
  const unit = units.find((u) => u.key === unitKey) ?? units[0]
  const dMin = Math.ceil(unit.toDisplay(min) / unit.step) * unit.step
  const dMax = Math.floor(unit.toDisplay(max) / unit.step) * unit.step
  const display = unit.toDisplay(value ?? start)
  const [text, setText] = useState(value === null ? '' : unit.format(display))
  const ruler = useRef<HTMLDivElement>(null)
  const programmatic = useRef(false)
  const lastTick = useRef<number | null>(null)
  const settle = useRef(0)
  // Half the ruler's visible width: tick 0 sits there, so scrollLeft = tick index * GAP centres that tick.
  const [half, setHalf] = useState(0)

  useLayoutEffect(() => {
    const el = ruler.current
    if (!el) return
    const measure = () => setHalf(el.clientWidth / 2)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const ticks = Math.round((dMax - dMin) / unit.step)

  function scrollTo(d: number) {
    const el = ruler.current
    if (!el) return
    programmatic.current = true
    el.scrollLeft = ((d - dMin) / unit.step) * GAP
    requestAnimationFrame(() => { programmatic.current = false })
  }

  // Position the ruler on mount and whenever the unit changes.
  useLayoutEffect(() => { scrollTo(display) }, [unitKey, half]) // eslint-disable-line react-hooks/exhaustive-deps


  function onScroll() {
    const el = ruler.current
    if (!el || programmatic.current) return
    const i = Math.round(el.scrollLeft / GAP)
    const d = Math.min(dMax, Math.max(dMin, dMin + i * unit.step))
    if (lastTick.current !== i) { lastTick.current = i; void haptic('selection') }
    setText(unit.format(d))
    onChange(Math.round(unit.fromDisplay(d) * 10) / 10)
    // Once the fling settles, glide onto the nearest tick so the needle never rests between two.
    window.clearTimeout(settle.current)
    settle.current = window.setTimeout(() => {
      if (Math.abs(el.scrollLeft - i * GAP) > 0.5) el.scrollTo({ left: i * GAP, behavior: 'smooth' })
    }, 120)
  }

  function onType(next: string) {
    setText(next)
    const n = unit.parse ? unit.parse(next) : Number(next.replace(',', '.'))
    if (!next.trim() || Number.isNaN(n)) return
    const base = unit.fromDisplay(n)
    if (base < min || base > max) return
    onChange(Math.round(base * 10) / 10)
    scrollTo(Math.round(n / unit.step) * unit.step)
  }

  const labels: number[] = []
  for (let k = 0; k <= ticks; k += unit.major) labels.push(dMin + k * unit.step)

  return (
    <div>
      {units.length > 1 ? (
        <div role="radiogroup" aria-label="Unit" className="mx-auto flex w-fit rounded-full bg-ink-06 p-[3px]">
          {units.map((u) => (
            <button
              key={u.key}
              type="button"
              role="radio"
              aria-checked={u.key === unitKey}
              onClick={() => { setUnitKey(u.key); if (value !== null) setText(u.format(u.toDisplay(value))) }}
              className={cn('h-11 min-w-16 rounded-full px-5 text-[15px] font-semibold', u.key === unitKey ? 'bg-card text-ink shadow-[0_1px_4px_rgba(17,28,53,.1)]' : 'text-ink-65')}
            >
              {u.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-7 flex items-baseline justify-center gap-2">
        <input
          aria-label={`${label} in ${unit.label}`}
          inputMode="decimal"
          value={text}
          placeholder={unit.format(unit.toDisplay(start))}
          onChange={(e) => onType(e.target.value)}
          style={{ width: `${Math.max(2, (text || unit.format(unit.toDisplay(start))).length) * 0.62 + 0.2}em` }}
          className="font-wide bg-transparent text-center text-[72px] font-[750] leading-none tracking-[-2px] text-ink tabular-nums outline-none placeholder:text-ink-20"
        />
        <span className="text-[20px] font-semibold text-ink-65">{unit.label}</span>
      </div>

      <div className="relative mt-8 h-[92px]">
        <div
          ref={ruler}
          onScroll={onScroll}
          aria-hidden="true"
          className="scrollbar-hide h-full overflow-x-auto overscroll-x-contain"
          style={{ maskImage: 'linear-gradient(90deg, transparent, #111C35 22%, #111C35 78%, transparent)', WebkitMaskImage: 'linear-gradient(90deg, transparent, #111C35 22%, #111C35 78%, transparent)' }}
        >
          <div className="relative h-full" style={{ width: half * 2 + ticks * GAP }}>
            <div
              className="absolute bottom-7 h-11"
              style={{
                left: half - 1,
                width: ticks * GAP + 2,
                backgroundImage: `linear-gradient(90deg, rgba(17,28,53,.65) 2px, transparent 2px), linear-gradient(90deg, rgba(17,28,53,.2) 2px, transparent 2px)`,
                backgroundSize: `${GAP * unit.major}px 100%, ${GAP}px 55%`,
                backgroundRepeat: 'repeat-x',
                backgroundPosition: '0 100%, 0 100%',
              }}
            />
            {labels.map((d) => (
              <span key={d} className="absolute bottom-0 -translate-x-1/2 text-[12.5px] font-medium text-ink-65 tabular-nums" style={{ left: half + ((d - dMin) / unit.step) * GAP }}>
                {unit.format(d).replace(/\.0$/, '')}
              </span>
            ))}
          </div>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute bottom-6 left-1/2 h-[60px] w-[3px] -translate-x-1/2 rounded-full bg-ink" />
      </div>
    </div>
  )
}

export const KG: RulerUnit = { key: 'kg', label: 'kg', toDisplay: (b) => b, fromDisplay: (d) => d, step: 0.5, major: 10, format: (d) => d.toFixed(1) }
export const LB: RulerUnit = { key: 'lb', label: 'lb', toDisplay: (b) => b * 2.20462, fromDisplay: (d) => d / 2.20462, step: 1, major: 10, format: (d) => String(Math.round(d)) }
export const CM: RulerUnit = { key: 'cm', label: 'cm', toDisplay: (b) => b, fromDisplay: (d) => d, step: 1, major: 10, format: (d) => String(Math.round(d)) }
export const FT_IN: RulerUnit = {
  key: 'ftin', label: 'ft', toDisplay: (b) => b / 2.54, fromDisplay: (d) => d * 2.54, step: 1, major: 12,
  format: (d) => `${Math.floor(Math.round(d) / 12)}'${Math.round(d) % 12}`,
  parse: (t) => { const m = t.match(/^\s*(\d+)\s*['’ ]\s*(\d{1,2})?\s*$/); return m ? Number(m[1]) * 12 + Number(m[2] ?? 0) : Number.NaN },
}
