'use client'

import { Droplet, Dumbbell, Moon, Scale, Smile, Zap, type LucideIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { LogList } from '@/components/logs/log-list'
import { ActionCard } from '@/components/ui/fiqr/action-card'
import { SectionLabel } from '@/components/ui/fiqr/section-label'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'

const LOG_TYPES: { type: string; label: string; icon: LucideIcon }[] = [
  { type: 'workout', label: 'Workout', icon: Dumbbell },
  { type: 'weight', label: 'Weight', icon: Scale },
  { type: 'water', label: 'Water', icon: Droplet },
  { type: 'sleep', label: 'Sleep', icon: Moon },
  { type: 'mood', label: 'Mood', icon: Smile },
  { type: 'energy', label: 'Energy', icon: Zap },
]

export default function LogsPage() {
  useSetGeoScreen('logs', {})
  const router = useRouter()

  return (
    <PageWrapper className="pb-32">
      <h1 className="mb-5 text-[22px] font-semibold tracking-[-0.4px] text-ink">Log</h1>

      <button type="button" onClick={() => router.push('/logs/new/food')} className="block w-full text-left">
        <ActionCard className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-cream-22 text-[20px] font-semibold text-cream">+</span>
          <span className="text-[17px] font-bold text-cream">Log food</span>
          <span className="ml-auto text-[13.5px] font-semibold text-ink">Scan · Search</span>
        </ActionCard>
      </button>

      <div className="mt-[10px] grid grid-cols-2 gap-[10px]">
        {LOG_TYPES.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => router.push(`/logs/new/${type}`)}
            className="flex items-center gap-3 rounded-[16px] border border-ink-12 bg-card p-[14px] text-left"
          >
            <Icon className="size-6 shrink-0 text-ink-60" />
            <span className="text-[15.5px] font-semibold text-ink">{label}</span>
          </button>
        ))}
      </div>

      <SectionLabel className="mb-2 mt-8">Recent</SectionLabel>
      <LogList />
    </PageWrapper>
  )
}
