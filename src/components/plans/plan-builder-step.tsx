'use client'

import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { PushedHeader } from '@/components/layout/screen-header'
import { Busy, Dock, DockSpacer, ORANGE_BUTTON } from '@/components/plans/spatial-parts'
import { reducedFade, spring } from '@/lib/motion'

/** Set by Back just before the step changes, so the previous step comes in from the left. */
let goingBack = false

interface PlanBuilderStepProps {
  title: string
  step: number
  steps: number
  stepKey: string
  question: string
  why?: string
  onBack: () => void
  cta: string
  canContinue: boolean
  busy?: boolean
  onContinue: () => void
  /** Quiet line in the dock above the action: what still blocks this step, or why the save failed. */
  notice?: ReactNode
  children: ReactNode
}

/**
 * C1 Focused steps (mocks/journey-plans.html): pushed header, a progress track under it, one question per screen, the
 * body, and the orange action in the glass dock. Only the question and body move between steps; the header, track
 * and dock stay put.
 */
export function PlanBuilderStep({ title, step, steps, stepKey, question, why, onBack, cta, canContinue, busy, onContinue, notice, children }: PlanBuilderStepProps) {
  const reduce = useReducedMotion()
  const dir = goingBack ? -1 : 1
  useEffect(() => { goingBack = false }, [stepKey])
  const progress = (step + 1) / steps
  return (
    <div className="mx-auto w-full max-w-md overflow-x-clip px-4">
      <PushedHeader title={title} onBack={() => { goingBack = true; onBack() }} />
      <div role="progressbar" aria-label="Plan steps" aria-valuemin={1} aria-valuemax={steps} aria-valuenow={step + 1} aria-valuetext={`Step ${step + 1} of ${steps}`} className="mx-2 h-1 overflow-hidden rounded-full bg-ink-08">
        <motion.div className="h-full origin-left rounded-full bg-ink" initial={false} animate={{ scaleX: progress }} transition={reduce ? reducedFade : spring.glide} />
      </div>
      <form noValidate className="relative" onSubmit={(event) => { event.preventDefault(); if (canContinue && !busy) onContinue() }}>
        <AnimatePresence initial={false} mode="popLayout" custom={dir}>
          <motion.div
            key={stepKey}
            custom={dir}
            variants={{
              enter: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: 24 * d }),
              center: { opacity: 1, x: 0 },
              // The old step fades while the new one arrives, so there is never an empty frame between them.
              exit: (d: number) => (reduce ? { opacity: 0, transition: reducedFade } : { opacity: 0, x: -12 * d, transition: { duration: 0.14, ease: 'easeOut' } }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={reduce ? reducedFade : { ...spring.page, opacity: { duration: 0.2, ease: 'easeOut' } }}
            className="px-1 pt-5"
          >
            <h1 className="font-wide text-balance text-title text-ink">{question}</h1>
            {why ? <p className="mt-2 text-pretty text-body-sm text-ink-65">{why}</p> : null}
            <div className="mt-5">{children}</div>
            <DockSpacer tall={!!notice} />
          </motion.div>
        </AnimatePresence>

        <Dock>
          {notice ? <p role="status" className="line-clamp-2 px-2 pt-1 text-center text-caption font-semibold text-ink-65">{notice}</p> : null}
          <button type="submit" disabled={!canContinue || busy} aria-busy={busy || undefined} className={ORANGE_BUTTON}>
            {busy ? <Busy>Saving</Busy> : cta}
          </button>
        </Dock>
      </form>
    </div>
  )
}
