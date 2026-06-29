'use client'

import { useEffect } from 'react'

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
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Copy meal to which slot"
        className="relative z-10 w-[90%] max-w-sm bg-surface border border-border rounded-2xl p-5 shadow-xl animate-in fade-in zoom-in-95 duration-150"
      >
        <h2 className="text-base font-semibold text-text-primary">Copy {sourceMeal} to today</h2>
        <p className="text-sm text-text-secondary mt-1.5">Which meal should it go under?</p>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {MEALS.map((m) => (
            <button
              key={m}
              onClick={() => onPick(m)}
              className={`py-2.5 text-sm font-medium rounded-xl border transition-colors ${
                m === sourceMeal
                  ? 'border-accent text-accent bg-accent/5'
                  : 'border-border text-text-primary hover:bg-surface-hover'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="mt-4 w-full py-2 text-sm text-text-secondary hover:text-text-primary">
          Cancel
        </button>
      </div>
    </div>
  )
}
