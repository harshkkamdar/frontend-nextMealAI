'use client'

import { Droplets, Smile, Moon, Zap, Scale } from 'lucide-react'

interface QuickStatsProps {
  water: number
  mood: number
  sleep: number
  energy: number
  weightKg?: number
  onWater?: () => void
  onMood?: () => void
  onSleep?: () => void
  onEnergy?: () => void
  onWeight?: () => void
}

function StatBox({
  icon: Icon,
  color,
  value,
  unit,
  label,
  onClick,
}: {
  icon: typeof Droplets
  color: string
  value: number | string
  unit: string
  label: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-surface border border-border rounded-xl p-3 text-left w-full active:scale-[0.97] transition-transform"
    >
      <Icon className={`w-[18px] h-[18px] ${color} mb-1`} />
      <p className="text-sm font-semibold text-text-primary">
        {value}
        <span className="text-xs font-normal text-text-secondary ml-0.5">{unit}</span>
      </p>
      <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-text-tertiary mt-0.5">
        {label}
      </p>
    </button>
  )
}

export function QuickStats({ water, mood, sleep, energy, weightKg, onWater, onMood, onSleep, onEnergy, onWeight }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatBox icon={Droplets} color="text-info" value={water} unit=" glasses" label="Water" onClick={onWater} />
      <StatBox icon={Smile} color="text-warning" value={mood || '-'} unit={mood ? '/10' : ''} label="Mood" onClick={onMood} />
      <StatBox icon={Moon} color="text-purple" value={sleep || '-'} unit={sleep ? ' hrs' : ''} label="Sleep" onClick={onSleep} />
      <StatBox icon={Zap} color="text-accent" value={energy || '-'} unit={energy ? '/10' : ''} label="Energy" onClick={onEnergy} />
      <StatBox
        icon={Scale}
        color="text-text-secondary"
        value={weightKg ? weightKg.toFixed(1) : '-'}
        unit={weightKg ? ' kg' : ''}
        label="Weight"
        onClick={onWeight}
      />
    </div>
  )
}
