'use client'

import { UtensilsCrossed, Dumbbell, Beef, Sparkles } from 'lucide-react'
import { GeoAvatar } from '@/components/shared/geo-avatar'
import type { Nudge, NudgeType } from '@/lib/nudges'

const NUDGE_ICONS: Record<NudgeType, typeof UtensilsCrossed> = {
  time_to_eat: UtensilsCrossed,
  workout_today: Dumbbell,
  protein_check: Beef,
  program_complete: Sparkles,
}

const NUDGE_COLORS: Record<NudgeType, string> = {
  time_to_eat: 'border-l-accent',
  workout_today: 'border-l-success',
  protein_check: 'border-l-info',
  program_complete: 'border-l-purple',
}

interface NudgeCardProps {
  nudge: Nudge
  onAction: (nudge: Nudge) => void
}

export function NudgeCard({ nudge, onAction }: NudgeCardProps) {
  const Icon = NUDGE_ICONS[nudge.type]

  return (
    <div role="article" aria-label={nudge.title} className={`bg-surface border border-border border-l-4 ${NUDGE_COLORS[nudge.type]} rounded-xl p-4`}>
      <div className="flex items-start gap-3">
        <GeoAvatar state="suggest" size={32} className="shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-primary">{nudge.message}</p>
          <button
            onClick={() => onAction(nudge)}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-accent hover:bg-accent-hover text-white active:scale-95 transition-transform"
          >
            <Icon className="w-3.5 h-3.5" />
            {nudge.cta}
          </button>
        </div>
      </div>
    </div>
  )
}
