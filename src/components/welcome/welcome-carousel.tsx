'use client'

import { useRef, useState, type ComponentType, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform, type AnimationPlaybackControls, type MotionValue } from 'framer-motion'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { Wordmark } from '@/components/ui/fiqr/wordmark'
import { leaveThen } from '@/lib/page-transition'
import { reducedFade, spring } from '@/lib/motion'
import { haptic } from '@/lib/platform/app'
import { cn } from '@/lib/utils'
import { CheckInBento, FoodBento, GeoBento, SlideDepth, TrainBento } from './welcome-slides'
import { flickTarget, handoff, scrub } from './stage'

const SLIDES: { title: string; line: string; Bento: ComponentType<{ live: boolean; active: boolean }> }[] = [
  { title: 'Food', line: 'Snap a meal or describe it. Geo counts the calories and macros for you.', Bento: FoodBento },
  { title: 'Train', line: 'A program built around your week, your gear and anything that hurts.', Bento: TrainBento },
  { title: 'Geo', line: 'Your coach in chat. Ask about food or training at any hour.', Bento: GeoBento },
  { title: 'Check-in', line: 'Every week Geo reads your trend and adjusts your plan.', Bento: CheckInBento },
]
const LAST = SLIDES.length - 1
const STEP = 12 // progress pill: 6 px dot + 6 px gap
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Pre-sign-up tour on one fixed stage (motion-feel.md 3a). A single fractional value `p` (0..3) drives every slide:
 *  the finger scrubs it, release hands the drag velocity to the glide spring, Continue and the arrow keys retarget it.
 *  React re-renders only when the settled slide changes. The last slide's Get started is the only orange action. */
export function WelcomeCarousel() {
  const router = useRouter()
  const reduce = useReducedMotion() ?? false
  const p = useMotionValue(0)
  const stage = useRef<HTMLDivElement>(null)
  const width = useRef(390)
  const start = useRef(0)
  const target = useRef(0)
  const anim = useRef<AnimationPlaybackControls | null>(null)
  const [index, setIndex] = useState(0)
  const [seen, setSeen] = useState(1) // slides [0, seen) have played their fill
  const [dragging, setDragging] = useState(false)
  const last = index === LAST

  useMotionValueEvent(p, 'change', (v) => {
    const i = clamp(Math.round(v), 0, LAST)
    setIndex(i)
    setSeen((s) => Math.max(s, i + 1))
  })

  /** Settle on slide n from wherever p is now, carrying `velocity` (slides per second). Interruptible: a new call retargets. */
  function go(n: number, velocity = 0) {
    const to = clamp(n, 0, LAST)
    if (to !== target.current) void haptic('selection')
    target.current = to
    anim.current?.stop()
    anim.current = animate(p, to, reduce ? reducedFade : { ...spring.glide, velocity })
  }

  function onContinue() {
    if (last) return leaveThen(() => router.push('/signup'))
    go(target.current + 1)
  }

  return (
    <div data-page className="relative flex h-dvh flex-col overflow-hidden bg-cream">
      <Mist p={p} reduce={reduce} dragging={dragging} />

      <div className="relative px-5 pt-[calc(var(--safe-top)+18px)]">
        <Wordmark size={26} />
      </div>

      <motion.div
        ref={stage}
        tabIndex={0}
        onKeyDown={(e) => {
          const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key]
          if (step === undefined) return
          e.preventDefault()
          go(target.current + step)
        }}
        onPanStart={() => {
          anim.current?.stop() // grab mid-flight: the stage stops under the finger
          start.current = p.get()
          width.current = stage.current?.clientWidth || width.current
          setDragging(true)
        }}
        onPan={(_, info) => p.set(scrub(start.current, info.offset.x, width.current, LAST))}
        onPanEnd={(_, info) => {
          setDragging(false)
          go(flickTarget(p.get(), start.current, info.velocity.x, width.current, LAST), -info.velocity.x / width.current)
        }}
        aria-roledescription="carousel"
        aria-label="What FIQR does"
        className="relative flex-1 touch-pan-y select-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink"
      >
        {SLIDES.map(({ title, line, Bento }, i) => (
          <Slide key={title} p={p} i={i} reduce={reduce} title={title} line={line} current={i === index}>
            <Bento live={i < seen} active={i === index} />
          </Slide>
        ))}
      </motion.div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-cream from-75% to-transparent px-5 pb-[calc(var(--safe-bottom)+20px)] pt-10 [@media(max-height:740px)]:pb-[calc(var(--safe-bottom)+8px)] [@media(max-height:740px)]:pt-5">
        <Pill p={p} reduce={reduce} />
        <PrimaryButton type="button" onClick={onContinue} className={cn('relative h-[58px] rounded-full py-0 shadow-none', !last && 'bg-transparent')}>
          {/* Ink base with the orange layer fading over it: the fill changes by opacity, never background-color. */}
          <span aria-hidden="true" className="absolute inset-0 rounded-full bg-ink" />
          <span aria-hidden="true" className={cn('absolute inset-0 rounded-full bg-accent shadow-[var(--shadow-action)] transition-opacity duration-150 ease-out', last ? 'opacity-100' : 'opacity-0')} />
          <span className="relative grid">
            <span aria-hidden={last || undefined} className={cn('col-start-1 row-start-1 transition-opacity duration-150 ease-out', last && 'opacity-0')}>Continue</span>
            <span aria-hidden={!last || undefined} className={cn('col-start-1 row-start-1 transition-opacity duration-150 ease-out', !last && 'opacity-0')}>Get started</span>
          </span>
        </PrimaryButton>
        <button type="button" onClick={() => leaveThen(() => router.push('/login'))} className="mx-auto mt-1 flex h-11 items-center px-4 text-[15px] font-semibold text-ink-65">
          I have an account
        </button>
      </div>
    </div>
  )
}

