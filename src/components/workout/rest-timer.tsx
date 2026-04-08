'use client'

import { useEffect, useState, useRef } from 'react'
import { Timer, X } from 'lucide-react'

interface RestTimerProps {
  isActive: boolean
  duration: number // seconds
  onSkip: () => void
  onComplete: () => void
}

export function RestTimer({ isActive, duration, onSkip, onComplete }: RestTimerProps) {
  const [remaining, setRemaining] = useState(duration)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (isActive) {
      setRemaining(duration)

      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!)
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([200, 100, 200])
            }
            onCompleteRef.current()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isActive, duration])

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
          <span className="text-base font-semibold text-text-primary tabular-nums">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
        <button
          onClick={onSkip}
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
