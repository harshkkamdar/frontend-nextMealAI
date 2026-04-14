'use client'

import { useState } from 'react'
import { formatMacroGrams, formatMacroKcal, type MacroKey } from '@/lib/macros'
import { MacroBarDot } from '@/components/shared/macro-bar-dot'
import { MacroBreakdownSheet } from '@/components/shared/macro-breakdown-sheet'
import type { Log } from '@/types/logs.types'

interface MacroValue {
  consumed: number
  target: number
}

interface ProgressCardProps {
  calories: MacroValue
  protein: MacroValue
  carbs: MacroValue
  fat: MacroValue
  /** Today's food logs — used to power the per-macro drill-in sheet. */
  foodLogs?: readonly Log[]
}

const MACRO_LABELS: Record<MacroKey, string> = {
  calories: 'Calories',
  protein: 'Protein',
  carbs: 'Carbs',
  fat: 'Fat',
}

function ProgressBar({
  macro,
  consumed,
  target,
  kind,
  gradient,
  dotColor,
  onDotClick,
}: {
  macro: MacroKey
  consumed: number
  target: number
  kind: 'kcal' | 'grams'
  gradient: string
  dotColor: string
  onDotClick: () => void
}) {
  const pct = target > 0 ? Math.min((consumed / target) * 100, 100) : 0
  const consumedStr = kind === 'kcal' ? `${formatMacroKcal(consumed)} cal` : formatMacroGrams(consumed)
  const targetStr = kind === 'kcal' ? `${formatMacroKcal(target)} cal` : formatMacroGrams(target)
  const label = MACRO_LABELS[macro]

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-text-secondary">{label}</span>
        <span className="text-xs font-medium tabular-nums">
          {consumedStr} / {targetStr}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-surface-hover">
        <div
          className={`h-2 rounded-full ${gradient}`}
          style={{ width: `${pct}%` }}
        />
        <MacroBarDot
          percent={pct}
          colorClass={dotColor}
          ariaLabel={`Show ${label.toLowerCase()} breakdown`}
          onClick={onDotClick}
        />
      </div>
    </div>
  )
}

export function ProgressCard({ calories, protein, carbs, fat, foodLogs = [] }: ProgressCardProps) {
  const [activeMacro, setActiveMacro] = useState<MacroKey | null>(null)

  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
          Today&apos;s Progress
        </span>
        <div className="text-right">
          <span className="text-xl font-semibold text-accent tabular-nums">
            {formatMacroKcal(calories.consumed)}
          </span>
          <span className="text-xs text-text-secondary ml-1">/ {formatMacroKcal(calories.target)} cal</span>
        </div>
      </div>

      <div className="space-y-3">
        <ProgressBar
          macro="calories"
          consumed={calories.consumed}
          target={calories.target}
          kind="kcal"
          gradient="bg-gradient-to-r from-accent to-[#F0885E]"
          dotColor="bg-accent"
          onDotClick={() => setActiveMacro('calories')}
        />
        <ProgressBar
          macro="protein"
          consumed={protein.consumed}
          target={protein.target}
          kind="grams"
          gradient="bg-gradient-to-r from-info to-[#60A5FA]"
          dotColor="bg-info"
          onDotClick={() => setActiveMacro('protein')}
        />
        <ProgressBar
          macro="carbs"
          consumed={carbs.consumed}
          target={carbs.target}
          kind="grams"
          gradient="bg-gradient-to-r from-warning to-[#FFB84D]"
          dotColor="bg-warning"
          onDotClick={() => setActiveMacro('carbs')}
        />
        <ProgressBar
          macro="fat"
          consumed={fat.consumed}
          target={fat.target}
          kind="grams"
          gradient="bg-gradient-to-r from-purple to-[#C084FC]"
          dotColor="bg-purple"
          onDotClick={() => setActiveMacro('fat')}
        />
      </div>

      <MacroBreakdownSheet
        open={activeMacro !== null}
        macro={activeMacro ?? 'protein'}
        foodLogs={foodLogs}
        onClose={() => setActiveMacro(null)}
      />
    </div>
  )
}
