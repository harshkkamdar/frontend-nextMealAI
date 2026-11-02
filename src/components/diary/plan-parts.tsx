'use client'

import { ChevronRightIcon } from '@/components/ui/fiqr/icons'
import { cn } from '@/lib/utils'

export interface Targets { calories: number; protein: number; carbs: number; fat: number }

const fmt = (n: number) => Math.round(n).toLocaleString('en-AU')

export const MACRO_HUES = [
  { key: 'protein', label: 'Protein', color: 'var(--color-ink)' },
  { key: 'carbs', label: 'Carbs', color: 'var(--color-macro-teal)' },
  { key: 'fat', label: 'Fat', color: 'var(--color-macro-ochre)' },
] as const

/** Each macro's share of the target's energy (4/4/9 kcal per g), as whole percents; zeros when there is no target. */
export function macroSplit(t: Targets): Record<'protein' | 'carbs' | 'fat', number> {
  const kcal = { protein: t.protein * 4, carbs: t.carbs * 4, fat: t.fat * 9 }
  const total = kcal.protein + kcal.carbs + kcal.fat
  if (total <= 0) return { protein: 0, carbs: 0, fat: 0 }
  return { protein: Math.round((kcal.protein / total) * 100), carbs: Math.round((kcal.carbs / total) * 100), fat: Math.round((kcal.fat / total) * 100) }
}

/** The three macro hues by share of energy as one segmented bar (DESIGN.md: bars, not rings). */
export function SplitBar({ targets, className }: { targets: Targets; className?: string }) {
  const split = macroSplit(targets)
  return (
    <span aria-hidden="true" className={cn('flex h-2 w-full gap-[3px]', className)}>
      {MACRO_HUES.map(({ key, color }) => (split[key] > 0 ? <span key={key} className="h-full rounded-[4px]" style={{ width: `${split[key]}%`, background: color }} /> : null))}
    </span>
  )
}

/** The day's target source as a text row; without a plan it names the profile instead of disappearing. */
export function PlanLink({ planName, targets, onOpen }: { planName: string | null; targets: Targets; onOpen: () => void }) {
  const hasTargets = targets.calories > 0
  const title = planName !== null ? 'Your nutrition plan' : 'Targets from your profile'
  const sub = [planName || null, hasTargets ? `${fmt(targets.calories)} kcal a day` : 'No daily target yet'].filter(Boolean).join(' · ')
  return (
    <button type="button" onClick={onOpen} className="mt-1 flex min-h-11 w-full items-center gap-1.5 text-left active:opacity-60">
      <span className="text-[15px] font-semibold text-ink">{title}</span>
      <span className="min-w-0 truncate text-[13px] text-ink-65 tabular-nums">{sub}</span>
      <ChevronRightIcon className="ml-auto size-4 shrink-0 text-ink-50" />
    </button>
  )
}
