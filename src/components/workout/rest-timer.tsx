'use client'

import { useEffect, useRef, useState } from 'react'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { playBell } from '@/lib/audio'
import { reducedFade, spring } from '@/lib/motion'
import { DigitTiles } from './digit-tiles'

const MUTE_KEY = 'restTimerMuted'

interface RestTimerProps {
  isActive: boolean
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

export function RestTimer({ isActive, duration, onSkip, onComplete, resetToken }: RestTimerProps) {
  const [remaining, setRemaining] = useState(duration)
  const [target, setTarget] = useState(duration)
  const [muted, setMuted] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const reduce = useReducedMotion()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAtRef = useRef(0)
  const timerStartedRef = useRef(false)
  const targetRef = useRef(duration)

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
  const enter = reduce ? { initial: { opacity: 0 }, transition: reducedFade } : null

  const pill = (
      <motion.div
        key="pill"
        role="dialog" aria-label="Rest timer (minimised)"
        className="fixed bottom-[calc(96px+var(--safe-bottom))] right-4 z-30 origin-bottom-right"
        initial={enter?.initial ?? { opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }} transition={enter?.transition ?? spring.lens}
      >
        <button type="button" onClick={() => setMinimized(false)} aria-label="Expand rest timer" className="flex h-12 items-center gap-2 rounded-full bg-ink pl-3 pr-4 text-[16px] font-semibold tabular-nums text-cream shadow-[var(--shadow-raised)] transition-transform active:scale-[.95]">
          <svg viewBox="0 0 20 20" className="size-5 -rotate-90" aria-hidden="true">
            <circle cx="10" cy="10" r="8" fill="none" stroke="var(--color-cream-22)" strokeWidth="2.5" />
            <circle cx="10" cy="10" r="8" fill="none" stroke="var(--color-cream)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={50.27} strokeDashoffset={50.27 * (1 - progress)} />
          </svg>
          {clock}
        </button>
      </motion.div>
  )

  const card = (
    <motion.div
      key="card"
      role="dialog"
      aria-label="Rest timer"
      className="fixed bottom-[calc(96px+var(--safe-bottom))] left-4 right-4 z-30 mx-auto max-w-[calc(28rem-32px)] origin-bottom rounded-[24px] bg-ink p-5 text-cream shadow-[var(--shadow-raised)]"
      initial={enter?.initial ?? { opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      // Minimise shrinks it toward the pill's corner; skip and done let it sink back down.
      // AnimatePresence `custom` carries the live `minimized` to the leaving card (its own props are stale).
      variants={{ out: (toPill: boolean) => (reduce ? { opacity: 0, transition: reducedFade } : toPill ? { opacity: 0, scale: 0.4, x: 80, y: 40, transition: spring.sheet } : { opacity: 0, y: 24, scale: 0.96, transition: { duration: 0.18, ease: 'easeOut' } }) }}
      exit="out"
      transition={enter?.transition ?? spring.sheet}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-cream-60">Rest</p>
          <div className="mt-2"><DigitTiles text={tiles} label={clock} tone="dark" size="md" live /></div>
        </div>
        <div className="flex gap-1 self-start">
          <button type="button" onClick={toggleMute} aria-label={muted ? 'Unmute rest timer chime' : 'Mute rest timer chime'} className="grid size-11 place-items-center rounded-full text-cream-60 active:bg-cream-22"><SoundIcon muted={muted} /></button>
          <button type="button" onClick={() => setMinimized(true)} aria-label="Minimise rest timer" className="grid size-11 place-items-center rounded-full text-cream-60 active:bg-cream-22"><MinimiseIcon /></button>
        </div>
      </div>

      <div className="mt-4 h-1 overflow-hidden rounded-full bg-cream-22" aria-hidden="true">
        {/* A time meter: scaleX at a steady 1 s per tick, so it never re-lays out. */}
        <div className="h-full w-full origin-left rounded-full bg-cream transition-transform duration-1000 ease-linear" style={{ transform: `scaleX(${progress})` }} />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button type="button" onClick={() => adjust(-15)} aria-label="Subtract 15 seconds" className="h-11 rounded-full bg-cream-22 px-4 text-[14px] font-semibold text-cream tabular-nums transition-transform active:scale-[.95]">−15</button>
        <button type="button" onClick={() => adjust(15)} aria-label="Add 15 seconds" className="h-11 rounded-full bg-cream-22 px-4 text-[14px] font-semibold text-cream tabular-nums transition-transform active:scale-[.95]">+15</button>
        <button type="button" onClick={onSkip} aria-label="Skip rest timer" className="ml-auto h-11 rounded-full bg-cream px-5 text-[14px] font-semibold text-ink transition-transform active:scale-[.95]">Skip</button>
      </div>
    </motion.div>
  )

  return <AnimatePresence custom={minimized}>{isActive ? (minimized ? pill : card) : null}</AnimatePresence>
}
