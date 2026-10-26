'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { ChevronRightIcon } from '@/components/ui/fiqr/icons'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { applyCheckIn, type CheckInStatus } from '@/lib/api/check-in.api'
import { syncBus } from '@/lib/sync/sync-bus'
import { cn } from '@/lib/utils'

import { formatDelta, formatMetric } from './format'
import { AskGeo, CARD, Count, GeoRead, INK_BUTTON, SectionTitle } from './parts'
import { ratio, StatTiles } from './stat-tiles'
import { WeightTrendCard } from './weight-trend-card'

interface CheckInDueProps {
  status: CheckInStatus
  refetch: () => Promise<void>
  /** True once Apply succeeded: the proposal settles into the new targets in place. */
  applied: boolean
  onApplied: () => void
  onDone: () => void
  enter: boolean
  source: string | null
}

const fade = 'transition-opacity duration-200 ease-out'

/** Old value, arrow, new value. On apply the old value and arrow fade out; the new value never moves. */
function TargetChange({ label, current, next, unit, applied }: {
  label: string
  current: number | null
  next: number
  unit: string
  applied: boolean
}) {
  const unchanged = current === next
  return (
    <div className="flex min-h-16 items-center gap-3 border-b border-ink-06 px-5 py-3 last:border-b-0">
      <span className="flex-1 text-[15.5px] font-semibold text-ink">{label}</span>
      {unchanged ? (
        <span className="text-[15px] font-semibold text-ink-65">No change</span>
      ) : (
        <span className="flex shrink-0 items-baseline gap-2 whitespace-nowrap">
          <span aria-hidden={applied} className={cn('flex items-center gap-2', fade, applied && 'opacity-0')}>
            <s className="text-[15px] text-ink-65 tabular-nums">{formatMetric(current)}</s>
            <ChevronRightIcon className="size-4 self-center text-ink-35" />
          </span>
          <span className="font-wide text-[22px] font-bold leading-none tracking-[-0.4px] text-ink tabular-nums">{next.toLocaleString()}</span>
          <span className="text-[13px] font-semibold text-ink-65">{unit}</span>
        </span>
      )}
    </div>
  )
}

export function CheckInDue({ status, refetch, applied, onApplied, onDone, enter, source }: CheckInDueProps) {
  const [submitting, setSubmitting] = useState(false)
  const { proposal, targets, week_so_far: week, weight } = status
  const hold = proposal?.direction === 'hold'

  const handleApply = async () => {
    if (submitting || applied) return
    setSubmitting(true)
    try {
      await applyCheckIn()
      onApplied()
      toast.success('Targets updated')
      await refetch()
      syncBus.emit('plans:updated')
    } catch {
      toast.error("That didn't save. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <GeoRead verdict={status.verdict} week={status.week.label} className={cn(enter && 'enter-hero')}>
        {weight.delta_week_kg === null ? null : (
          <div className="mb-1 mt-5">
            <span className="sr-only">{formatDelta(weight.delta_week_kg)} kg this week</span>
            <div aria-hidden="true" className="flex items-baseline gap-2">
              <span className="font-wider text-[56px] font-[800] leading-none tracking-[-1.5px] text-ink">
                <Count value={weight.delta_week_kg} format={formatDelta} />
              </span>
              <span className="text-[16px] font-semibold text-ink-65">kg this week</span>
            </div>
          </div>
        )}
      </GeoRead>

      {/* The decision comes first so the change and Apply sit in the first view; the week that explains it follows. */}
      {proposal ? (
        <section className="mt-3">
          {/* The heading crossfades in place, both lines share one grid cell. */}
          <div className="grid">
            <div aria-hidden={applied} className={cn('col-start-1 row-start-1', fade, applied && 'opacity-0')}><SectionTitle>{hold ? 'Your targets' : 'What changes'}</SectionTitle></div>
            <div aria-hidden={!applied} className={cn('col-start-1 row-start-1', fade, !applied && 'opacity-0')}><SectionTitle>{hold ? 'Targets kept' : 'Your new targets'}</SectionTitle></div>
          </div>
          <div className={cn(CARD, 'overflow-hidden')}>
            <TargetChange label="Daily calories" current={targets.calories} next={proposal.new_calories} unit="kcal" applied={applied} />
            <TargetChange label="Daily protein" current={targets.protein_g} next={proposal.new_protein_g} unit="g" applied={applied} />
          </div>
        </section>
      ) : null}

      <div className="mt-3 flex flex-col gap-1">
        {/* Apply and Done share one cell so the swap never moves the page. */}
        <div className="grid">
          <div inert={applied} className={cn('col-start-1 row-start-1', fade, applied && 'opacity-0')}>
            {hold ? (
              <button type="button" aria-busy={submitting} disabled={submitting} onClick={() => void handleApply()} className={INK_BUTTON}>
                {submitting ? 'Saving' : 'Keep current targets'}
              </button>
            ) : (
              <PrimaryButton
                aria-busy={submitting}
                className="h-[58px] disabled:bg-accent disabled:text-cream disabled:shadow-[var(--shadow-action)]"
                disabled={submitting}
                onClick={() => void handleApply()}
              >
                {submitting ? 'Updating your targets' : 'Apply new targets'}
              </PrimaryButton>
            )}
          </div>
          <div inert={!applied} className={cn('col-start-1 row-start-1', fade, !applied && 'opacity-0')}>
            <button type="button" onClick={onDone} className={INK_BUTTON}>Done</button>
          </div>
        </div>
        <AskGeo />
      </div>

      <section className="mt-3">
        <SectionTitle>Your week</SectionTitle>
        <div className="flex flex-col gap-3">
          <WeightTrendCard currentKg={weight.current_kg} deltaKg={weight.delta_week_kg} points={weight.points} tone="strong" source={source} hideDelta={weight.delta_week_kg !== null} />
          <StatTiles
            enter={enter}
            items={[
              { label: 'Avg calories', value: formatMetric(week.avg_calories), sub: `of ${formatMetric(targets.calories)} kcal`, fraction: ratio(week.avg_calories, targets.calories) },
              { label: 'Avg protein', value: formatMetric(week.avg_protein_g), unit: 'g', sub: `of ${formatMetric(targets.protein_g)} g`, fraction: ratio(week.avg_protein_g, targets.protein_g) },
              { label: 'Sessions', value: week.sessions_done, sub: `of ${week.sessions_planned} planned`, fraction: ratio(week.sessions_done, week.sessions_planned) },
              { label: 'Avg sleep', value: formatMetric(week.sleep_avg_h), unit: 'h', sub: `${week.sleep_nights} ${week.sleep_nights === 1 ? 'night' : 'nights'} tracked`, fraction: ratio(week.sleep_avg_h, 8) },
            ]}
          />
        </div>
      </section>
    </div>
  )
}
