'use client'

import type { CheckInStatus } from '@/lib/api/check-in.api'
import { cn } from '@/lib/utils'

import type { DayTargets } from './apply-targets'
import { formatMetric } from './format'
import { CARD, Count, SectionTitle, TargetLedger } from './parts'
import { SegmentsBar } from './segments-bar'
import { ratio, StatTiles } from './stat-tiles'
import { WeightTrendCard } from './weight-trend-card'

function formatCheckInDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  const localDate = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }).format(localDate).replace(',', '')
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.5 12.5l4 4 9-9" />
    </svg>
  )
}

/** Mid-week: nothing is being decided, so nothing on the screen is orange (mock "Check-in states", Mid-week). */
export function CheckInMidWeek({ status, current, enter, source }: { status: CheckInStatus; current: DayTargets; enter: boolean; source: string | null }) {
  const { targets, week_so_far: week, weight } = status
  const daysElapsed = Math.max(0, 7 - status.days_to_go)
  const remaining = Math.max(0, status.days_needed - status.days_logged)
  const onTrack = remaining === 0

  return (
    <div className="flex flex-col">
      <section className={cn(CARD, 'p-4', enter && 'enter-hero')} aria-label="Next check-in">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-label text-ink-65">Next check-in</span>
          <span className="text-right text-label text-ink-65">{formatCheckInDate(status.next_check_in_date)}</span>
        </div>
        <span className="sr-only">{status.days_to_go} {status.days_to_go === 1 ? 'day' : 'days'} to go</span>
        <div aria-hidden="true" className="mt-3 flex items-baseline gap-1.5">
          <span className="font-display text-hero text-ink tabular-nums"><Count value={status.days_to_go} /></span>
          <span className="text-body-sm font-semibold text-ink-65">{status.days_to_go === 1 ? 'day' : 'days'} to go</span>
        </div>
        <div className="mt-3">
          <SegmentsBar filled={daysElapsed} total={7} label={`${daysElapsed} of 7 days gone`} />
        </div>
      </section>

      <div className={cn(CARD, 'mt-2.5 flex min-h-16 items-center gap-3 px-4 py-3')}>
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-macro-teal text-cream"><CheckIcon /></span>
        <div className="min-w-0">
          <p className="text-body font-bold text-ink">{status.days_logged} of {status.days_needed} days logged</p>
          <p className="text-caption text-ink-65">
            {onTrack ? 'Enough for a useful check-in' : `Log ${remaining} more ${remaining === 1 ? 'day' : 'days'} for a useful check-in`}
          </p>
        </div>
      </div>

      <SectionTitle>Week so far, {status.week.label}</SectionTitle>
      <div className="flex flex-col gap-2.5">
        <StatTiles
          enter={enter}
          items={[
            { label: 'Avg calories', value: formatMetric(week.avg_calories), sub: `of ${formatMetric(targets.calories)} kcal`, fraction: ratio(week.avg_calories, targets.calories) },
            { label: 'Avg protein', value: formatMetric(week.avg_protein_g), unit: 'g', sub: `of ${formatMetric(targets.protein_g)} g`, fraction: ratio(week.avg_protein_g, targets.protein_g) },
            { label: 'Sessions', value: week.sessions_done, sub: `of ${week.sessions_planned} planned`, fraction: ratio(week.sessions_done, week.sessions_planned) },
            { label: 'Avg sleep', value: formatMetric(week.sleep_avg_h), unit: 'h', sub: `${week.sleep_nights} ${week.sleep_nights === 1 ? 'night' : 'nights'} tracked`, fraction: ratio(week.sleep_avg_h, 8) },
          ]}
        />
        <WeightTrendCard currentKg={weight.current_kg} deltaKg={weight.delta_week_kg} points={weight.points} tone="muted" source={source} />
      </div>

      <SectionTitle>Current targets</SectionTitle>
      <TargetLedger targets={current} />
      <div aria-hidden="true" className="h-[calc(24px+var(--safe-bottom))]" />
    </div>
  )
}
