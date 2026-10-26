'use client'

import type { CheckInStatus } from '@/lib/api/check-in.api'
import { cn } from '@/lib/utils'

import { formatMetric } from './format'
import { CARD, Count, SectionTitle } from './parts'
import { SegmentsBar } from './segments-bar'
import { ratio, StatTiles } from './stat-tiles'
import { WeightTrendCard } from './weight-trend-card'

function formatCheckInDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  const localDate = new Date(year, month - 1, day)
  const weekday = new Intl.DateTimeFormat('en-AU', { weekday: 'long' }).format(localDate)
  const dayMonth = new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short' }).format(localDate)
  return `${weekday} ${dayMonth}`
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.5 12.5l4 4 9-9" />
    </svg>
  )
}

export function CheckInMidWeek({ status, enter, source }: { status: CheckInStatus; enter: boolean; source: string | null }) {
  const { targets, week_so_far: week, weight } = status
  const daysElapsed = Math.max(0, 7 - status.days_to_go)
  const remaining = Math.max(0, status.days_needed - status.days_logged)
  const onTrack = status.days_logged >= daysElapsed

  return (
    <div className="flex flex-col gap-3">
      <section className={cn(CARD, 'p-5', enter && 'enter-hero')} aria-label="Next check-in">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[13px] font-semibold text-ink-65">Next check-in</span>
          <span className="text-right text-[13px] font-medium text-ink-65">{formatCheckInDate(status.next_check_in_date)}</span>
        </div>
        <span className="sr-only">{status.days_to_go} {status.days_to_go === 1 ? 'day' : 'days'} to go</span>
        <div aria-hidden="true" className="mt-3 flex items-baseline gap-2">
          <span className="font-wide text-[40px] font-[750] leading-none tracking-[-1px] text-ink"><Count value={status.days_to_go} /></span>
          <span className="text-[15px] font-semibold text-ink-65">{status.days_to_go === 1 ? 'day' : 'days'} to go</span>
        </div>
        <div className="mt-4">
          <SegmentsBar filled={daysElapsed} total={7} label={`${daysElapsed} of 7 days gone`} />
        </div>
      </section>

      <div className={cn(CARD, 'flex min-h-16 items-center gap-3 rounded-[16px] px-4 py-3')}>
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-cream"><CheckIcon /></span>
        <div className="min-w-0">
          <p className="text-[15.5px] font-semibold text-ink">{status.days_logged} of {daysElapsed} days logged</p>
          <p className="text-[13px] text-ink-65">
            {onTrack ? 'On track for a useful check-in' : `Log ${remaining} more ${remaining === 1 ? 'day' : 'days'} for a useful check-in`}
          </p>
        </div>
      </div>

      <section className="mt-3">
        <SectionTitle>This week so far</SectionTitle>
        <div className="flex flex-col gap-3">
          <WeightTrendCard currentKg={weight.current_kg} deltaKg={weight.delta_week_kg} points={weight.points} tone="muted" source={source} />
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

      <div className={cn(CARD, 'mt-3 flex min-h-16 items-center justify-between gap-4 rounded-[16px] px-5 py-3')}>
        <span className="text-[15px] font-semibold text-ink-65">Current targets</span>
        <span className="text-right text-[15px] font-semibold text-ink tabular-nums">
          {formatMetric(targets.calories)} kcal · {formatMetric(targets.protein_g)} g protein
        </span>
      </div>
    </div>
  )
}
