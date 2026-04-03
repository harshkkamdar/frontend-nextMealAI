'use client'

interface MacroBarProps {
  label: string
  consumed: number
  target: number
  unit: string
  color: string
}

function MacroBar({ label, consumed, target, unit, color }: MacroBarProps) {
  const pct = target > 0 ? Math.min((consumed / target) * 100, 100) : 0

  return (
    <div className="flex-1">
      <div className="flex items-baseline justify-between mb-0.5">
        <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wide">{label}</span>
        <span className="text-[10px] tabular-nums text-text-secondary">{consumed}{unit}</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-hover">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

interface MacroProgressProps {
  calories: { consumed: number; target: number }
  protein: { consumed: number; target: number }
  carbs: { consumed: number; target: number }
  fat: { consumed: number; target: number }
}

export function MacroProgress({ calories, protein, carbs, fat }: MacroProgressProps) {
  const calPct = calories.target > 0 ? Math.min((calories.consumed / calories.target) * 100, 100) : 0
  const remaining = Math.max(0, calories.target - calories.consumed)

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      {/* Calorie header */}
      <div className="flex items-baseline justify-between mb-2">
        <div>
          <span className="text-2xl font-semibold text-accent tabular-nums">{calories.consumed}</span>
          <span className="text-xs text-text-secondary ml-1">/ {calories.target} cal</span>
        </div>
        <span className="text-xs text-text-tertiary">{remaining} remaining</span>
      </div>

      {/* Calorie bar */}
      <div className="h-2.5 rounded-full bg-surface-hover mb-3">
        <div
          className="h-2.5 rounded-full bg-gradient-to-r from-accent to-[#F0885E]"
          style={{ width: `${calPct}%` }}
        />
      </div>

      {/* P / C / F bars */}
      <div className="flex gap-3">
        <MacroBar label="P" consumed={protein.consumed} target={protein.target} unit="g" color="bg-info" />
        <MacroBar label="C" consumed={carbs.consumed} target={carbs.target} unit="g" color="bg-warning" />
        <MacroBar label="F" consumed={fat.consumed} target={fat.target} unit="g" color="bg-purple" />
      </div>
    </div>
  )
}
