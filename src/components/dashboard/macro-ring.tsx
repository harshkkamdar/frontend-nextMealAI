'use client'

import { EmptyState } from '@/components/shared/empty-state'

interface MacroRingProps {
  consumed: number
  target: number
  protein: { consumed: number; target: number }
  carbs: { consumed: number; target: number }
  fat: { consumed: number; target: number }
  isEmpty: boolean
}

function CircularProgress({ pct, size = 120, consumed, target }: { pct: number; size?: number; consumed: number; target: number }) {
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (Math.min(pct, 100) / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={8}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#FF6A1A"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-foreground">{Math.round(consumed)}</span>
        <span className="text-xs text-muted-foreground">/ {Math.round(target)} kcal</span>
      </div>
    </div>
  )
}

function MacroBar({ label, consumed, target, color }: { label: string; consumed: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min((consumed / target) * 100, 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground font-medium">{Math.round(consumed)}g / {Math.round(target)}g</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export function MacroRing({ consumed, target, protein, carbs, fat, isEmpty }: MacroRingProps) {
  if (isEmpty) {
    return (
      <div className="bg-bg-secondary rounded-2xl p-6">
        <EmptyState title="No food logged today yet" description="Start tracking to see your macros" />
      </div>
    )
  }

  const pct = target > 0 ? (consumed / target) * 100 : 0

  return (
    <div className="bg-bg-secondary rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-center">
        <CircularProgress pct={pct} size={140} consumed={consumed} target={target} />
      </div>
      <div className="space-y-3">
        <MacroBar label="Protein" consumed={protein.consumed} target={protein.target} color="#4ADE80" />
        <MacroBar label="Carbs" consumed={carbs.consumed} target={carbs.target} color="#60A5FA" />
        <MacroBar label="Fat" consumed={fat.consumed} target={fat.target} color="#FBBF24" />
      </div>
    </div>
  )
}
