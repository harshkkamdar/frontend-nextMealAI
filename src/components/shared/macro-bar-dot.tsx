'use client'

import { forwardRef, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

interface MacroBarDotProps {
  /** Fill percent 0–100. Non-finite / negative → 0. > 100 clamps to 100. */
  percent: number
  /** Tailwind bg-* class matching the bar's dominant colour. */
  colorClass: string
  /** e.g. "Show protein breakdown" */
  ariaLabel: string
  onClick: () => void
  className?: string
}

/**
 * FB-06 — solid, clickable dot rendered at the end of a macro progress bar.
 * Absolutely positioned inside a `relative` track wrapper. Keyboard + screen
 * reader friendly: role=button, tabIndex=0, Enter/Space activation.
 */
export const MacroBarDot = forwardRef<HTMLDivElement, MacroBarDotProps>(
  function MacroBarDot({ percent, colorClass, ariaLabel, onClick, className }, ref) {
    const safe = Number.isFinite(percent) ? percent : 0
    const clamped = Math.max(0, Math.min(100, safe))

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick()
      }
    }

    return (
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        style={{ left: `${clamped}%` }}
        className={cn(
          // Absolutely positioned overlay, centered on the fill edge.
          'absolute top-1/2 -translate-x-1/2 -translate-y-1/2',
          // Solid filled circle with a white ring for contrast on the track.
          'w-3 h-3 rounded-full ring-2 ring-background shadow-sm',
          'cursor-pointer transition-transform active:scale-90',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent',
          colorClass,
          className,
        )}
      />
    )
  },
)
