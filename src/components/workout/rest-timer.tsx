'use client'

import { useEffect, useRef, useState } from 'react'

import { FeatureCard } from '@/components/ui/fiqr/feature-card'
import { SecondaryButton } from '@/components/ui/fiqr/secondary-button'
import { playBell } from '@/lib/audio'

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

  if (!isActive) return null

  const progress = target > 0 ? remaining / target : 0
  const clock = `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}`

  if (minimized) {
    return (
      <div role="dialog" aria-label="Rest timer (minimised)" className="fixed bottom-[calc(16px+var(--safe-bottom))] right-[var(--gutter)] z-30">
        <button type="button" onClick={() => setMinimized(false)} aria-label="Expand rest timer" className="h-11 rounded-full bg-ink px-4 text-[15.5px] font-semibold tabular-nums text-cream shadow-[var(--shadow-raised)]">
          {clock}
        </button>
      </div>
    )
  }

  return (
    <FeatureCard
      role="dialog"
      aria-label="Rest timer"
      className="fixed bottom-[calc(16px+var(--safe-bottom))] left-[var(--gutter)] right-[var(--gutter)] z-30 shadow-[var(--shadow-raised)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[1.4px] text-cream-55">Rest</p>
          <p className="mt-1 text-[36px] font-bold leading-none tabular-nums tracking-[-0.8px] text-cream" aria-live="polite">{clock}</p>
        </div>
        <div className="flex gap-1">
          <button type="button" onClick={toggleMute} aria-label={muted ? 'Unmute rest timer chime' : 'Mute rest timer chime'} className="flex h-9 w-9 items-center justify-center rounded-full text-cream-60"><SoundIcon muted={muted} /></button>
          <button type="button" onClick={() => setMinimized(true)} aria-label="Minimise rest timer" className="flex h-9 w-9 items-center justify-center rounded-full text-cream-60"><MinimiseIcon /></button>
        </div>
      </div>

      <div className="mt-4 h-1 overflow-hidden rounded-full bg-cream-22">
        <div className="h-full bg-accent transition-[width] duration-1000 ease-linear" style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button type="button" onClick={() => adjust(-15)} aria-label="Subtract 15 seconds" className="h-9 rounded-full bg-cream-22 px-3 text-[13.5px] font-semibold text-cream">−15</button>
        <button type="button" onClick={() => adjust(15)} aria-label="Add 15 seconds" className="h-9 rounded-full bg-cream-22 px-3 text-[13.5px] font-semibold text-cream">+15</button>
        <SecondaryButton type="button" onNavy onClick={onSkip} aria-label="Skip rest timer" className="ml-auto h-9 w-auto px-5 text-[13.5px]">Skip</SecondaryButton>
      </div>
    </FeatureCard>
  )
}
