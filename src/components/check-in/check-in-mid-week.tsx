import { SectionLabel } from '@/components/ui/fiqr/section-label'
import type { CheckInStatus } from '@/lib/api/check-in.api'

import { formatMetric } from './format'
import { SegmentsBar } from './segments-bar'
import { StatTiles } from './stat-tiles'
import { WeightTrendCard } from './weight-trend-card'

function formatCheckInDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  const localDate = new Date(year, month - 1, day)
  const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(localDate)
  const dayMonth = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(localDate)
  return `${weekday} ${dayMonth}`
}

export function CheckInMidWeek({ status }: { status: CheckInStatus }) {
  const { targets, week_so_far: week, weight } = status
  const daysElapsed = Math.max(0, 7 - status.days_to_go)
  const remaining = Math.max(0, status.days_needed - status.days_logged)
  const onTrack = status.days_logged >= daysElapsed

  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-[18px] rounded-[20px] border border-ink-12 bg-card p-5">
        <div className="flex items-baseline justify-between gap-3">
          <SectionLabel>Next check-in</SectionLabel>
          <span className="text-right text-[13.5px] text-ink-55">{formatCheckInDate(status.next_check_in_date)}</span>
        </div>
        <span className="sr-only">{status.days_to_go} days to go</span>
        <div aria-hidden="true" className="mt-[14px] flex items-baseline gap-[9px]">
          <span className="text-[36px] font-bold leading-none tracking-[-0.8px]">{status.days_to_go}</span>
          <span className="text-[15.5px] font-medium text-ink-80">days to go</span>
        </div>
        <div className="mt-[14px]">
          <SegmentsBar filled={daysElapsed} tone="ink" total={7} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-[16px] bg-ink-08 p-[14px]">
        <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full border border-ink text-[14px] font-semibold" aria-hidden="true">
          ✓
        </span>
        <div className="min-w-0">
          <p className="text-[15.5px] font-semibold">{status.days_logged} of {daysElapsed} days logged</p>
          <p className="text-[13.5px] text-ink-62">
            {onTrack ? 'On track for a useful check-in' : `Log ${remaining} more days for a useful check-in`}
          </p>
        </div>
      </div>

      <section className="mt-[22px] space-y-[11px]">
        <SectionLabel>This week so far</SectionLabel>
        <WeightTrendCard
          currentKg={weight.current_kg}
          deltaKg={weight.delta_week_kg}
          note={`${weight.points.length} weeks`}
          points={weight.points}
          tone="muted"
        />
        <StatTiles
          cols={2}
          items={[
            { label: 'Avg calories', value: formatMetric(week.avg_calories), sub: `of ${formatMetric(targets.calories)}` },
            { label: 'Avg protein', value: formatMetric(week.avg_protein_g), unit: 'g', sub: `of ${formatMetric(targets.protein_g)}g` },
            { label: 'Sessions', value: week.sessions_done, sub: `of ${week.sessions_planned} planned` },
            {
              label: 'Avg sleep',
              value: formatMetric(week.sleep_avg_h),
              unit: 'h',
              sub: `${week.sleep_nights} ${week.sleep_nights === 1 ? 'night' : 'nights'} tracked`,
            },
          ]}
        />
      </section>

      <div className="mt-auto flex items-baseline justify-between gap-4 border-t border-ink-09 pb-[22px] pt-4">
        <span className="text-[15.5px] font-medium text-ink-62">Current targets</span>
        <span className="text-right text-[15.5px] font-semibold">
          {formatMetric(targets.calories)} kcal · {formatMetric(targets.protein_g)}g protein
        </span>
      </div>
    </div>
  )
}
