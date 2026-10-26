'use client'

import { useCallback, useEffect, useId, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { reducedFade, spring } from '@/lib/motion'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  /** Kept for callers; every confirm is ink (D2 convention), so orange stays the screen's one action. */
  variant?: 'danger' | 'default'
}

/**
 * v2 confirm: an inset glass panel that rises from the bottom like the app's sheets, over an ink dim.
 * The action is ink and stated plainly; Cancel sits under it and takes focus first.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false)
  const reduce = useReducedMotion()
  const id = useId()

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose, loading])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleConfirm = useCallback(async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }, [onConfirm])

  const fade = reduce ? reducedFade : { duration: 0.18, ease: 'easeOut' as const }

  return (
    <AnimatePresence>
      {open ? (
        <div key="confirm" className="fixed inset-0 z-[100]">
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-ink/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: reduce ? reducedFade : { duration: 0.14, ease: 'easeOut' } }}
            transition={fade}
            onClick={() => { if (!loading) onClose() }}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`${id}-title`}
            aria-describedby={`${id}-description`}
            className="glass-cream absolute inset-x-2 bottom-[var(--nav-clearance)] mx-auto max-w-[calc(28rem-16px)] rounded-[38px] px-6 pb-4 pt-7"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0, transition: reducedFade } : { opacity: 0, y: 12, transition: { duration: 0.14, ease: 'easeOut' } }}
            transition={reduce ? reducedFade : spring.sheet}
          >
            <h2 id={`${id}-title`} className="font-wide text-[22px] font-bold leading-tight text-ink">{title}</h2>
            <p id={`${id}-description`} className="mt-2 text-[15.5px] leading-[1.45] text-ink-65">{description}</p>
            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={loading}
              className="mt-6 h-14 w-full rounded-[18px] bg-ink text-[17px] font-bold text-cream transition-transform duration-100 enabled:active:scale-[.97] disabled:opacity-60"
            >
              {loading ? 'One moment…' : confirmLabel}
            </button>
            {/* Cancel takes focus first, so Enter on a destructive dialog never deletes by accident. */}
            <button type="button" autoFocus onClick={onClose} disabled={loading} className="mt-1 h-12 w-full rounded-[18px] text-[16px] font-semibold text-ink disabled:opacity-50">
              {cancelLabel}
            </button>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
