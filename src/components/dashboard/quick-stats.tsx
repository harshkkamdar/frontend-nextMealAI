'use client'

import { Droplets, Smile, Moon, Zap } from 'lucide-react'

interface QuickStatsProps {
  water: number
  mood: number
  sleep: number
  energy: number
}

function StatBox({
  icon: Icon,
  color,
  value,
  unit,
  label,
}: {
  icon: typeof Droplets
  color: string
  value: number
  unit: string
  label: string
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-3">
      <Icon className={`w-[18px] h-[18px] ${color} mb-1`} />
      <p className="text-sm font-semibold text-text-primary">
        {value}
        <span className="text-xs font-normal text-text-secondary ml-0.5">{unit}</span>
      </p>
      <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-text-tertiary mt-0.5">
        {label}
      </p>
    </div>
  )
}

export function QuickStats({ water, mood, sleep, energy }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatBox icon={Droplets} color="text-info" value={water} unit=" glasses" label="Water" />
      <StatBox icon={Smile} color="text-warning" value={mood} unit="/10" label="Mood" />
      <StatBox icon={Moon} color="text-purple" value={sleep} unit=" hrs" label="Sleep" />
      <StatBox icon={Zap} color="text-accent" value={energy} unit="/10" label="Energy" />
    </div>
  )
}
