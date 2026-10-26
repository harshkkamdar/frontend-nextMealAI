'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { playBell } from '@/lib/audio'
import { reducedFade, spring } from '@/lib/motion'
import { DigitTiles } from './digit-tiles'

const MUTE_KEY = 'restTimerMuted'

interface RestTimerProps {
  isActive: boolean
  /** "set 4 · 70 kg × 8": what the lifter does when the rest ends. */
  upNext?: string
  duration: number
  onSkip: () => void
  onComplete: () => void
  resetToken?: number
}

function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6.5 9H3v6h3.5l4.5 4V5Z" />
      {muted ? <><path d="m16 9 5 6M21 9l-5 6" /></> : <><path d="M15 9.5a4 4 0 0 1 0 5M18 7a7 7 0 0 1 0 10" /></>}
    </svg>
  )
}

function MinimiseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
}

export function RestTimer({ isActive, duration, onSkip, onComplete, resetToken, upNext }: RestTimerProps) {
  const [remaining, setRemaining] = useState(duration)
  const [target, setTarget] = useState(duration)
  const [muted, setMuted] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const reduce = useReducedMotion()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAtRef = useRef(0)
  const timerStartedRef = useRef(false)
  const targetRef = useRef(duration)
  const skipRef = useRef<HTMLButtonElement>(null)

  // The full screen takes focus on its main action; the session under it is covered.
  useEffect(() => {
    if (isActive && !minimized) skipRef.current?.focus({ preventScroll: true })
  }, [isActive, minimized, resetToken])

  useEffect(() => {
    try { setMuted(localStorage.getItem(MUTE_KEY) === '1') } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (remaining === 0 && timerStartedRef.current) {
      timerStartedRef.current = false
      if (!muted) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([200, 100, 200])
        playBell()
      }
      onComplete()
    }
  }, [remaining, muted, onComplete])

  useEffect(() => {
    if (isActive) {
      // Every new rest opens full screen, even if the last one was minimised.
      setMinimized(false)
      setRemaining(duration)
      setTarget(duration)
      targetRef.current = duration
      startedAtRef.current = Date.now()
      timerStartedRef.current = true

      intervalRef.current = setInterval(() => {
        setRemaining((previous) => {
          if (previous <= 1) {
            clearInterval(intervalRef.current!)
            return 0
          }
          return previous - 1
        })
      }, 1000)

      const onVisible = () => {
        if (document.hidden || !startedAtRef.current) return
        const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000)
        const nextRemaining = Math.max(0, targetRef.current - elapsed)
        if (nextRemaining <= 0 && intervalRef.current) clearInterval(intervalRef.current)
        setRemaining(nextRemaining)
      }
      document.addEventListener('visibilitychange', onVisible)

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        document.removeEventListener('visibilitychange', onVisible)
      }
    }

    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [isActive, duration, resetToken])

  const adjust = (delta: number) => {
    timerStartedRef.current = true
    startedAtRef.current = Date.now()
    const nextRemaining = Math.max(1, remaining + delta)
    targetRef.current = nextRemaining
    setRemaining(nextRemaining)
    setTarget(nextRemaining)
  }

  const toggleMute = () => {
    setMuted((current) => {
      const next = !current
      try { localStorage.setItem(MUTE_KEY, next ? '1' : '0') } catch { /* ignore */ }
      return next
    })
  }

  const progress = target > 0 ? remaining / target : 0
  const clock = `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}`
  const tiles = `${String(Math.min(99, Math.floor(remaining / 60))).padStart(2, '0')}:${(remaining % 60).toString().padStart(2, '0')}`

  // C3: the rest screen comes forward over the session; minimised, it shrinks into a pill at the top centre
  // (transform-origin top), and the pill grows back into the screen. Skip and done let it fade back.
  const pill = (
    <motion.div
      key="pill"
      role="dialog" aria-label="Rest timer (minimised)"
      className="fixed left-1/2 top-[calc(8px+var(--safe-top))] z-[85] -translate-x-1/2"
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }} transition={reduce ? reducedFade : spring.lens}
    >
      <button type="button" onClick={() => setMinimized(false)} aria-label="Expand rest timer" className="flex h-12 items-center gap-2 rounded-full bg-ink pl-3 pr-4 text-[16px] font-bold tabular-nums text-cream shadow-[var(--shadow-raised)] transition-transform active:scale-[.95]">
        <svg viewBox="0 0 20 20" className="size-5 -rotate-90" aria-hidden="true">
          <circle cx="10" cy="10" r="8" fill="none" stroke="var(--color-cream-22)" strokeWidth="2.5" />
          <circle cx="10" cy="10" r="8" fill="none" stroke="var(--color-cream)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={50.27} strokeDashoffset={50.27 * (1 - progress)} />
        </svg>
        {clock}
      </button>
    </motion.div>
  )

  const screen = (
    <motion.div
      key="screen"
      role="dialog" aria-modal="true" aria-label="Rest timer"
      className="fixed inset-0 z-[85] mx-auto flex w-full max-w-md origin-top flex-col bg-ink px-5 text-cream"
      style={{ paddingTop: 'calc(16px + var(--safe-top))', paddingBottom: 'calc(16px + var(--safe-bottom))' }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      // AnimatePresence `custom` carries the live `minimized` to the leaving screen (its own props are stale).
      variants={{ out: (toPill: boolean) => (reduce ? { opacity: 0, transition: reducedFade } : toPill ? { opacity: 0, scale: 0.2, transition: spring.sheet } : { opacity: 0, scale: 0.97, transition: { duration: 0.2, ease: 'easeOut' } }) }}
      exit="out"
      transition={reduce ? reducedFade : spring.sheet}
    >
      <div className="flex items-center gap-1">
        <h2 className="text-body-sm font-semibold text-cream-60">Rest</h2>
        <button type="button" onClick={toggleMute} aria-label={muted ? 'Unmute rest timer chime' : 'Mute rest timer chime'} className="ml-auto grid size-11 place-items-center rounded-full text-cream-60 active:bg-cream-22"><SoundIcon muted={muted} /></button>
        <button type="button" onClick={() => setMinimized(true)} aria-label="Minimise rest timer" className="-mr-2 grid size-11 place-items-center rounded-full text-cream-60 active:bg-cream-22"><MinimiseIcon /></button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-5">
        <DigitTiles text={tiles} label={clock} tone="dark" size="xl" live />
        <div className="h-1 w-[200px] overflow-hidden rounded-full bg-cream-22" aria-hidden="true">
          {/* A time meter: scaleX at a steady 1 s per tick, so it never re-lays out. */}
          <div className="h-full w-full origin-left rounded-full bg-cream transition-transform duration-1000 ease-linear" style={{ transform: `scaleX(${progress})` }} />
        </div>
      </div>

      {upNext ? (
        <p className="rounded-[20px] bg-cream/10 px-4 py-3.5 text-body-sm">
          <span className="text-cream-60">Up next</span>
          <b className="mt-0.5 block break-words text-[17px] font-bold">{upNext}</b>
        </p>
      ) : null}
      <div className="mt-3 grid grid-cols-[1fr_1fr_1.3fr] gap-2">
        <button type="button" onClick={() => adjust(-15)} aria-label="Subtract 15 seconds" className="h-[54px] rounded-[18px] bg-cream-22 text-body font-bold tabular-nums transition-transform active:scale-[.96]">−15</button>
        <button type="button" onClick={() => adjust(15)} aria-label="Add 15 seconds" className="h-[54px] rounded-[18px] bg-cream-22 text-body font-bold tabular-nums transition-transform active:scale-[.96]">+15</button>
        <button type="button" ref={skipRef} onClick={onSkip} aria-label="Skip rest timer" className="h-[54px] rounded-[18px] bg-card text-body font-bold text-ink transition-transform active:scale-[.96]">Skip rest</button>
      </div>
    </motion.div>
  )

  if (typeof document === 'undefined') return null
  // Portalled: the route frame's transform would otherwise make the fixed screen ride with the page.
  return createPortal(<AnimatePresence custom={minimized}>{isActive ? (minimized ? pill : screen) : null}</AnimatePresence>, document.body)
}
