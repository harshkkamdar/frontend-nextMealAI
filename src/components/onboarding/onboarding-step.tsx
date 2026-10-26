'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion, type Transition } from 'framer-motion'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { RoundButton } from '@/components/ui/fiqr/round-button'
import { useAuroraScene, type SceneName } from '@/components/onboarding/aurora'
import { arrivalDir, BEHIND, clearArrival, FRONT, type DepthDir } from '@/components/onboarding/depth-nav'
import { reducedFade, spring } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface OnboardingStepProps {
  /** Unique per question so the content steps in depth between questions. */
  stepKey: string
  /** 0-1 through the whole setup, for screen readers; leave out on screens outside the setup flow (sign-in, password). */
  progress?: number
  /** Fill of the three section bars (about you, training, food), each 0-1. Defaults to full when `progress` is set. */
  segments?: number[]
  question: string
  why?: string
  onBack?: () => void
  cta?: string
  canContinue: boolean
  busy?: boolean
  busyLabel?: string
  onContinue: () => void
  /** Optional quiet action under the CTA, e.g. "Skip". */
  secondary?: { label: string; onClick: () => void }
  /** Shown above the CTA, e.g. a form-level error. */
  notice?: ReactNode
  /** Aurora scene behind this screen; question steps pass one of the q scenes. */
  scene?: SceneName
  /** false while there is nothing to press yet (plan generating): the CTA bar steps away. */
  bar?: boolean
  children: ReactNode
}

/** Set by a back action just before navigating, so the next step comes toward you instead of from in front. */
let goingBack = false
export function markBack() { goingBack = true }

/** What the chrome showed last, so a screen that mounts after a route change carries it on instead of cutting. */
let shown = { segments: [0, 0, 0], cta: '' }

const OUT = [0.23, 1, 0.32, 1] as const

/**
 * One question per screen on the Aurora (mocks/aurora-onboarding.html): round back, three section bars, question,
 * why-line, body, one CTA. The content steps in depth: forward, the old question steps back and fades while the new
 * one arrives from just in front; back is the reverse. The chrome never moves between steps.
 */
export function OnboardingStep({ stepKey, progress, segments, question, why, onBack, cta = 'Continue', canContinue, busy, busyLabel = 'Saving…', onContinue, secondary, notice, scene = 'form', bar = true, children }: OnboardingStepProps) {
  const reduce = useReducedMotion()
  useAuroraScene(scene)
  // Read once per mount: a cross-route depthTo arrival animates in; a first paint does not.
  const [arrival] = useState<DepthDir | null>(() => arrivalDir())
  const [from] = useState(() => shown)
  const dir: DepthDir = goingBack ? -1 : 1
  // Cleared after commit, not during render, so React's double render in dev reads the same direction.
  useEffect(() => { goingBack = false }, [stepKey])
  useEffect(() => { clearArrival() }, [])

  const bars = segments ?? (progress === undefined ? null : [1, 1, 1])
  const label = busy ? busyLabel : cta
  useEffect(() => { shown = { segments: bars ?? [0, 0, 0], cta: label } })

  const variants = {
    enter: (d: DepthDir) => (reduce || d === 0 ? { opacity: 0, scale: 1 } : { opacity: 0, scale: d > 0 ? FRONT : BEHIND }),
    center: { opacity: 1, scale: 1 },
    exit: (d: DepthDir) => (reduce ? { opacity: 0, transition: reducedFade } : { opacity: 0, scale: d > 0 ? BEHIND : FRONT, transition: { opacity: { duration: 0.2, ease: OUT }, scale: spring.page } }),
  }
  // The arriving question fills in after the old one has mostly cleared: less double image.
  const settle: Transition = reduce ? reducedFade : { scale: spring.page, opacity: { duration: 0.3, ease: OUT, delay: 0.08 } }

  return (
    // overflow-x-clip: the content must never widen the page, or mobile browsers rescale the viewport and the fixed CTA jumps.
    <div data-page className="flex min-h-dvh flex-col overflow-x-clip pt-[calc(var(--safe-top)+8px)]">
      <div data-chrome className={cn('relative z-10 flex h-11 items-center gap-4 px-gutter', 'page-in')}>
        {onBack ? (
          <RoundButton aria-label="Back" onClick={() => { markBack(); onBack() }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </RoundButton>
        ) : (
          <span className="size-11 shrink-0" />
        )}
        {bars ? (
          <div role="progressbar" aria-label="Setup progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((progress ?? 1) * 100)} className="flex flex-1 gap-1.5 pr-1.5">
            {bars.map((fill, i) => (
              <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-ink-08">
                <motion.span className="block h-full origin-left rounded-full bg-ink" initial={{ scaleX: from.segments[i] ?? 0 }} animate={{ scaleX: fill }} transition={reduce ? reducedFade : spring.sheet} />
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <form
        noValidate
        className="relative flex flex-1 flex-col"
        onSubmit={(e) => { e.preventDefault(); if (canContinue && !busy) onContinue() }}
      >
        <AnimatePresence initial={arrival !== null} mode="popLayout" custom={arrival ?? dir}>
          <motion.div
            key={stepKey}
            data-depth
            custom={arrival ?? dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={settle}
            style={{ '--rise-delay': '60ms', transformOrigin: '50% 30vh' } as CSSProperties}
            className="flex-1 px-gutter pb-[calc(170px+var(--safe-bottom))] pt-8"
          >
            <h1 className="rise font-wide text-balance text-title text-ink">{question}</h1>
            {why ? <p className="rise mt-2.5 text-pretty text-body-sm text-ink-80" style={{ '--i': 1 } as CSSProperties}>{why}</p> : null}
            <div className="mt-7">{children}</div>
          </motion.div>
        </AnimatePresence>

        <div data-chrome className={cn('fixed inset-x-0 bottom-0 z-10 px-gutter pb-[calc(var(--safe-bottom)+16px)] pt-6 transition-[opacity,translate] duration-300 ease-out', 'page-in', !bar && 'pointer-events-none translate-y-4 opacity-0')} inert={!bar || undefined}>
          {/* A short cream wash under the buttons so scrolled content fades out instead of running under them. */}
          <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-cream from-45% to-transparent" />
          {notice}
          <PrimaryButton type="submit" disabled={!canContinue || busy} aria-busy={busy || undefined} className="relative overflow-hidden">
            {/* The label crossfades when it changes (Continue to Finish, Send to Back to sign in, or across a route) instead of cutting. */}
            <AnimatePresence initial={label !== from.cta} mode="popLayout">
              <motion.span key={label} initial={{ opacity: 0, y: reduce ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : -8 }} transition={reduce ? reducedFade : { y: spring.tap, opacity: { duration: 0.16 } }}>
                {label}
              </motion.span>
            </AnimatePresence>
          </PrimaryButton>
          {/* The slot is always there, so the CTA sits at one height on every screen (mock) and never moves when a link comes or goes. */}
          <div className="relative h-12">
            <AnimatePresence initial={false}>
              {secondary ? (
                <motion.div key={secondary.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={reduce ? reducedFade : { duration: 0.18 }} className="absolute inset-0">
                  <button type="button" onClick={secondary.onClick} className="mx-auto mt-1 flex h-11 items-center px-4 text-body-sm font-semibold text-ink">
                    {secondary.label}
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </form>
    </div>
  )
}
