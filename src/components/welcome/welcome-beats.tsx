'use client'

import { useEffect, useRef, useState, type ComponentType, type CSSProperties, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform, type AnimationPlaybackControls, type MotionValue } from 'framer-motion'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { RoundButton } from '@/components/ui/fiqr/round-button'
import { Wordmark } from '@/components/ui/fiqr/wordmark'
import { auroraSurface, useAuroraScene, type SceneName } from '@/components/onboarding/aurora'
import { arrivalDir, BEHIND, clearArrival, depthTo, FRONT, type DepthDir } from '@/components/onboarding/depth-nav'
import { reducedFade, spring } from '@/lib/motion'
import { haptic } from '@/lib/platform/app'
import { cn } from '@/lib/utils'
import { CheckInVisual, FoodVisual, GeoVisual, TrainVisual, type BeatVisualProps } from './beat-visuals'
import { beatDepth, flickTarget, scrub } from './stage'

const BEATS: { title: string; line: string; Visual: ComponentType<BeatVisualProps> }[] = [
  { title: 'Food', line: 'Snap a meal or describe it. Geo counts the calories and macros for you.', Visual: FoodVisual },
  { title: 'Train', line: 'A program built around your week, your gear and anything that hurts.', Visual: TrainVisual },
  { title: 'Geo', line: 'Your coach in chat. Ask about food or training at any hour.', Visual: GeoVisual },
  { title: 'Check-in', line: 'Every week Geo reads your trend and adjusts your plan.', Visual: CheckInVisual },
]
const LAST = BEATS.length - 1
const STEP = 12 // progress dots: 6 px dot + 6 px gap
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** The shared stage under every beat's visual: below the title block, ending just above the dots (the dots, CTA and link take 200 px plus the safe area). */
const STAGE: CSSProperties = { top: 'calc(var(--safe-top) + 236px)', height: 'min(420px, calc(100dvh - var(--safe-top) - var(--safe-bottom) - 236px - 200px))' }
/** The stage leans a little differently on each beat, so it settles like a card being set down. */
const LEAN = ['none', 'translateY(4px) rotate(-.6deg)', 'translateY(-2px) rotate(.5deg)', 'translateY(2px) rotate(-.3deg)']

/**
 * Pre-sign-up welcome (mocks/aurora-onboarding.html): four beats over one glass stage on the Aurora. Beats change in
 * depth, not sideways: the beat you leave steps back and fades, the next arrives from just in front, its title and
 * visual separating at different rates. One fractional value `p` (0..3) drives it all: the finger scrubs it, release
 * hands the drag velocity to the spring, Continue, a tap and the arrow keys retarget it. Get started is the only orange action.
 */
