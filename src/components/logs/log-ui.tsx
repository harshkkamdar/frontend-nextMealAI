'use client'

import type { ReactNode, Ref } from 'react'
import { Minus, Plus, X } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { SearchFill } from '@/components/ui/fiqr/icons'
import { haptic } from '@/lib/platform/app'
import { reducedFade, spring } from '@/lib/motion'
import { cn } from '@/lib/utils'

/** Logging building blocks (slice 3): the slice 2 card language applied to lists, fields and pickers. */

export const CARD = 'rounded-card card-glass'
/** White list card; children are `ROW`s separated by hairlines. */
export const LIST = 'overflow-hidden rounded-card card-glass'
export const ROW = 'flex min-h-16 w-full items-center gap-3 border-b border-ink-06 px-5 py-3 text-left last:border-b-0 transition-colors active:bg-ink-04'
export const FIELD = 'w-full rounded-[16px] bg-[var(--surface-card)] px-4 text-[17px] text-ink shadow-[var(--shadow-card)] outline-none placeholder:text-ink-65 focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-ink'

export function SectionTitle({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-2 flex min-h-6 items-end justify-between px-1', className)}>
      <h2 className="text-[13px] font-semibold text-ink-65">{children}</h2>
      {action}
    </div>
  )
}

/** Pill search field on a white card; the clear button appears once there is text. */
export function SearchField({ value, onChange, placeholder, label, inputRef, autoFocus, testId }: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  label: string
  inputRef?: Ref<HTMLInputElement>
  autoFocus?: boolean
  testId?: string
}) {
  return (
    <div className="relative">
      <SearchFill aria-hidden="true" className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-ink-65" />
      <input
        ref={inputRef}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        aria-label={label}
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        data-testid={testId}
        className={cn(FIELD, 'h-14 rounded-full pl-[52px] pr-12 [&::-webkit-search-cancel-button]:hidden')}
      />
      {value ? (
        <button type="button" onClick={() => onChange('')} aria-label="Clear search" className="absolute right-1.5 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full text-ink-65 transition-transform active:scale-[.94]">
          <X className="size-5" />
        </button>
      ) : null}
    </div>
  )
}

/** Big centred number between two round buttons (Home quick log pattern). Selection haptic per step (Q28). */
export function Stepper({ value, unit, onChange, step = 1, min = 0, max = 99, format = String, lessLabel, moreLabel, valueTestId }: {
  value: number
  unit: string
  onChange: (next: number) => void
  step?: number
  min?: number
  max?: number
  format?: (n: number) => string
  lessLabel: string
  moreLabel: string
  valueTestId?: string
}) {
  const set = (next: number) => {
    const clamped = Math.min(max, Math.max(min, Math.round(next * 100) / 100))
    if (clamped !== value) void haptic('selection')
    onChange(clamped)
  }
  const button = 'grid size-14 shrink-0 place-items-center rounded-full card-glass text-ink transition-transform active:scale-[.94] disabled:opacity-40'
  return (
    <div className="flex items-center justify-center gap-6">
      <button type="button" aria-label={lessLabel} disabled={value <= min} onClick={() => set(value - step)} className={button}><Minus className="size-5" /></button>
      <div className="min-w-28 text-center" aria-live="polite">
        <span className="font-wide block text-[40px] font-[750] leading-none tracking-[-1px] text-ink tabular-nums" data-testid={valueTestId}>{format(value)}</span>
        <span className="mt-1 block text-[13px] font-semibold text-ink-65">{unit}</span>
      </div>
      <button type="button" aria-label={moreLabel} disabled={value >= max} onClick={() => set(value + step)} className={button}><Plus className="size-5" /></button>
    </div>
  )
}

/** 1 to 10 as radio tiles; the chosen one fills ink (never orange). */
export function Scale({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-5 gap-2">
      {Array.from({ length: 10 }, (_, index) => index + 1).map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={n === value}
          aria-label={`${n} of 10`}
          onClick={() => { void haptic('selection'); onChange(n) }}
          className={cn('h-12 rounded-[14px] text-[16px] font-semibold tabular-nums transition-transform active:scale-[.94]', n === value ? 'bg-ink text-cream' : 'card-glass text-ink')}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

/** A row of choice chips. `value` may be '' for none; tapping the chosen chip again clears it when `clearable`. */
export function Chips<T extends string>({ options, value, onChange, label, clearable, className }: {
  options: readonly { value: T; label: string }[]
  value: T | ''
  onChange: (value: T | '') => void
  label: string
  clearable?: boolean
  className?: string
}) {
  return (
    // A chip rail scrolls sideways from the screen edge, so it opts out of the route frame's swipe-back.
    <div role="group" aria-label={label} data-no-swipe-back className={cn('flex gap-2', className)}>
      {options.map((option) => {
        const on = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={on}
            onClick={() => { void haptic('selection'); onChange(on && clearable ? '' : option.value) }}
            className={cn('h-11 shrink-0 whitespace-nowrap rounded-full px-4 text-[15px] font-semibold transition-transform active:scale-[.96]', on ? 'bg-ink text-cream' : 'card-glass text-ink')}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/** Placeholder rows with the final row height, pulsing gently while a list loads (motion-feel 3h, no sweep). */
export function RowsSkeleton({ rows = 3, label }: { rows?: number; label: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={LIST}>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex min-h-16 items-center gap-3 border-b border-ink-06 px-5 py-3 last:border-b-0">
          <span className="block h-4 flex-1 animate-pulse rounded-full bg-ink-06 [animation-duration:1.2s]" style={{ maxWidth: `${70 - index * 12}%` }} />
          <span className="block h-4 w-14 animate-pulse rounded-full bg-ink-06 [animation-duration:1.2s]" />
        </div>
      ))}
    </div>
  )
}

/** Dashed slot that keeps the layout when a list is empty; optionally one tap to fill it. */
export function EmptySlot({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  const className = 'flex min-h-16 w-full items-center justify-center rounded-[24px] border-[1.5px] border-dashed border-ink-20 px-6 py-4 text-center text-[15px] font-semibold leading-snug text-ink-65'
  return onClick
    ? <button type="button" onClick={onClick} className={cn(className, 'transition-transform active:scale-[.98]')}>{children}</button>
    : <p className={className}>{children}</p>
}

/**
 * Entrance for rows of a freshly loaded list: y 8 to 0 with opacity on the glide spring, 30 ms apart,
 * capped at the sixth row (motion-feel 3e). Reduced motion: a 150 ms fade.
 */
export function RiseList({ children, className, ...rest }: { children: ReactNode[]; className?: string; role?: string; 'aria-label'?: string }) {
  const reduce = useReducedMotion()
  return (
    <div className={className} {...rest}>
      {children.map((child, index) => (
        <motion.div
          key={(child as { key?: string } | null)?.key ?? index}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce ? reducedFade : { ...spring.glide, delay: Math.min(index, 5) * 0.03 }}
          className="border-b border-ink-06 last:border-b-0"
        >
          {child}
        </motion.div>
      ))}
    </div>
  )
}
