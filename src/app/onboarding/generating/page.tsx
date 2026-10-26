'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { OnboardingStep } from '@/components/onboarding/onboarding-step'
import { PlanCard } from '@/components/onboarding/plan-card'
import { depthTo } from '@/components/onboarding/depth-nav'
import { generatePlans } from '@/lib/api/plans.api'
import { haptic } from '@/lib/platform/app'
import { reducedFade, spring } from '@/lib/motion'
import { cn } from '@/lib/utils'

const ITEMS = ['Daily calories', 'Protein, carbs and fat', 'Your training week', 'Meals around what you like']

/**
 * Real work only: every item stays pending until the plan request returns; no fake percentages. The checklist sits on
 * the same card the reveal fills, so moving on reads as the card turning over, not a new screen.
 */
export default function GeneratingPage() {
  const router = useRouter()
  const reduce = useReducedMotion()
  const called = useRef(false)
  const [done, setDone] = useState(0)

  useEffect(() => {
    if (called.current) return
    called.current = true

    async function generate() {
      try {
        await generatePlans()
      } catch {
        // Plan generation failed; the reveal screen says so and offers Geo.
      }
      // Tick the items off in order once the work is really done, then move on.
      for (let i = 1; i <= ITEMS.length; i++) {
        setDone(i)
        await new Promise((r) => setTimeout(r, reduce ? 0 : 160))
      }
      void haptic('success')
      await new Promise((r) => setTimeout(r, reduce ? 0 : 280))
      depthTo(() => router.push('/onboarding/review'), 0)
    }

    void generate()
  }, [reduce, router])

  return (
    <OnboardingStep stepKey="generating" scene="plan" question="Geo is building your plan" why="This takes a few seconds." cta="Start" canContinue={false} onContinue={() => {}} bar={false}>
      <PlanCard>
        <ul aria-live="polite" className="flex flex-col gap-2">
          {ITEMS.map((item, i) => {
            const isDone = i < done
            return (
              <li key={item} style={{ '--i': i + 2 } as CSSProperties} className={cn('rise flex h-[60px] items-center gap-3 rounded-[16px] bg-ink-04 px-4 text-body-sm font-semibold transition-colors duration-300', isDone ? 'text-ink' : 'text-ink-65')}>
                <span className={cn('grid size-6 shrink-0 place-items-center rounded-full transition-colors duration-200', isDone ? 'bg-ink text-cream' : 'outline outline-[1.5px] -outline-offset-[1.5px] outline-ink-20')}>
                  {isDone ? (
                    <motion.svg initial={reduce ? false : { scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={reduce ? reducedFade : spring.tap} viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.5l3 3 6-7" /></motion.svg>
                  ) : (
                    <span className="size-2 rounded-full bg-ink-20 motion-safe:animate-pulse" />
                  )}
                </span>
                {item}
                <span className="sr-only">{isDone ? 'done' : 'in progress'}</span>
              </li>
            )
          })}
        </ul>
      </PlanCard>
    </OnboardingStep>
  )
}