export function WelcomeBeats() {
  const router = useRouter()
  const reduce = useReducedMotion() ?? false
  const p = useMotionValue(0)
  const region = useRef<HTMLDivElement>(null)
  const width = useRef(390)
  const start = useRef(0)
  const target = useRef(0)
  const panned = useRef(false)
  const anim = useRef<AnimationPlaybackControls | null>(null)
  const [index, setIndex] = useState(0)
  const [seen, setSeen] = useState(1) // beats [0, seen) have played their fill
  const [arrival] = useState<DepthDir | null>(() => arrivalDir())
  useEffect(() => { clearArrival() }, [])
  useAuroraScene(`w${index}` as SceneName)
  const last = index === LAST

  useMotionValueEvent(p, 'change', (v) => {
    const i = clamp(Math.round(v), 0, LAST)
    setIndex(i)
    setSeen((s) => Math.max(s, i + 1))
  })

  /** Settle on beat n from wherever p is now, carrying `velocity` (beats per second). Interruptible: a new call retargets. */
  function go(n: number, velocity = 0) {
    const to = clamp(n, 0, LAST)
    if (to !== target.current) void haptic('selection')
    target.current = to
    anim.current?.stop()
    anim.current = animate(p, to, reduce ? reducedFade : { ...spring.glide, velocity })
  }

  function onContinue() {
    if (last) return depthTo(() => router.push('/signup'))
    go(target.current + 1)
  }

  return (
    <div data-page className="relative h-dvh overflow-hidden">
      <div data-chrome className={cn('relative z-10 flex h-11 items-center px-gutter', 'page-in')} style={{ marginTop: 'calc(var(--safe-top) + 8px)' }}>
        <RoundButton aria-label="Back" onClick={() => go(target.current - 1)} inert={index === 0 || undefined} className={cn('transition-[opacity,scale,visibility] duration-300 ease-out', index === 0 && 'invisible scale-75 opacity-0')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </RoundButton>
        <div className="absolute left-1/2 -translate-x-1/2"><Wordmark size={22} /></div>
      </div>

      <motion.div
        data-depth
        className="absolute inset-0"
        style={{ transformOrigin: '50% 42%' }}
        initial={arrival === null ? false : { opacity: 0, scale: reduce || arrival === 0 ? 1 : arrival > 0 ? FRONT : BEHIND }}
        animate={{ opacity: 1, scale: 1 }}
        transition={reduce ? reducedFade : { scale: spring.page, opacity: { duration: 0.3, delay: 0.08 } }}
      >
        <div aria-hidden="true" className={cn('absolute inset-x-gutter rounded-[30px] transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)]', auroraSurface)} style={{ ...STAGE, transform: reduce ? 'none' : LEAN[index] }} />
        <motion.div
          ref={region}
          tabIndex={0}
          role="group"
          aria-label="What FIQR does"
          onKeyDown={(e) => {
            const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key]
            if (step === undefined) return
            e.preventDefault()
            go(target.current + step)
          }}
          onPointerDownCapture={() => { panned.current = false }}
          onPanStart={() => {
            panned.current = true
            anim.current?.stop() // grab mid-flight: the beats stop under the finger
            start.current = p.get()
            width.current = region.current?.clientWidth || width.current
          }}
          onPan={(_, info) => p.set(scrub(start.current, info.offset.x, width.current, LAST))}
          onPanEnd={(_, info) => go(flickTarget(p.get(), start.current, info.velocity.x, width.current, LAST), -info.velocity.x / width.current)}
          // A tap on the welcome (not a swipe) moves to the next beat; it never leaves the welcome.
          onTap={() => { if (!panned.current && target.current < LAST) go(target.current + 1) }}
          className="absolute inset-0 touch-pan-y select-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink"
        >
          {BEATS.map(({ title, line, Visual }, i) => (
            <Beat key={title} p={p} i={i} reduce={reduce} title={title} line={line} current={i === index}>
              <Visual live={i < seen} active={i === index} />
            </Beat>
          ))}
        </motion.div>
      </motion.div>

      <div data-chrome className={cn('absolute inset-x-0 bottom-0 z-10 px-gutter pb-[calc(var(--safe-bottom)+16px)] pt-6', 'page-in')}>
        <Dots p={p} reduce={reduce} />
        <PrimaryButton type="button" onClick={onContinue} className={cn('relative', !last && 'bg-transparent')}>
          {/* Ink base with the orange layer fading over it: the fill changes by opacity, never background-color. Label colours match
              how PrimaryButton renders on orange today (ink; its class merge drops text-cream), cream on the ink base. */}
          <span aria-hidden="true" className="absolute inset-0 rounded-full bg-ink" />
          <span aria-hidden="true" className={cn('absolute inset-0 rounded-full bg-accent shadow-[var(--shadow-action)] transition-opacity duration-150 ease-out', last ? 'opacity-100' : 'opacity-0')} />
          <span className="relative grid">
            <span aria-hidden={last || undefined} className={cn('col-start-1 row-start-1 text-cream transition-opacity duration-150 ease-out', last && 'opacity-0')}>Continue</span>
            <span aria-hidden={!last || undefined} className={cn('col-start-1 row-start-1 text-ink transition-opacity duration-150 ease-out', !last && 'opacity-0')}>Get started</span>
          </span>
        </PrimaryButton>
        <button type="button" onClick={() => depthTo(() => router.push('/login'))} className="mx-auto mt-1 flex h-11 items-center px-4 text-body-sm font-semibold text-ink">
          I have an account
        </button>
      </div>
    </div>
  )
}

