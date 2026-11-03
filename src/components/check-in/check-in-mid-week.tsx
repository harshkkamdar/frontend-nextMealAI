'use client'

import { Busy, INK_BUTTON } from '@/components/plans/spatial-parts'
import type { CheckInStatus } from '@/lib/api/check-in.api'
import { cn } from '@/lib/utils'

import type { DayTargets } from './apply-targets'
import { formatMetric, numberWord } from './format'
import { AskGeo, CARD, Count, SectionTitle, TargetLedger } from './parts'
import { ratio, StatTiles } from './stat-tiles'
import { dateLabel, DayStrip, type WeekDetail } from './week-detail'
import { WeightTrendCard } from './weight-trend-card'

const fmt = (n: number) => Math.round(n).toLocaleString('en-AU')

interface CheckInMidWeekProps {
  status: CheckInStatus
  current: DayTargets
  enter: boolean
  source: string | null
  today: string
  onDetail: (detail: WeekDetail) => void
  /** Starts a check-in on the last seven days; null hides it (this week is already checked in). */
  onCheckInNow: () => void
  starting: boolean
}

/**
 * Between check-ins: the week in progress, day by day, and every number opens its detail. "Check in now" runs Geo's
 * review on the last seven days, so nobody has to wait for the check-in day. Nothing here is orange: Apply, on the
 * review itself, is the one orange action.
 */
export function CheckInMidWeek({ status, current, enter, source, today, onDetail, onCheckInNow, starting }: CheckInMidWeekProps) {
  const { targets, week_so_far: week, weight } = status
  const short = Math.max(0, status.days_needed - status.days_logged)
  const daysLeft = 7 - status.days_elapsed
  const coverage = short === 0
    ? 'Enough for a useful check-in.'
    : short > daysLeft
      ? `Geo needs ${numberWord(status.days_needed)} logged days for a full read.`
      : `Log ${short} more ${short === 1 ? 'day' : 'days'} for a useful check-in.`
  const last = status.last_check_in
  const checkedIn = last !== null && last.date >= status.week.start

  return (
    <div className="flex flex-col">
      <section className={cn(CARD, 'p-4', enter && 'enter-hero')} aria-label="Next check-in">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[1.4px] text-ink-62">Next check-in</span>
          <span className="text-right text-[13px] text-ink-62">{dateLabel(status.next_check_in_date)}</span>
        </div>
        <span className="sr-only">{status.days_to_go} {status.days_to_go === 1 ? 'day' : 'days'} to go</span>
        <div aria-hidden="true" className="mt-2 flex items-baseline gap-1.5">
          <span className="text-[32px] font-bold leading-none tracking-[-0.6px] text-ink tabular-nums"><Count value={status.days_to_go} /></span>
          <span className="text-[15.5px] font-medium text-ink-65">{status.days_to_go === 1 ? 'day' : 'days'} to go</span>
        </div>
        <div className="-mx-1 mt-3">
          <DayStrip days={status.days} today={today} onDay={(date) => onDetail({ kind: 'day', date })} />
        </div>
        <p className="mt-2 text-caption text-ink-65 tabular-nums">
          <b className="font-semibold text-ink">{status.days_logged} of {status.days_elapsed} {status.days_elapsed === 1 ? 'day' : 'days'} logged</b> so far. {coverage}
        </p>
      </section>

      {last && checkedIn ? (
        <p className={cn(CARD, 'mt-2.5 px-4 py-3 text-caption leading-[1.4] text-ink-65')}>
          <b className="font-semibold text-ink">Checked in {dateLabel(last.date)}.</b>{' '}
          {last.applied && last.calories ? `Your targets moved to ${fmt(last.calories)} kcal.` : 'Your targets stayed the same.'}
        </p>
      ) : (
        <div className="mt-2.5">
          <button type="button" className={INK_BUTTON} onClick={onCheckInNow} disabled={starting} aria-busy={starting || undefined}>
            {starting ? <Busy>Reading your week</Busy> : 'Check in now'}
          </button>
          <p className="mt-2 px-2 text-center text-caption text-ink-65">Geo reviews your last 7 days and suggests your targets.</p>
        </div>
      )}

      <SectionTitle>This week so far</SectionTitle>
      <div className="flex flex-col gap-2.5">
        <StatTiles
          enter={enter}
          items={[
            { label: 'Avg calories', value: formatMetric(week.avg_calories), sub: `of ${formatMetric(targets.calories)} kcal`, fraction: ratio(week.avg_calories, targets.calories), onClick: () => onDetail({ kind: 'calories' }) },
            { label: 'Avg protein', value: formatMetric(week.avg_protein_g), unit: 'g', sub: `of ${formatMetric(targets.protein_g)} g`, fraction: ratio(week.avg_protein_g, targets.protein_g), onClick: () => onDetail({ kind: 'protein' }) },
            { label: 'Sessions', value: week.sessions_done, sub: `of ${week.sessions_planned} planned`, fraction: ratio(week.sessions_done, week.sessions_planned), onClick: () => onDetail({ kind: 'sessions' }) },
            { label: 'Avg sleep', value: week.sleep_avg_h === null ? '—' : week.sleep_avg_h.toFixed(1), unit: 'h', sub: `${week.sleep_nights} ${week.sleep_nights === 1 ? 'night' : 'nights'} tracked`, fraction: ratio(week.sleep_avg_h, 8), onClick: () => onDetail({ kind: 'sleep' }) },
          ]}
        />
        <WeightTrendCard currentKg={weight.current_kg} deltaKg={weight.delta_week_kg} points={weight.points} tone="muted" source={source} onOpen={() => onDetail({ kind: 'weight' })} />
      </div>

      <SectionTitle>Current targets</SectionTitle>
      <TargetLedger targets={current} />
      <AskGeo label="Ask Geo about my week" />
      <div aria-hidden="true" className="h-[calc(24px+var(--safe-bottom))]" />
    </div>
  )
}
