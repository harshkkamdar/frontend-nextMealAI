'use client'

import { useState } from 'react'
import { formatMacroGrams, formatMacroKcal, type MacroKey } from '@/lib/macros'
import { MacroBarDot } from '@/components/shared/macro-bar-dot'
import { MacroBreakdownSheet } from '@/components/shared/macro-breakdown-sheet'
import type { Log } from '@/types/logs.types'

interface MacroBarProps {
  label: string
  macro: MacroKey
  consumed: number
  target: number
  color: string
  onDotClick: () => void
}

function MacroBar({ label, macro, consumed, target, color, onDotClick }: MacroBarProps) {
  const pct = target > 0 ? Math.min((consumed / target) * 100, 100) : 0

  return (
    <div className="flex-1">
      <div className="flex items-baseline justify-between mb-0.5">
        <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wide">{label}</span>
        <span className="text-[10px] tabular-nums text-text-secondary">{formatMacroGrams(consumed)}</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-surface-hover">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
        <MacroBarDot
          percent={pct}
          colorClass={color}
          ariaLabel={`Show ${macro} breakdown`}
          onClick={onDotClick}
          className="w-2.5 h-2.5"
        />
      </div>
    </div>
  )
}

interface MacroProgressProps {
  calories: { consumed: number; target: number }
  protein: { consumed: number; target: number }
  carbs: { consumed: number; target: number }
  fat: { consumed: number; target: number }
  /** Food logs scoped to the selected date — powers the drill-in sheet. */
  foodLogs?: readonly Log[]
}

export function MacroProgress({ calories, protein, carbs, fat, foodLogs = [] }: MacroProgressProps) {
  const calPct = calories.target > 0 ? Math.min((calories.consumed / calories.target) * 100, 100) : 0
  const remaining = Math.max(0, calories.target - calories.consumed)
  const [activeMacro, setActiveMacro] = useState<MacroKey | null>(null)

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      {/* Calorie header */}
      <div className="flex items-baseline justify-between mb-2">
        <div>
          <span className="text-2xl font-semibold text-accent tabular-nums">{formatMacroKcal(calories.consumed)}</span>
          <span className="text-xs text-text-secondary ml-1">/ {formatMacroKcal(calories.target)} cal</span>
        </div>
        <span className="text-xs text-text-tertiary">{formatMacroKcal(remaining)} remaining</span>
      </div>

      {/* Calorie bar */}
      <div className="relative h-2.5 rounded-full bg-surface-hover mb-3">
        <div
          className="h-2.5 rounded-full bg-gradient-to-r from-accent to-[#F0885E]"
          style={{ width: `${calPct}%` }}
        />
        <MacroBarDot
          percent={calPct}
          colorClass="bg-accent"
          ariaLabel="Show calories breakdown"
          onClick={() => setActiveMacro('calories')}
        />
      </div>

      {/* P / C / F bars */}
      <div className="flex gap-3">
        <MacroBar
          label="P"
          macro="protein"
          consumed={protein.consumed}
          target={protein.target}
          color="bg-info"
          onDotClick={() => setActiveMacro('protein')}
        />
        <MacroBar
          label="C"
          macro="carbs"
          consumed={carbs.consumed}
          target={carbs.target}
          color="bg-warning"
          onDotClick={() => setActiveMacro('carbs')}
        />
        <MacroBar
          label="F"
          macro="fat"
          consumed={fat.consumed}
          target={fat.target}
          color="bg-purple"
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
