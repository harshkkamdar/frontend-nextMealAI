'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { reducedFade, spring } from '@/lib/motion'
import { cn } from '@/lib/utils'

/** Index of the first character that is not a leading zero or separator; the last digit always counts. */
export function leadIndex(text: string): number {
  const index = text.slice(0, -1).search(/[1-9]/)
  return index === -1 ? text.length - 1 : index
}

/**
 * Digit-tile clock (Bevel IMG_6857, Q27): each digit on its own tile, leading zeros dimmed. A digit that changes
 * flips in on its tile (rotateX and opacity only); the first paint and reduced motion show it at rest.
 * The visible tiles are hidden from screen readers; `label` carries the readable value.
 */
export function DigitTiles({ text, label, tone = 'light', size = 'lg', live }: { text: string; label: string; tone?: 'light' | 'dark'; size?: 'lg' | 'md'; live?: boolean }) {
  const reduce = useReducedMotion()
  const lead = leadIndex(text)
  const tile = size === 'lg' ? 'h-[52px] w-[36px] rounded-[12px] text-[30px]' : 'h-[44px] w-[32px] rounded-[10px] text-[26px]'
  return (
    <span className="flex items-center">
      <span className="sr-only" aria-live={live ? 'polite' : undefined}>{label}</span>
      <span aria-hidden="true" className="flex items-center gap-[5px]" style={{ perspective: 240 }}>
        {[...text].map((char, index) => char === ':' ? (
          <span key={index} className={cn('px-[1px] text-[22px] font-bold', tone === 'light' ? 'text-ink-50' : 'text-cream-60')}>:</span>
        ) : (
          <span key={index} className={cn('grid place-items-center overflow-hidden', tile, tone === 'light' ? 'bg-ink-04' : 'bg-cream-22')}>
            {/* initial={false}: the first paint shows digits at rest; only later changes flip. */}
            <AnimatePresence initial={false}>
            <motion.span
              key={char}
              initial={reduce ? { opacity: 0 } : { rotateX: -75, opacity: 0 }}
              animate={{ rotateX: 0, opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { rotateX: 75, opacity: 0 }}
              transition={reduce ? reducedFade : spring.tap}
              className={cn(
                'font-wide font-bold leading-none tabular-nums [grid-area:1/1]',
                tone === 'light' ? (index < lead ? 'text-ink-50' : 'text-ink') : (index < lead ? 'text-cream-60' : 'text-cream'),
              )}
            >
              {char}
            </motion.span>
            </AnimatePresence>
          </span>
        ))}
      </span>
    </span>
  )
}
