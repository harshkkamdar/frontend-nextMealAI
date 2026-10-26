'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { reducedFade, spring } from '@/lib/motion'
import { haptic } from '@/lib/platform/app'

/** Shared-element id linking an option chip to the pill it becomes once sent. */
export const replyLayoutId = (option: string) => `geo-reply-${option}`

/**
 * R6-10: tappable option chips under Geo's last message. When Geo asks the user to choose from a small set
 * ("which food?", "which day?"), tapping a chip sends that exact text as the next message, no typing.
 * Rendered only for the most recent assistant message (see the surfaces that mount it). The tapped chip glides
 * into the user's pill (`replyLayoutId`); the others fade. Chips grow to fill each row, so the flow never ends on a
 * half-empty row.
 */
export function SuggestedReplies({
  options,
  onSelect,
  disabled,
}: {
  options: string[]
  onSelect: (value: string) => void
  disabled?: boolean
}) {
  const reduce = useReducedMotion()
  if (!options || options.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2" data-testid="suggested-replies">
      {options.map((opt, i) => (
        <motion.button
          key={`${opt}-${i}`}
          type="button"
          layoutId={reduce ? undefined : replyLayoutId(opt)}
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={reduce ? reducedFade : { ...spring.tap, delay: 0.08 + i * 0.03 }}
          whileTap={reduce ? undefined : { scale: 0.96 }}
          disabled={disabled}
          onClick={() => { void haptic('selection'); onSelect(opt) }}
          className="min-h-11 max-w-full grow rounded-[22px] bg-card px-4 py-2.5 text-center text-[15px] font-semibold leading-snug text-ink shadow-[var(--shadow-card)] disabled:opacity-50"
        >
          {opt}
        </motion.button>
      ))}
    </div>
  )
}
