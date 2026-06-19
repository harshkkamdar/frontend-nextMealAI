'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { playBell } from '@/lib/audio'

interface RestTimerProps {
  isActive: boolean
  duration: number // seconds
  onSkip: () => void
  onComplete: () => void
  /**
   * FB-05 tick-ahead fix. Bumped by the parent on every set completion so the
   * countdown resets to full `duration` even when `duration` itself is
   * unchanged (common: multiple sets within one exercise share rest_seconds).
   * Without this, ticking a second set while the timer is running would allow
   * the user to cheese the rest period.
   */
  resetToken?: number
}

export function RestTimer({ isActive, duration, onSkip, onComplete, resetToken }: RestTimerProps) {
  const [remaining, setRemaining] = useState(duration)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  // FB-R4-02 — anchor timestamp so we can recalculate remaining on tab refocus
  const startedAtRef = useRef<number>(0)
  // Track whether the timer has been started so the completion effect doesn't
  // fire on mount when remaining happens to equal 0.
  const timerStartedRef = useRef(false)

  // Completion side-effects — kept OUT of state updaters to avoid the React
  // "Cannot update a component while rendering a different component" error.
  useEffect(() => {
    if (remaining === 0 && timerStartedRef.current) {
      timerStartedRef.current = false
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([200, 100, 200])
      }
      playBell()
      onCompleteRef.current()
    }
  }, [remaining])

  useEffect(() => {
    if (isActive) {
      setRemaining(duration)
      startedAtRef.current = Date.now()
      timerStartedRef.current = true

      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      // FB-R4-02 — recalculate remaining when tab regains focus. Mobile
      // browsers throttle/kill setInterval when the app is backgrounded.
      const onVisible = () => {
        if (document.hidden || !startedAtRef.current) return
        const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000)
        const newRemaining = Math.max(0, duration - elapsed)
        if (newRemaining <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          // Setting remaining to 0 triggers the completion effect above.
          setRemaining(0)
        } else {
          setRemaining(newRemaining)
        }
      }
      document.addEventListener('visibilitychange', onVisible)

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        document.removeEventListener('visibilitychange', onVisible)
      }
    }

    // Not active — clear any lingering interval from a previous cycle.
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [isActive, duration, resetToken])

  if (!isActive) return null

  const progress = duration > 0 ? remaining / duration : 0
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const R = 54
  const CIRC = 2 * Math.PI * R

  // Full-screen orange "rest" takeover (pomodoro-style). The whole screen goes
  // accent-orange with a big ring countdown; the user can Skip at any time.
  return (
    <motion.div
      key="rest-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      role="dialog"
      aria-modal="true"
      aria-label="Rest timer"
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-accent text-white px-6"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/80 mb-8">Rest</p>

      <div className="relative w-48 h-48 flex items-center justify-center mb-10">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="7" />
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="white"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <span className="text-[3.25rem] font-bold tabular-nums leading-none" aria-live="polite">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
      </div>

      <button
        onClick={onSkip}
        aria-label="Skip rest timer"
        className="flex items-center gap-2 px-10 py-3.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white text-sm font-semibold transition-all"
      >
        Skip rest
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}