/** One slide, stacked on the others. d = p - i (d < 0 is arriving from the right, d > 0 has left). Text hands off in turn
 *  instead of overlapping: the outgoing title and line are gone by mid-drag and the incoming ones start after it, so two
 *  slides' words never sit on top of each other. The title travels 48 px, the line 36 px and the cards 20-36 px. */
function Slide({ p, i, reduce, title, line, current, children }: { p: MotionValue<number>; i: number; reduce: boolean; title: string; line: string; current: boolean; children: ReactNode }) {
  const d = useTransform(p, (v) => clamp(v - i, -1, 1))
  const m = reduce ? 0 : 1
  const opacity = useTransform(d, (v) => handoff(v, 0.5, 0.5))
  const scale = useTransform(d, (v) => 1 - Math.abs(v) * 0.06 * m)
  const titleX = useTransform(d, (v) => -v * 48 * m)
  const lineX = useTransform(d, (v) => -v * 36 * m)
  // First paint only, slide 1: title, line and bento start 0 / 40 / 120 ms apart with their own rise, so nothing enters as one block.
  // The intro sits on wrappers so it never fights the scrubbed opacity on the text itself.
  const intro = (dy: number, delay: number) => (i === 0 ? { initial: { opacity: 0, y: dy * m }, animate: { opacity: 1, y: 0 }, transition: reduce ? reducedFade : { ...spring.glide, delay } } : {})
  return (
    <motion.section
      role="group"
      aria-roledescription="slide"
      aria-label={`${i + 1} of ${SLIDES.length}: ${title}`}
      aria-hidden={!current || undefined}
      style={{ scale }}
      className={cn('absolute inset-0 flex flex-col px-5 pb-[calc(var(--safe-bottom)+176px)] pt-[6vh] [@media(max-height:740px)]:pb-[calc(var(--safe-bottom)+150px)] [@media(max-height:740px)]:pt-[2vh]', !current && 'pointer-events-none')}
    >
      <motion.div {...intro(0, 0)}><motion.h1 style={{ x: titleX, opacity }} className="font-wider text-[42px] font-[760] leading-none tracking-[-1.4px] text-ink [@media(max-height:740px)]:text-[38px]">{title}</motion.h1></motion.div>
      <motion.div {...intro(8, 0.04)} className="mt-3"><motion.p style={{ x: lineX, opacity }} className="max-w-[30ch] text-pretty text-[16.5px] leading-[1.45] text-ink-80">{line}</motion.p></motion.div>
      {/* Titles sit at the same height on every slide; the bento centres in the space left. Critic round 3 (24 Oct 2026): grouping the cards under the title instead opened a worse gap at the top, so this layout stays. */}
      <div className="flex flex-1 items-center py-6 [@media(max-height:740px)]:py-3">
        <motion.div className="w-full" {...intro(12, 0.12)}>
          <SlideDepth.Provider value={d}>{children}</SlideDepth.Provider>
        </motion.div>
      </div>
    </motion.section>
  )
}

