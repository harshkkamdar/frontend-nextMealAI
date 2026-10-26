'use client'

import { ChevronRightIcon } from '@/components/ui/fiqr/icons'
import { usePressTilt } from '@/components/ui/fiqr/press-tilt'

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

/** A donut of the three macro hues by share of energy, with a small gap between arcs. Decoration; the numbers sit beside it. */
export function SplitRing({ targets, size, stroke }: { targets: Targets; size: number; stroke: number }) {
  const split = macroSplit(targets)
  const r = (size - stroke) / 2
  const gap = split.protein && split.carbs && split.fat ? 3 : 0
  // Each arc starts where the previous ones end.
  const starts = [0, split.protein, split.protein + split.carbs]
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90" style={{ width: size, height: size }} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-ink-06)" strokeWidth={stroke} />
      {MACRO_HUES.map(({ key, color }, index) => {
        const arc = Math.max(0, split[key] - gap)
        return split[key] > 0 ? (
          <circle
            key={key}
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            pathLength={100}
            strokeDasharray={`${arc} ${100 - arc}`}
            strokeDashoffset={-starts[index]}
          />
        ) : null
      })}
    </svg>
  )
}

/**
 * Where the day's targets come from (journey-food "Your nutrition plan" link, enhanced by the owner on 26 Oct 2026):
 * a solid card row with the targets' macro split, the plan's name and its daily calories. Without a plan it names the
 * profile as the source instead of disappearing.
 */
export function PlanLink({ planName, targets, onOpen }: { planName: string | null; targets: Targets; onOpen: () => void }) {
  const tilt = usePressTilt<HTMLButtonElement>()
  const hasTargets = targets.calories > 0
  const title = planName !== null ? 'Your nutrition plan' : 'Targets from your profile'
  const sub = [planName || null, hasTargets ? `${fmt(targets.calories)} kcal a day` : 'No daily target yet'].filter(Boolean).join(' · ')
  return (
    <button
      type="button"
      onClick={onOpen}
      {...tilt}
      className="mt-2.5 flex min-h-row w-full items-center gap-3.5 rounded-card bg-card px-4 py-2.5 text-left shadow-[var(--shadow-card)]"
    >
      <SplitRing targets={targets} size={40} stroke={6} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-body font-semibold text-ink">{title}</span>
        <span className="truncate text-caption text-ink-65 tabular-nums">{sub}</span>
      </span>
      <ChevronRightIcon className="size-4 shrink-0 text-ink-35" />
    </button>
  )
}
