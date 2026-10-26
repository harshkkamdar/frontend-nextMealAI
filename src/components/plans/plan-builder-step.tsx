'use client'

import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { PushedHeader } from '@/components/layout/screen-header'
import { hidesTabBar } from '@/components/layout/tab-bar'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
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
  /** Quiet line above the CTA: what still blocks this step. */
  notice?: ReactNode
  children: ReactNode
}

/**
 * Builder step in the onboarding pattern: pushed header, thin progress, one question, a body, and the fixed orange
 * action. Only the question and body change between steps; the header, progress track and CTA stay put.
 */
export function PlanBuilderStep({ title, step, steps, stepKey, question, why, onBack, cta, canContinue, busy, onContinue, notice, children }: PlanBuilderStepProps) {
  const reduce = useReducedMotion()
  const pathname = usePathname()
  // shortcut: the CTA sits above the tab bar while it shows on these routes; drops to the edge once hidesTabBar() covers them.
  const tabBar = !hidesTabBar(pathname ?? '')
  const dir = goingBack ? -1 : 1
  useEffect(() => { goingBack = false }, [stepKey])
  const progress = (step + 1) / steps
  return (
    <div className="mx-auto w-full max-w-md overflow-x-clip px-4">
      <PushedHeader title={title} onBack={() => { goingBack = true; onBack() }} />
      <div role="progressbar" aria-label="Plan steps" aria-valuemin={1} aria-valuemax={steps} aria-valuenow={step + 1} aria-valuetext={`Step ${step + 1} of ${steps}`} className="mx-1 mt-1 h-1 overflow-hidden rounded-full bg-ink-08">
        <motion.div className="h-full origin-left rounded-full bg-ink" initial={false} animate={{ scaleX: progress }} transition={reduce ? reducedFade : spring.sheet} />
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
            className="px-1 pt-7"
            style={{ paddingBottom: tabBar ? 'calc(var(--tabbar-clearance) + 120px)' : 'calc(var(--safe-bottom) + 150px)' } as CSSProperties}
          >
            <h1 className="font-wider text-balance text-[28px] font-[680] leading-[1.12] tracking-[-0.6px] text-ink">{question}</h1>
            {why ? <p className="mt-2 text-pretty text-[15.5px] leading-[1.45] text-ink-80">{why}</p> : null}
            <div className="mt-7">{children}</div>
          </motion.div>
        </AnimatePresence>

        <div
          className="fixed inset-x-0 z-[46] mx-auto max-w-md bg-gradient-to-t from-cream from-60% to-transparent px-5 pt-6"
          style={{ bottom: tabBar ? 'calc(96px + var(--safe-bottom))' : 0, paddingBottom: tabBar ? 8 : 'calc(var(--safe-bottom) + 20px)' }}
        >
          {notice ? <p role="status" className="mb-2.5 line-clamp-2 px-1 text-center text-[14px] font-semibold text-ink-65">{notice}</p> : null}
          <PrimaryButton type="submit" disabled={!canContinue || busy} aria-busy={busy || undefined} className="h-[56px] rounded-full py-0">
            <AnimatePresence initial={false} mode="wait">
              <motion.span key={busy ? 'busy' : cta} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={reduce ? reducedFade : { duration: 0.12 }}>
                {busy ? 'Saving…' : cta}
              </motion.span>
            </AnimatePresence>
          </PrimaryButton>
        </div>
      </form>
    </div>
  )
}
