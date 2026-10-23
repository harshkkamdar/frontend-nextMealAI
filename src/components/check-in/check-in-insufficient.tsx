'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { GeoAvatar } from '@/components/shared/geo-avatar'
import { FeatureCard } from '@/components/ui/fiqr/feature-card'
import { SecondaryButton } from '@/components/ui/fiqr/secondary-button'
import { SectionLabel } from '@/components/ui/fiqr/section-label'
import type { CheckInStatus } from '@/lib/api/check-in.api'
import { useUIStore } from '@/stores/ui.store'

import { formatMetric, numberWord } from './format'
import { SegmentsBar } from './segments-bar'
import { StatTiles } from './stat-tiles'
import { WeightTrendCard } from './weight-trend-card'

export function CheckInInsufficient({ status }: { status: CheckInStatus }) {
  const router = useRouter()
  const { week_so_far: week, weight } = status
  const neededWord = numberWord(status.days_needed)

  const keepTargets = () => {
    toast.success('Targets unchanged')
    router.push('/dashboard')
  }

  return (
    <div className="flex flex-1 flex-col">
      <FeatureCard className="mt-[14px] px-5 py-[18px]">
        <div className="flex items-center gap-[10px]">
          <GeoAvatar size={24} />
          <span className="text-[11.5px] font-semibold uppercase tracking-[1.8px] text-cream-55">GEO&apos;S READ</span>
        </div>
        <p className="mt-3 text-pretty text-[22px] font-semibold leading-[1.25] tracking-[-0.2px] text-cream">
          {status.verdict}
        </p>
      </FeatureCard>

      <div className="mt-4 rounded-[16px] border border-ink-12 bg-card p-[14px]">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[15.5px] font-semibold">{status.days_logged} of 7 days logged</span>
          <span className="text-[13.5px] text-ink-65">{status.days_needed} needed</span>
        </div>
        <div className="mt-[10px]">
          <SegmentsBar filled={status.days_logged} tone="ink" total={7} />
        </div>
        <p className="mt-[10px] text-pretty text-[13.5px] text-ink-65">
          {neededWord.charAt(0).toUpperCase() + neededWord.slice(1)} days next week gives me a real answer.
        </p>
      </div>

      <section className="mt-4 space-y-[9px]">
        <SectionLabel>What I could see</SectionLabel>
        <WeightTrendCard
          currentKg={weight.current_kg}
          deltaKg={weight.delta_week_kg}
          points={weight.points}
          tone="muted"
        />
        <StatTiles
          cols={2}
          items={[
            { label: 'Sessions', value: week.sessions_done, sub: `of ${week.sessions_planned}` },
            { label: 'Sleep', value: formatMetric(week.sleep_avg_h), unit: 'h', sub: `${week.sleep_nights} nights` },
          ]}
        />
        <div className="rounded-[16px] border-0 bg-ink-08 px-[14px] py-[13px] text-[13.5px] text-ink-65">
          Food averages hidden — {numberWord(status.days_logged)} days isn&apos;t a week
        </div>
      </section>

      <div className="mt-auto flex flex-col gap-2 pb-4 pt-[14px]">
        <SecondaryButton className="h-[58px] rounded-[18px] border-0 bg-ink text-cream" onClick={keepTargets} onNavy={false}>
          Keep current targets
        </SecondaryButton>
        <button
          className="self-center px-3 py-1 text-[15.5px] font-semibold text-ink-65"
          onClick={() => useUIStore.getState().openSheet('geo-companion')}
          type="button"
        >
          Ask Geo about this
        </button>
      </div>
    </div>
  )
}
