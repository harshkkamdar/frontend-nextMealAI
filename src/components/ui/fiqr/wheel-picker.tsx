'use client'

import { useLayoutEffect, useRef, type KeyboardEvent } from 'react'
import { haptic } from '@/lib/platform/app'
import { cn } from '@/lib/utils'

export const WHEEL_ROW = 44
const VISIBLE = 5

interface WheelPickerProps<T extends string | number> {
  label: string
  items: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  className?: string
}

/** One snapping wheel column, like the iOS picker. Place several over a shared selection band (`WheelBand`). */
export function WheelPicker<T extends string | number>({ label, items, value, onChange, className }: WheelPickerProps<T>) {
  const ref = useRef<HTMLDivElement>(null)
  const index = Math.max(0, items.findIndex((item) => item.value === value))
  const last = useRef(index)

  // Follow outside changes (first render, a shorter month clamping the day) without fighting a scroll in progress.
  useLayoutEffect(() => {
    const el = ref.current
    if (el && Math.round(el.scrollTop / WHEEL_ROW) !== index) el.scrollTop = index * WHEEL_ROW
    last.current = index
  }, [index])

  function onScroll() {
    const el = ref.current
    if (!el) return
    const i = Math.min(items.length - 1, Math.max(0, Math.round(el.scrollTop / WHEEL_ROW)))
    if (i === last.current) return
    last.current = i
    void haptic('selection')
    onChange(items[i].value)
  }

  function go(i: number) {
    const target = Math.min(items.length - 1, Math.max(0, i))
    ref.current?.scrollTo({ top: target * WHEEL_ROW, behavior: 'smooth' })
  }

  function onKeyDown(e: KeyboardEvent) {
    const step = { ArrowDown: 1, ArrowUp: -1, PageDown: 5, PageUp: -5 }[e.key]
    if (step === undefined) return
    e.preventDefault()
    go(index + step)
  }

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={label}
      tabIndex={0}
      aria-activedescendant={`${label}-${index}`}
      onScroll={onScroll}
      onKeyDown={onKeyDown}
      className={cn('scrollbar-hide relative snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-[12px] focus-visible:outline-2 focus-visible:outline-ink', className)}
      style={{
        height: WHEEL_ROW * VISIBLE,
        paddingBlock: WHEEL_ROW * 2,
        maskImage: 'linear-gradient(transparent, #000 30%, #000 70%, transparent)',
        WebkitMaskImage: 'linear-gradient(transparent, #000 30%, #000 70%, transparent)',
      }}
    >
      {items.map((item, i) => (
        <div
          key={item.value}
          id={`${label}-${i}`}
          role="option"
          aria-selected={i === index}
          onClick={() => go(i)}
          className={cn(
            'flex snap-center items-center justify-center text-[20px] tabular-nums transition-[color,font-weight] duration-150',
            i === index ? 'font-bold text-ink' : 'font-medium text-ink-65',
          )}
          style={{ height: WHEEL_ROW }}
        >
          {item.label}
        </div>
      ))}
    </div>
  )
}

/** The pale pill behind the centre row of the wheels. */
export function WheelBand() {
  return <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 rounded-[12px] bg-ink-06" style={{ top: WHEEL_ROW * 2, height: WHEEL_ROW }} />
}
