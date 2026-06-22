'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { X, Minus, Plus, Volume2, VolumeX } from 'lucide-react'
import { playBell } from '@/lib/audio'

const MUTE_KEY = 'restTimerMuted'

interface RestTimerProps {
  isActive: boolean
  duration: number // seconds
  onSkip: () => void
  onComplete: () => void
  /**
   * FB-05 tick-ahead fix. Bumped by the parent on every set completion so the
   * countdown resets to full `duration` even when `duration` itself is
   * unchanged (multiple sets in one exercise share rest_seconds).
   */
  resetToken?: number
}

export function RestTimer({ isActive, duration, onSkip, onComplete, resetToken }: RestTimerProps) {
  const [remaining, setRemaining] = useState(duration)
  // Adjustable target — ±15s buttons change this; the tab-refocus recompute and
  // the progress ring both use it so adjustments survive a background/refocus.
  const [target, setTarget] = useState(duration)
  const [muted, setMuted] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  const startedAtRef = useRef<number>(0)
  const timerStartedRef = useRef(false)
  const targetRef = useRef(duration)
  targetRef.current = target
  const mutedRef = useRef(false)
  mutedRef.current = muted

  // Load the saved mute preference once.
  useEffect(() => {
    try { setMuted(localStorage.getItem(MUTE_KEY) === '1') } catch { /* ignore */ }
  }, [])

  // Completion side-effects — kept OUT of state updaters to avoid the React
  // "update while rendering" error. Honors the mute toggle.
  useEffect(() => {
    if (remaining === 0 && timerStartedRef.current) {
      timerStartedRef.current = false
      if (!mutedRef.current) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([200, 100, 200])
        playBell()
      }
      onCompleteRef.current()
    }
  }, [remaining])

  useEffect(() => {
    if (isActive) {
      setRemaining(duration)
      setTarget(duration)
      targetRef.current = duration
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

      // Recompute on tab refocus (mobile throttles/kills setInterval) using the
      // CURRENT target (so a ±15s adjustment isn't lost).
      const onVisible = () => {
        if (document.hidden || !startedAtRef.current) return
        const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000)
        const newRemaining = Math.max(0, targetRef.current - elapsed)
        if (newRemaining <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current)
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

    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [isActive, duration, resetToken])

  // Extend / trim the rest. Anchor start so elapsed math stays consistent with
  // the new target; never let -15 instantly complete (floor remaining at 1).
  // Compute the new value once, then set both states (no side-effects inside a
  // state updater — that would double-run under React StrictMode).
  const adjust = (delta: number) => {
    timerStartedRef.current = true
    startedAtRef.current = Date.now()
    const nr = Math.max(1, remaining + delta)
    targetRef.current = nr
    setRemaining(nr)
    setTarget(nr)
  }

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m
      try { localStorage.setItem(MUTE_KEY, next ? '1' : '0') } catch { /* ignore */ }
      return next
    })
  }

  if (!isActive) return null

  const progress = target > 0 ? remaining / target : 0
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const R = 54
  const CIRC = 2 * Math.PI * R

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
      {/* Mute / sound toggle */}
      <button
        onClick={toggleMute}
        aria-label={muted ? 'Unmute rest timer chime' : 'Mute rest timer chime'}
        className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all"
      >
        {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

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

      <div className="flex items-center gap-3">
        <button
          onClick={() => adjust(-15)}
          aria-label="Subtract 15 seconds"
          className="flex items-center gap-1 px-4 py-3 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-sm font-semibold transition-all"
        >
          <Minus className="w-4 h-4" /> 15s
        </button>
        <button
          onClick={onSkip}
          aria-label="Skip rest timer"
          className="px-8 py-3.5 rounded-full bg-white text-accent text-sm font-bold hover:bg-white/90 active:scale-95 transition-all flex items-center gap-2"
        >
          Skip <X className="w-4 h-4" />
        </button>
        <button
          onClick={() => adjust(15)}
          aria-label="Add 15 seconds"
          className="flex items-center gap-1 px-4 py-3 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-sm font-semibold transition-all"
        >
          <Plus className="w-4 h-4" /> 15s
        </button>
      </div>
    </motion.div>
  )
}
