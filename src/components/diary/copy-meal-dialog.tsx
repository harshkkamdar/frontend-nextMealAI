'use client'

import { useState } from 'react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { cn } from '@/lib/utils'

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
 * they actually ate for breakfast can be copied into Breakfast. Inset sheet;
 * the chosen slot carries the ink outline (selection is never a fill).
 */
export function CopyMealDialog({ open, sourceMeal, onClose, onPick }: CopyMealDialogProps) {
  const [targetMeal, setTargetMeal] = useState<string | null>(null)
  const selectedMeal = targetMeal ?? sourceMeal ?? 'Breakfast'

  const close = () => {
    setTargetMeal(null)
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={close} ariaLabel="Copy meal to which slot">
      <div className="px-5 pb-5 pt-2">
        <h2 className="text-[22px] font-bold tracking-[-0.3px] text-ink">Copy {sourceMeal?.toLowerCase()} to today</h2>
        <p className="mt-1 text-[15px] text-ink-65">Which meal should it go under?</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {MEALS.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={m === selectedMeal}
              onClick={() => setTargetMeal(m)}
              className={cn(
                'h-12 rounded-[14px] text-[15px] font-semibold text-ink transition-transform active:scale-[.97]',
                m === selectedMeal ? 'bg-card outline outline-[1.5px] -outline-offset-[1.5px] outline-ink' : 'bg-ink-06',
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <PrimaryButton type="button" onClick={() => { setTargetMeal(null); onPick(selectedMeal) }} className="mt-5 justify-center">
          Copy to {selectedMeal.toLowerCase()}
        </PrimaryButton>
        <button type="button" onClick={close} className="mt-2 h-11 w-full text-[15px] font-semibold text-ink-65">
          Cancel
        </button>
      </div>
    </BottomSheet>
  )
}
