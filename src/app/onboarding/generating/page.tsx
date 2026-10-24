'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { generatePlans } from '@/lib/api/plans.api'
import { haptic } from '@/lib/platform/app'
import { reducedFade, spring } from '@/lib/motion'
import { cn } from '@/lib/utils'

const ITEMS = ['Daily calories', 'Protein, carbs and fat', 'Your training week', 'Meals around what you like']

/** Real work only: every item stays pending until the plan request returns; no fake percentages. */
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
      router.push('/onboarding/review')
    }

    void generate()
  }, [reduce, router])

  return (
    <div className="flex min-h-dvh flex-col justify-center px-6 pb-[calc(var(--safe-bottom)+40px)] pt-[calc(var(--safe-top)+40px)]">
      <h1 className="font-wider text-[30px] font-[750] leading-[1.12] tracking-[-0.6px] text-ink">Geo is building your plan</h1>
      <p className="mt-2.5 text-[15.5px] text-ink-65">This takes a few seconds.</p>
      <ul aria-live="polite" className="mt-10 flex flex-col gap-3">
        {ITEMS.map((item, i) => {
          const isDone = i < done
          return (
            <li key={item} className="flex h-16 items-center gap-4 rounded-[var(--radius-row)] bg-card px-4 outline outline-1 -outline-offset-1 outline-ink-08">
              <span className={cn('grid size-7 shrink-0 place-items-center rounded-full', isDone ? 'bg-ink text-cream' : 'border-[1.5px] border-ink-20')}>
                {isDone ? (
                  <motion.svg initial={reduce ? false : { scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={reduce ? reducedFade : spring.tap} viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.5l3 3 6-7" /></motion.svg>
                ) : (
                  <span className="size-2 rounded-full bg-ink-20 motion-safe:animate-pulse" />
                )}
              </span>
              <span className={cn('text-[16.5px] font-semibold', isDone ? 'text-ink' : 'text-ink-65')}>{item}</span>
              <span className="sr-only">{isDone ? 'done' : 'in progress'}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
