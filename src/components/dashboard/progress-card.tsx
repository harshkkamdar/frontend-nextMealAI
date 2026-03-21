'use client'

interface MacroValue {
  consumed: number
  target: number
}

interface ProgressCardProps {
  calories: MacroValue
  protein: MacroValue
  carbs: MacroValue
  fat: MacroValue
}

function ProgressBar({
  label,
  consumed,
  target,
  unit,
  gradient,
}: {
  label: string
  consumed: number
  target: number
  unit: string
  gradient: string
}) {
  const pct = target > 0 ? Math.min((consumed / target) * 100, 100) : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-text-secondary">{label}</span>
        <span className="text-xs font-medium tabular-nums">
          {consumed}
          {unit} / {target}
          {unit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface-hover">
        <div
          className={`h-2 rounded-full ${gradient}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function ProgressCard({ calories, protein, carbs, fat }: ProgressCardProps) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
          Today&apos;s Progress
        </span>
        <div className="text-right">
          <span className="text-xl font-semibold text-accent tabular-nums">
            {calories.consumed}
          </span>
          <span className="text-xs text-text-secondary ml-1">/ {calories.target} cal</span>
        </div>
      </div>

      <div className="space-y-3">
        <ProgressBar
          label="Calories"
          consumed={calories.consumed}
          target={calories.target}
          unit=" cal"
          gradient="bg-gradient-to-r from-accent to-[#F0885E]"
        />
        <ProgressBar
          label="Protein"
          consumed={protein.consumed}
          target={protein.target}
          unit="g"
          gradient="bg-gradient-to-r from-info to-[#60A5FA]"
        />
        <ProgressBar
          label="Carbs"
          consumed={carbs.consumed}
          target={carbs.target}
          unit="g"
          gradient="bg-gradient-to-r from-warning to-[#FFB84D]"
        />
        <ProgressBar
          label="Fat"
          consumed={fat.consumed}
          target={fat.target}
          unit="g"
          gradient="bg-gradient-to-r from-purple to-[#C084FC]"
        />
      </div>
    </div>
  )
}
