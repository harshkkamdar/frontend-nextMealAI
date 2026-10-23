'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { GeoAvatar } from '@/components/shared/geo-avatar'
import { FeatureCard } from '@/components/ui/fiqr/feature-card'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { SecondaryButton } from '@/components/ui/fiqr/secondary-button'
import { SectionLabel } from '@/components/ui/fiqr/section-label'
import { applyCheckIn, type CheckInStatus } from '@/lib/api/check-in.api'
import { syncBus } from '@/lib/sync/sync-bus'
import { useUIStore } from '@/stores/ui.store'

import { formatMetric } from './format'
import { StatTiles } from './stat-tiles'
import { WeightTrendCard } from './weight-trend-card'

interface CheckInDueProps {
  status: CheckInStatus
  refetch: () => Promise<void>
}

function TargetChange({ label, current, next, unit = '' }: {
  label: string
  current: number | null
  next: number
  unit?: string
}) {
  const unchanged = current === next

  return (
    <div className="flex items-center gap-3 border-b border-ink-09 py-3 last:border-b-0">
      <span className="flex-1 text-[15.5px] font-semibold">{label}</span>
      {unchanged ? (
        <span className="text-[15.5px] font-semibold text-ink">No change</span>
      ) : (
        <span className="flex items-center gap-3 text-[15px]">
          <s className="text-ink-65">{formatMetric(current)}{unit}</s>
          <span className="text-ink-35">→</span>
          <b className="font-semibold text-ink underline decoration-accent decoration-2 underline-offset-[3px]">{next.toLocaleString()}{unit}</b>
        </span>
      )}
    </div>
  )
}

export function CheckInDue({ status, refetch }: CheckInDueProps) {
  const [submitting, setSubmitting] = useState(false)
  const { proposal, targets, week_so_far: week, weight } = status

  const handleApply = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      await applyCheckIn()
      toast.success('Targets updated')
      await refetch()
      syncBus.emit('plans:updated')
    } catch {
      toast.error("Couldn't update targets")
    } finally {
      setSubmitting(false)
    }
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

      <section className="mt-4 space-y-[9px]">
        <SectionLabel>The week&apos;s data</SectionLabel>
        <WeightTrendCard
          currentKg={weight.current_kg}
          deltaKg={weight.delta_week_kg}
          points={weight.points}
          tone="accent"
        />
        <StatTiles
          cols={4}
          items={[
            { label: 'Kcal', value: formatMetric(week.avg_calories), sub: `of ${formatMetric(targets.calories)}` },
            { label: 'Protein', value: formatMetric(week.avg_protein_g), unit: 'g', sub: `of ${formatMetric(targets.protein_g)}g` },
            { label: 'Train', value: week.sessions_done, sub: `of ${week.sessions_planned}` },
            { label: 'Sleep', value: formatMetric(week.sleep_avg_h), unit: 'h', sub: `${week.sleep_nights} nights` },
          ]}
        />
      </section>

      {proposal ? (
        <section className="mt-[18px]">
          <SectionLabel>What&apos;s changing</SectionLabel>
          <div className="mt-[9px]">
            <TargetChange label="Daily calories" current={targets.calories} next={proposal.new_calories} />
            <TargetChange label="Daily protein" current={targets.protein_g} next={proposal.new_protein_g} unit="g" />
          </div>
        </section>
      ) : null}

      <div className="mt-auto flex flex-col gap-2 pb-4 pt-[14px]">
        {proposal?.direction === 'hold' ? (
          <SecondaryButton disabled={submitting} onClick={() => void handleApply()} onNavy={false}>
            Keep current targets
          </SecondaryButton>
        ) : (
          <PrimaryButton
            className="h-[58px] justify-center"
            disabled={submitting}
            onClick={() => void handleApply()}
          >
            Apply new targets
          </PrimaryButton>
        )}
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
