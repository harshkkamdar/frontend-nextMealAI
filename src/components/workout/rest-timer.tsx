'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

interface RestTimerProps {
  seconds: number
  onDismiss: () => void
}

export function RestTimer({ seconds, onDismiss }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds)
  const onDismissRef = useRef(onDismiss)

  useEffect(() => {
    onDismissRef.current = onDismiss
  }, [onDismiss])

  useEffect(() => {
    setRemaining(seconds)
  }, [seconds])

  useEffect(() => {
    if (remaining <= 0) {
      // Vibrate if supported
      try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([100, 50, 100])
        }
      } catch {}
      onDismissRef.current()
      return
    }

    const timer = setInterval(() => {
      setRemaining((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [remaining])

  const pct = seconds > 0 ? ((seconds - remaining) / seconds) * 100 : 100
  const circumference = 2 * Math.PI * 54
  const strokeDashoffset = circumference - (pct / 100) * circumference

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-40 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center"
    >
      <p className="text-sm font-medium text-text-secondary mb-6">Rest</p>

      {/* Circular timer */}
      <div className="relative w-32 h-32 mb-6">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="var(--color-border)" strokeWidth="6" />
          <circle
            cx="60" cy="60" r="54" fill="none"
            stroke="var(--color-accent)" strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-semibold text-text-primary tabular-nums">
            {remaining}
          </span>
        </div>
      </div>

      <button
        onClick={onDismiss}
        className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-border text-sm text-text-secondary hover:bg-surface-hover transition-colors"
      >
        <X className="w-4 h-4" />
        Skip
      </button>
    </motion.div>
  )
}
