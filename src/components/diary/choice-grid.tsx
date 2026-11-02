'use client'

import type { ReactNode } from 'react'
import { haptic } from '@/lib/platform/app'
import { cn } from '@/lib/utils'

export interface Choice { value: string; label: string; sub?: string; disabled?: boolean }

/**
 * The diary's choice chips (journey-food Move, Copy and Edit sheets): a 2 or 3 column grid of 48 pt chips, the
 * chosen one fills ink, matching the app's other selected chips.
 */
export function ChoiceGrid({ label, choices, value, onPick, cols = 2, className }: {
  label: string
  choices: readonly Choice[]
  value: string | null
  onPick: (value: string) => void
  cols?: 2 | 3
  className?: string
}) {
  return (
    <div role="group" aria-label={label} className={cn('grid gap-2.5', cols === 3 ? 'grid-cols-3' : 'grid-cols-2', className)}>
      {choices.map((choice) => {
        const on = choice.value === value
        return (
          <button
            key={choice.value}
            type="button"
            aria-pressed={on}
            disabled={choice.disabled}
            onClick={() => { void haptic('selection'); onPick(choice.value) }}
            // Size tokens stay out of cn(): tailwind-merge reads text-body-sm and text-ink as one group and drops one.
            className={`flex min-h-12 flex-col items-center justify-center rounded-[16px] px-1 py-1 text-body-sm font-semibold leading-tight transition-transform enabled:active:scale-[.97] disabled:opacity-45 ${on ? 'bg-ink text-cream' : 'bg-ink-06 text-ink'}`}
          >
            {choice.label}
            {choice.sub ? <span className={`text-tab font-semibold ${on ? 'text-cream-60' : 'text-ink-65'}`}>{choice.sub}</span> : null}
          </button>
        )
      })}
    </div>
  )
}

/** A small muted label over a group (12/600). */
export function GroupLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={`mx-1 mb-2 text-label text-ink-65 ${className ?? 'mt-4'}`}>{children}</p>
}
