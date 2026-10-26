'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { GeoAnchor } from '@/components/chat/chat-bubble'

/**
 * Geo is writing: three dots where its first line of text will land (one 24 px line, the 16/1.5 text box),
 * so the reply replaces them with no layout jump. Opacity only. `anchor` shows the Geo anchor above, as the reply will.
 */
export function TypingIndicator({ anchor = false }: { anchor?: boolean }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      role="status"
      aria-label="Geo is writing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, ease: 'easeOut', delay: reduce ? 0 : 0.12 }}
      className="flex flex-col gap-3"
    >
      {anchor ? <GeoAnchor /> : null}
      <div className="flex h-6 items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-2 rounded-full bg-ink-65"
            initial={{ opacity: 0.35 }}
            animate={reduce ? { opacity: 0.6 } : { opacity: [0.35, 1, 0.35] }}
            transition={reduce ? { duration: 0 } : { duration: 1, repeat: Infinity, ease: 'easeInOut', delay: i * 0.16 }}
          />
        ))}
      </div>
    </motion.div>
  )
}
