'use client'

import type { ComponentType, SVGProps } from 'react'
import { useRouter } from 'next/navigation'
import { PushedHeader } from '@/components/layout/screen-header'
import { LogList } from '@/components/logs/log-list'
import { OfflineBand } from '@/components/shared/offline-band'
import { EnergyFill, FoodFill, MoodFill, SleepFill, TrainFill, WaterFill, WeightFill } from '@/components/ui/fiqr/icons'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'

const LOG_TYPES: { type: string; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { type: 'workout', label: 'Workout', icon: TrainFill },
  { type: 'weight', label: 'Weight', icon: WeightFill },
  { type: 'water', label: 'Water', icon: WaterFill },
  { type: 'sleep', label: 'Sleep', icon: SleepFill },
  { type: 'mood', label: 'Mood', icon: MoodFill },
  { type: 'energy', label: 'Energy', icon: EnergyFill },
]

/** Log chooser: left the nav for the orb (C2, Q9) but stays reachable; recent logs live here. */
export default function LogsPage() {
  useSetGeoScreen('logs', {})
  const router = useRouter()

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-6">
      <PushedHeader title="Log" onBack={() => router.back()} />
      <div className="-mx-4 [&:not(:empty)]:mb-2"><OfflineBand /></div>

      <PrimaryButton type="button" icon={<FoodFill className="size-5" />} onClick={() => router.push('/logs/new/food')} className="mt-3">
        Log food
      </PrimaryButton>

      <div className="mt-3 grid grid-cols-3 gap-[10px]">
        {LOG_TYPES.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => router.push(`/logs/new/${type}`)}
            className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-[22px] bg-card shadow-[var(--shadow-card)] transition-transform active:scale-[.97]"
          >
            <Icon aria-hidden="true" className="size-6 text-ink" />
            <span className="text-[14px] font-semibold text-ink">{label}</span>
          </button>
        ))}
      </div>

      <div className="mt-8">
        <LogList />
      </div>
    </div>
  )
}
