'use client'

import { useRef, useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { Wordmark } from '@/components/ui/fiqr/wordmark'
import { leaveThen } from '@/lib/page-transition'
import { haptic } from '@/lib/platform/app'
import { cn } from '@/lib/utils'
import { CheckInBento, FoodBento, GeoBento, TrainBento } from './welcome-slides'

const SLIDES = [
  { title: 'Food', line: 'Snap a meal or describe it. Geo counts the calories and macros for you.', Bento: FoodBento },
  { title: 'Train', line: 'A program built around your week, your gear and anything that hurts.', Bento: TrainBento },
  { title: 'Geo', line: 'Your coach in chat. Ask about food or training at any hour.', Bento: GeoBento },
  { title: 'Check-in', line: 'Every week Geo reads your trend and adjusts your plan.', Bento: CheckInBento },
]

/** Pre-sign-up tour: swipe or tap Continue; the last slide's Get started is the only orange action. */
export function WelcomeCarousel() {
  const router = useRouter()
  const scroller = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [seen, setSeen] = useState(1) // slides [0, seen) have played their fill
  const last = active === SLIDES.length - 1

  function onScroll() {
    const el = scroller.current
    if (!el) return
    const i = Math.round(el.scrollLeft / el.clientWidth)
    if (i === active) return
    void haptic('selection')
    setActive(i)
    setSeen((s) => Math.max(s, i + 1))
  }

  function onContinue() {
    if (last) return leaveThen(() => router.push('/signup'))
    const el = scroller.current
    el?.scrollTo({ left: (active + 1) * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <div data-page className="relative flex min-h-dvh flex-col overflow-hidden bg-cream">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(90% 50% at 85% 8%, rgba(17,28,53,.09), transparent 70%), radial-gradient(70% 40% at 0% 70%, rgba(17,28,53,.06), transparent 70%)' }} />

      <div className="relative px-5 pt-[calc(var(--safe-top)+18px)]">
        <Wordmark size={26} />
      </div>

      <div
        ref={scroller}
        onScroll={onScroll}
        tabIndex={0}
        onKeyDown={(e) => {
          const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key]
          if (step === undefined) return
          e.preventDefault()
          const el = scroller.current
          el?.scrollTo({ left: Math.min(SLIDES.length - 1, Math.max(0, active + step)) * el.clientWidth, behavior: 'smooth' })
        }}
        aria-roledescription="carousel"
        aria-label="What FIQR does"
        className="scrollbar-hide relative flex flex-1 snap-x outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink snap-mandatory overflow-x-auto overscroll-x-contain"
      >
        {SLIDES.map(({ title, line, Bento }, i) => (
          <section
            key={title}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${SLIDES.length}: ${title}`}
            aria-hidden={i !== active || undefined}
            className="flex w-full shrink-0 snap-center snap-always flex-col px-5 pb-[calc(var(--safe-bottom)+176px)] pt-[6vh] [@media(max-height:740px)]:pb-[calc(var(--safe-bottom)+150px)] [@media(max-height:740px)]:pt-[2vh]"
          >
            <h1 className={cn('font-wider text-[46px] font-[760] leading-none tracking-[-1.4px] text-ink [@media(max-height:740px)]:text-[38px]', i === 0 && 'rise')}>{title}</h1>
            <p className={cn('mt-3 max-w-[30ch] text-pretty text-[16.5px] leading-[1.45] text-ink-80', i === 0 && 'rise')} style={{ '--i': 1 } as CSSProperties}>{line}</p>
            {/* Titles sit at the same height on every slide; the bento centres in the space left. */}
            <div className="flex flex-1 items-center py-6 [@media(max-height:740px)]:py-3">
              <div className={cn('w-full', i === 0 && 'rise')} style={{ '--i': 2 } as CSSProperties}>
                <Bento live={i < seen} active={i === active} />
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-cream from-75% to-transparent px-5 pb-[calc(var(--safe-bottom)+20px)] pt-10 [@media(max-height:740px)]:pb-[calc(var(--safe-bottom)+8px)] [@media(max-height:740px)]:pt-5">
        <div aria-hidden="true" className="mb-5 flex justify-center gap-1.5 [@media(max-height:740px)]:mb-3">
          {SLIDES.map((s, i) => (
            <span key={s.title} className={cn('h-1.5 rounded-full transition-[width,background-color] duration-300', i === active ? 'w-5 bg-ink' : 'w-1.5 bg-ink-20')} />
          ))}
        </div>
        <PrimaryButton type="button" onClick={onContinue} className={cn('h-[58px] rounded-full py-0', !last && 'bg-ink shadow-none')}>
          {last ? 'Get started' : 'Continue'}
        </PrimaryButton>
        <button type="button" onClick={() => leaveThen(() => router.push('/login'))} className="mx-auto mt-1 flex h-11 items-center px-4 text-[15px] font-semibold text-ink-65">
          I have an account
        </button>
      </div>
    </div>
  )
}