/**
 * One beat, stacked on the others. d = p - i: d > 0 has stepped back (smaller, title and visual drift up), d < 0 is
 * arriving from in front (larger, drifting down into place). Opacity clears by about 0.6 of the way, so two beats'
 * words never sit on top of each other. The visual travels 2.2x the title, so the layers separate in depth.
 */
function Beat({ p, i, reduce, title, line, current, children }: { p: MotionValue<number>; i: number; reduce: boolean; title: string; line: string; current: boolean; children: ReactNode }) {
  const d = useTransform(p, (v) => clamp(v - i, -1, 1))
  const opacity = useTransform(d, (v) => beatDepth(v, reduce).opacity)
  const scale = useTransform(d, (v) => beatDepth(v, reduce).scale)
  const y = useTransform(d, (v) => beatDepth(v, reduce).y)
  const visualY = useTransform(y, (v) => v * 2.2)
  // First paint only, beat 1: title, line and visual rise 0 / 40 / 120 ms apart, so nothing enters as one block.
  const intro = (n: number): CSSProperties | undefined => (i === 0 ? ({ '--i': n } as CSSProperties) : undefined)
  return (
    <motion.section
      role="group"
      aria-label={`${i + 1} of ${BEATS.length}: ${title}`}
      aria-hidden={!current || undefined}
      style={{ opacity, scale, transformOrigin: '50% 42%' }}
      className={cn('absolute inset-0', !current && 'pointer-events-none')}
    >
      <motion.div style={{ y, top: 'calc(var(--safe-top) + 84px)' }} className="absolute inset-x-0 px-gutter">
        <h1 className={cn('font-wider text-[36px] font-[800] leading-none tracking-[-0.03em] text-ink', i === 0 && 'rise')} style={intro(0)}>{title}</h1>
        <p className={cn('mt-3 max-w-[32ch] text-pretty text-body text-ink-80', i === 0 && 'rise')} style={intro(1)}>{line}</p>
      </motion.div>
      <motion.div style={{ ...STAGE, y: visualY }} className="absolute inset-x-gutter overflow-hidden p-4">
        <div className={cn('h-full', i === 0 && 'rise')} style={intro(3)}>{children}</div>
      </motion.div>
    </motion.section>
  )
}

/** Liquid progress dots: one ink dot rides the track at p * 12 px and stretches between dots, round again when p lands.
 *  Reduced motion: the dots crossfade in place instead. */
function Dots({ p, reduce }: { p: MotionValue<number>; reduce: boolean }) {
  const c = useTransform(p, (v) => clamp(v, 0, LAST))
  const x = useTransform(c, (v) => v * STEP)
  const scaleX = useTransform(c, (v) => 1 + 1.6 * (1 - Math.abs(2 * (v - Math.floor(v)) - 1)))
  return (
    <div aria-hidden="true" className="relative mx-auto mb-14 flex w-fit gap-1.5">
      {BEATS.map((b, i) => <Dot key={b.title} c={c} i={i} reduce={reduce} />)}
      {!reduce && <motion.span className="absolute left-0 top-0 size-1.5 rounded-full bg-ink" style={{ x, scaleX }} />}
    </div>
  )
}

function Dot({ c, i, reduce }: { c: MotionValue<number>; i: number; reduce: boolean }) {
  const opacity = useTransform(c, (v) => Math.max(0, 1 - Math.abs(v - i)))
  return (
    <span className="relative size-1.5 rounded-full bg-ink-20">
      {reduce && <motion.span className="absolute inset-0 rounded-full bg-ink" style={{ opacity }} />}
    </span>
  )
}
