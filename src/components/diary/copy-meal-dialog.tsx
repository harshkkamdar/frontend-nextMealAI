'use client'

import { useEffect, useState } from 'react'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const

interface CopyMealDialogProps {
  open: boolean
  /** The meal being copied FROM (e.g. "Snack") — pre-highlighted as the default target. */
  sourceMeal: string | null
  onClose: () => void
  /** Called with the chosen target meal slot (e.g. "Breakfast"). */
  onPick: (targetMeal: string) => void
}

/**
 * Lets the user choose WHICH meal a "Copy to today" lands under — so a lunch
 * they actually ate for breakfast can be copied into Breakfast. Custom in-app
 * dialog (no native prompt); sits above the bottom nav (z-[110] > nav z-[100]).
 */
export function CopyMealDialog({ open, sourceMeal, onClose, onPick }: CopyMealDialogProps) {
  const [targetMeal, setTargetMeal] = useState<string | null>(null)
  const selectedMeal = targetMeal ?? sourceMeal ?? 'Breakfast'

  const close = () => {
    setTargetMeal(null)
    onClose()
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTargetMeal(null)
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center">
      <div className="absolute inset-0 bg-ink/40" onClick={close} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Copy meal to which slot"
        className="relative z-10 w-full max-w-md rounded-t-[22px] bg-cream p-[22px]"
      >
        <h2 className="text-[22px] font-semibold tracking-[-0.4px] text-ink">Copy {sourceMeal} to today</h2>
        <p className="mt-1.5 text-[15.5px] text-ink-60">Which meal should it go under?</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {MEALS.map((m) => (
            <button
              key={m}
              onClick={() => setTargetMeal(m)}
              className={`h-9 rounded-full px-3 text-[13.5px] font-semibold ${
                m === selectedMeal ? 'bg-ink text-cream' : 'bg-ink-08 text-ink'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <PrimaryButton onClick={() => { setTargetMeal(null); onPick(selectedMeal) }} className="mt-5 justify-center">
          Copy meal
        </PrimaryButton>
        <button onClick={close} className="mt-3 w-full py-2 text-[15.5px] font-semibold text-ink-60">
          Cancel
        </button>
      </div>
    </div>
  )
}
