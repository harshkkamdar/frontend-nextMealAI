'use client'

import type { ReactNode } from 'react'
import { Trash2 } from 'lucide-react'
import { labelClass } from '@/components/plans/plan-builder-shared'
import { haptic } from '@/lib/platform/app'
import { cn } from '@/lib/utils'

/** The validation messages that belong to one builder step (validate() returns them for the whole plan). */
export function stepErrors(step: 'name' | 'targets' | 'days', errors: string[]): string[] {
  const isName = (e: string) => e.startsWith('Plan name')
  const isTarget = (e: string) => / target /.test(` ${e} `)
  if (step === 'name') return errors.filter(isName)
  if (step === 'targets') return errors.filter(isTarget)
  return errors.filter((e) => !isName(e) && !isTarget(e))
}

export function BuilderNotes({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div className="space-y-2">
      <label htmlFor="plan-notes" className={labelClass}>Notes</label>
      <textarea
        id="plan-notes"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={placeholder}
        className="min-h-24 w-full resize-none rounded-[14px] bg-card p-4 text-[16px] leading-[1.45] text-ink outline outline-1 -outline-offset-1 outline-ink-08 placeholder:text-ink-65 focus:outline-2 focus:outline-ink"
      />
    </div>
  )
}

/** One day of a plan: number badge, its own header control, an optional remove, then the rows. */
export function DayCardShell({ index, header, onRemove, children }: { index: number; header: ReactNode; onRemove?: () => void; children: ReactNode }) {
  return (
    <section aria-label={`Day ${index + 1}`} className="space-y-4 rounded-[24px] bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2.5">
        <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-[13px] font-bold text-cream tabular-nums">{index + 1}</span>
        {header}
        {onRemove ? (
          <button type="button" onClick={onRemove} aria-label={`Remove day ${index + 1}`} className="grid size-11 shrink-0 place-items-center rounded-full text-ink-65 transition-transform active:scale-[.94]">
            <Trash2 className="size-5" strokeWidth={1.75} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {children}
    </section>
  )
}

/** "Set as active plan": a switch row, ink when on. */
export function ActiveToggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => { void haptic('selection'); onChange(!checked) }}
      className="!mt-6 flex min-h-14 w-full items-center gap-3 rounded-[16px] bg-card px-4 text-left shadow-[var(--shadow-card)]"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[15.5px] font-semibold text-ink">Set as active plan</span>
        <span className="block text-[13px] text-ink-65">Replaces the one you follow now</span>
      </span>
      <span aria-hidden="true" className={cn('relative h-[30px] w-[50px] shrink-0 rounded-full', checked ? 'bg-ink' : 'bg-ink-20')}>
        <span className={cn('absolute left-[3px] top-[3px] size-6 rounded-full bg-card shadow-[0_1px_3px_rgba(17,28,53,.25)] transition-transform duration-200 ease-out', checked && 'translate-x-5')} />
      </span>
    </button>
  )
}
