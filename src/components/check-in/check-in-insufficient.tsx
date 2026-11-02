'use client'

import { toast } from 'sonner'

import { Dock, DockSpacer, INK_BUTTON } from '@/components/plans/spatial-parts'
import type { CheckInStatus } from '@/lib/api/check-in.api'
import { cn } from '@/lib/utils'

import { formatMetric, numberWord } from './format'
import { AskGeo, CARD, Count, GeoRead, SectionTitle } from './parts'
import { SegmentsBar } from './segments-bar'
import { ratio, StatTiles } from './stat-tiles'
import { WeightTrendCard } from './weight-trend-card'

const capitalise = (word: string) => word.charAt(0).toUpperCase() + word.slice(1)

/** Too few days: targets hold, nothing is recorded; Keep goes back (mock "Check-in states", Too few days). */
export function CheckInInsufficient({ status, enter, source, onDone }: { status: CheckInStatus; enter: boolean; source: string | null; onDone: () => void }) {
  const { week_so_far: week, weight } = status

  const keepTargets = () => {
    toast.success('Targets unchanged')
    onDone()
  }

  return (
    <div className="flex flex-col">
      {status.verdict ? <GeoRead verdict={status.verdict} aside={null} className={cn(enter && 'enter-hero')} /> : null}

      <section className={cn(CARD, 'mt-[10px] px-[16px] py-[14px]', enter && 'enter-hero')} aria-label="Days logged">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[15.5px] font-semibold text-ink tabular-nums"><Count value={status.days_logged} /> of 7 days logged</span>
          <span className="text-[13px] text-ink-62">{status.days_needed} needed</span>
        </div>
        <div className="mt-3">
          <SegmentsBar filled={status.days_logged} total={7} label={`${status.days_logged} of 7 days logged`} />
        </div>
        <p className="mt-[10px] text-pretty text-[13px] leading-[1.4] text-ink-65">
          {capitalise(numberWord(status.days_needed))} days next week gives me a real answer.
        </p>
      </section>

      <SectionTitle>What I could see</SectionTitle>
      <div className="flex flex-col gap-2.5">
        <WeightTrendCard currentKg={weight.current_kg} deltaKg={weight.delta_week_kg} points={weight.points} tone="muted" source={source} />
        <StatTiles
          enter={enter}
          items={[
            { label: 'Sessions', value: week.sessions_done, sub: `of ${week.sessions_planned} planned`, fraction: ratio(week.sessions_done, week.sessions_planned) },
            { label: 'Avg sleep', value: formatMetric(week.sleep_avg_h), unit: 'h', sub: `${week.sleep_nights} ${week.sleep_nights === 1 ? 'night' : 'nights'} tracked`, fraction: ratio(week.sleep_avg_h, 8) },
          ]}
        />
        <p className="rounded-[16px] bg-ink-06 px-[14px] py-3 text-[13px] leading-[1.4] text-ink-65">
          Food averages are hidden. {capitalise(numberWord(status.days_logged))} {status.days_logged === 1 ? 'day isn’t' : 'days aren’t'} a week.
        </p>
      </div>
      <AskGeo />
      <DockSpacer />

      <Dock>
        <button type="button" className={INK_BUTTON} onClick={keepTargets}>Keep current targets</button>
      </Dock>
    </div>
  )
}
