'use client'

import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { RoundButton } from '@/components/ui/fiqr/round-button'
import { reducedFade, spring } from '@/lib/motion'

interface OnboardingStepProps {
  /** Unique per question so the content animates between steps. */
  stepKey: string
  progress: number
  question: string
  why?: string
  onBack?: () => void
  cta?: string
  canContinue: boolean
  busy?: boolean
  onContinue: () => void
  /** Optional quiet action under the CTA, e.g. "Skip". */
  secondary?: { label: string; onClick: () => void }
  children: ReactNode
}

/** Set by a back action just before navigating, so the next step slides in from the left. */
let goingBack = false
export function markBack() { goingBack = true }

/** One question per screen: round back, thin progress, question, why-line, body, fixed orange CTA. */
export function OnboardingStep({ stepKey, progress, question, why, onBack, cta = 'Continue', canContinue, busy, onContinue, secondary, children }: OnboardingStepProps) {
  const reduce = useReducedMotion()
  const dir = goingBack ? -1 : 1
  // Cleared after commit, not during render, so React's double render in dev reads the same direction.
  useEffect(() => { goingBack = false }, [stepKey])
  return (
    // overflow-x-clip: the sliding question must never widen the page, or mobile browsers rescale the viewport and the fixed CTA jumps.
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-cream pt-[calc(var(--safe-top)+8px)]">
      <div className="flex items-center gap-4 px-5">
        {onBack ? (
          <RoundButton flat aria-label="Back" onClick={() => { markBack(); onBack() }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </RoundButton>
        ) : (
          <span className="size-11 shrink-0" />
        )}
        <div role="progressbar" aria-label="Setup progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} className="h-1 flex-1 overflow-hidden rounded-full bg-ink-08">
          <motion.div className="h-full origin-left rounded-full bg-ink" initial={false} animate={{ scaleX: Math.max(0.08, progress) }} transition={reduce ? reducedFade : spring.sheet} />
        </div>
      </div>

      <form
        className="relative flex flex-1 flex-col"
        onSubmit={(e) => { e.preventDefault(); if (canContinue && !busy) onContinue() }}
      >
        <AnimatePresence initial={false} mode="popLayout" custom={dir}>
          <motion.div
            key={stepKey}
            custom={dir}
            variants={{
              enter: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: 28 * d }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: -28 * d }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={reduce ? reducedFade : spring.page}
            className="flex-1 px-5 pb-[calc(150px+var(--safe-bottom))] pt-9"
          >
            <h1 className="font-wider text-balance text-[30px] font-[680] leading-[1.1] tracking-[-0.7px] text-ink">{question}</h1>
            {why ? <p className="mt-2.5 text-pretty text-[15.5px] leading-[1.45] text-ink-80">{why}</p> : null}
            <div className="mt-8">{children}</div>
          </motion.div>
        </AnimatePresence>

        <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-cream from-70% to-transparent px-5 pb-[calc(var(--safe-bottom)+20px)] pt-8">
          <PrimaryButton type="submit" disabled={!canContinue || busy} aria-busy={busy || undefined} className="h-[58px] rounded-full py-0">
            {busy ? 'Saving…' : cta}
          </PrimaryButton>
          {secondary ? (
            <button type="button" onClick={secondary.onClick} className="mx-auto mt-1 flex h-11 items-center px-4 text-[15px] font-semibold text-ink-65">
              {secondary.label}
            </button>
          ) : null}
        </div>
      </form>
    </div>
  )
}