/** Per-slide mist tints (Q2 alpha tints): Food accent 9%, Train ink 9%, Geo ink 6% + white 60%, Check-in accent 6%.
 *  Each blob has one fixed colour; only its x, y, scale and opacity follow p, so the tint morphs with the finger and the
 *  softness lives in the gradient, not in a blur. Nothing here moves unless p moves (N12). */
const BLOBS = [
  { fill: 'rgba(232,98,42,.09)', at: 'left-[-22%] top-[-6%]', x: [0, 70, 20, 80], y: [0, 40, 90, 30], s: [1.1, 0.9, 1, 1.15], o: [1, 0.15, 0.1, 0.67] },
  { fill: 'rgba(17,28,53,.09)', at: 'right-[-28%] top-[26%]', x: [0, -60, -20, 40], y: [40, -10, 50, 0], s: [0.9, 1.15, 1, 0.95], o: [0.25, 1, 0.67, 0.25] },
  { fill: 'rgba(255,255,255,.6)', at: 'left-[-14%] bottom-[8%]', x: [-20, 30, 90, 10], y: [0, -40, -90, -30], s: [1, 0.95, 1.15, 0.9], o: [0.3, 0.3, 1, 0.3] },
]

function Mist({ p, reduce, dragging }: { p: MotionValue<number>; reduce: boolean; dragging: boolean }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {BLOBS.map((b) => <Blob key={b.fill} p={p} blob={b} reduce={reduce} dragging={dragging} />)}
    </div>
  )
}

function Blob({ p, blob, reduce, dragging }: { p: MotionValue<number>; blob: (typeof BLOBS)[number]; reduce: boolean; dragging: boolean }) {
  const still = (a: number[]) => (reduce ? a.map(() => a[0]) : a) // reduced motion: tints still crossfade, blobs stay put
  const x = useTransform(p, [0, 1, 2, 3], still(blob.x))
  const y = useTransform(p, [0, 1, 2, 3], still(blob.y))
  const scale = useTransform(p, [0, 1, 2, 3], still(blob.s))
  const opacity = useTransform(p, [0, 1, 2, 3], blob.o)
  return <motion.div className={cn('absolute aspect-square w-[70vw] rounded-full', blob.at)} style={{ x, y, scale, opacity, background: `radial-gradient(closest-side, ${blob.fill}, transparent)`, willChange: dragging ? 'transform' : 'auto' }} />
}

/** Liquid progress pill: one ink dot rides the track at p * 12 px and stretches to 2.6x between dots, round again when p lands.
 *  Reduced motion: the dots crossfade in place instead. */
function Pill({ p, reduce }: { p: MotionValue<number>; reduce: boolean }) {
  const c = useTransform(p, (v) => clamp(v, 0, LAST))
  const x = useTransform(c, (v) => v * STEP)
  const scaleX = useTransform(c, (v) => 1 + 1.6 * (1 - Math.abs(2 * (v - Math.floor(v)) - 1)))
  return (
    <div aria-hidden="true" className="relative mx-auto mb-5 flex w-fit gap-1.5 [@media(max-height:740px)]:mb-3">
      {SLIDES.map((s, i) => <Dot key={s.title} c={c} i={i} reduce={reduce} />)}
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
