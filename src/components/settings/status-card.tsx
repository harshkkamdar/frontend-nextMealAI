'use client'

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { GeoAvatar } from '@/components/shared/geo-avatar'
import { reducedFade, spring } from '@/lib/motion'

const noop = () => () => {}

/**
 * Crash and 404 (mock "Status capsule", system states): a white card floats forward over an ink dim, on top of what
 * was on screen (the app shell inside the app; the cream page outside it). Geo, one title, one plain line, one ink
 * action, and an optional quiet second action. Rendered into the body, so no page transform can move it.
 */
export function StatusCard({ title, children, action, secondary }: { title: string; children: ReactNode; action: ReactNode; secondary?: ReactNode }) {
  const reduce = useReducedMotion()
  const mounted = useSyncExternalStore(noop, () => true, () => false)
  const card = useRef<HTMLDivElement>(null)

  // Focus lands on the card (read out as an alert) rather than its button, so no ring shows before the first key press.
  useEffect(() => { if (mounted) card.current?.focus({ preventScroll: true }) }, [mounted])

  const body = (
    <motion.div
      className="fixed inset-0 z-[90] grid place-items-center bg-ink/18 p-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={reduce ? reducedFade : { duration: 0.24, ease: 'easeOut' }}
    >
      <motion.div
        ref={card}
        role="alertdialog"
        aria-modal="true"
        tabIndex={-1}
        aria-labelledby="status-card-title"
        aria-describedby="status-card-body"
        className="w-full max-w-[400px] rounded-[30px] outline-none bg-card px-5 pb-3 pt-6 shadow-[0_2px_4px_rgba(17,28,53,.05),0_40px_70px_-30px_rgba(17,28,53,.5)]"
        initial={reduce ? { opacity: 0 } : { y: 20, scale: 0.92, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={reduce ? reducedFade : { ...spring.push, opacity: { duration: 0.2, ease: 'easeOut' } }}
      >
        <GeoAvatar size={48} />
        <h1 id="status-card-title" className="mt-4 text-hero text-ink">{title}</h1>
        <p id="status-card-body" className="mt-2 text-body leading-[1.45] text-ink-65">{children}</p>
        <div className="mt-5">{action}</div>
        {secondary ? <div className="mt-1">{secondary}</div> : <div className="h-2" />}
      </motion.div>
    </motion.div>
  )
  // Server render and the first client paint draw it in place; after mount it moves to the body.
  return mounted ? createPortal(body, document.body) : body
}

/** The card's main action (a Link or a button): ink capsule, full width. */
export const statusActionClass = 'flex h-btn w-full items-center justify-center rounded-full bg-ink text-body font-bold text-cream transition-transform duration-100 active:scale-[.97]'
/** The quiet second action under it. */
export const statusSecondaryClass = 'flex min-h-11 w-full items-center justify-center text-body font-bold text-ink transition-colors duration-150 active:bg-ink-04 rounded-full'
