'use client'

import { useEffect, useState, useRef } from 'react'
import { Timer, X } from 'lucide-react'
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

  const progress = remaining / duration
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60

  return (
    <div className="sticky top-0 z-30 bg-bg-secondary border-b border-border">
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-accent" />
          <span className="text-xs font-medium text-text-secondary">Rest</span>
          <span className="text-base font-semibold text-text-primary tabular-nums" aria-live="polite">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
        <button
          onClick={onSkip}
          aria-label="Skip rest timer"
          className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-text-secondary hover:text-text-primary rounded-full bg-surface border border-border transition-colors"
        >
          Skip
          <X className="w-3 h-3" />
        </button>
      </div>
      {/* Progress bar */}
      <div className="h-0.5 bg-border">
        <div
          className="h-full bg-accent transition-all duration-1000 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  )
}
