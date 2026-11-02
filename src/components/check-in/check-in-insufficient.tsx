'use client'

import { toast } from 'sonner'

import { Dock, DockSpacer, INK_BUTTON } from '@/components/plans/spatial-parts'
import { MetricStrip } from '@/components/ui/fiqr/metric-strip'
import type { CheckInStatus } from '@/lib/api/check-in.api'
import { cn } from '@/lib/utils'

import { formatMetric, numberWord } from './format'
import { AskGeo, GeoRead, SectionTitle } from './parts'
import { SegmentsBar } from './segments-bar'
import { WeightTrendCard } from './weight-trend-card'

const capitalise = (word: string) => word.charAt(0).toUpperCase() + word.slice(1)

/**
 * Too few days (George 7c): Geo says why it is holding, with the days logged inside the read; what Geo could see is one
 * strip; Keep and Ask Geo sit together in the dock. Nothing is recorded; Keep goes back.
 */
export function CheckInInsufficient({ status, enter, source, onDone }: { status: CheckInStatus; enter: boolean; source: string | null; onDone: () => void }) {
  const { week_so_far: week, weight } = status
  const trend = weight.points.length >= 2

  const keepTargets = () => {
    toast.success('Targets unchanged')
    onDone()
  }

  const sessions = { label: 'Sessions', value: week.sessions_done, unit: `of ${week.sessions_planned}`, sub: 'this week' }
  const sleep = { label: 'Sleep', value: formatMetric(week.sleep_avg_h), unit: week.sleep_avg_h === null ? undefined : 'h', sub: week.sleep_nights ? `${week.sleep_nights} ${week.sleep_nights === 1 ? 'night' : 'nights'}` : 'not tracked' }
  const weighIn = { label: 'Weight', value: weight.current_kg === null ? '—' : weight.current_kg.toFixed(1), unit: weight.current_kg === null ? undefined : 'kg', sub: weight.points.length === 1 ? '1 weigh-in' : 'no trend yet' }

  return (
    <div className="flex flex-col">
      <GeoRead
        verdict={status.verdict ?? 'Not enough days logged to read this week, so I\'m leaving your targets alone.'}
        aside={null}
        className={cn(enter && 'enter-hero')}
        footer={(
        <div className="mt-[18px]">
          <SegmentsBar onNavy filled={status.days_logged} total={7} label={`${status.days_logged} of 7 days logged`} />
          <p className="mt-2.5 text-[14px] text-cream-60 tabular-nums">
            {status.days_logged} of 7 days logged. {capitalise(numberWord(status.days_needed))} next week gives me a real answer.
          </p>
        </div>
        )}
      />

      <SectionTitle>What I could see</SectionTitle>
      <div className="flex flex-col gap-2.5">
        {trend ? <WeightTrendCard currentKg={weight.current_kg} deltaKg={weight.delta_week_kg} points={weight.points} tone="muted" source={source} /> : null}
        <MetricStrip items={trend ? [sessions, sleep] : [weighIn, sessions, sleep]} />
      </div>
      <DockSpacer tall />

      <Dock>
        <button type="button" className={INK_BUTTON} onClick={keepTargets}>Keep current targets</button>
        <AskGeo />
      </Dock>
    </div>
  )
}
