'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { Busy, Dock, DockSpacer, INK_BUTTON, ORANGE_BUTTON, SOFT_BUTTON, TextButton } from '@/components/plans/spatial-parts'
import { applyCheckIn, type CheckInStatus } from '@/lib/api/check-in.api'
import { useOnline } from '@/lib/platform/network'
import { syncBus } from '@/lib/sync/sync-bus'

import { appliedTargets, changeSentence, proposalChanges, savedTargets, type DayTargets } from './apply-targets'
import { formatDelta, formatMetric } from './format'
import { AskGeo, GeoRead, SectionTitle } from './parts'
import { ratio, StatTiles } from './stat-tiles'
import { TodayPreview } from './today-preview'
import type { WeekDetail } from './week-detail'
import { WeightTrendCard } from './weight-trend-card'

/** What the screen knows besides the status: today's intake, carbs and fat now, and the plan Apply also rewrites. */
export interface TodayContext {
  eaten: { calories: number; protein: number; carbs: number; fat: number }
  carbs: number | null
  fat: number | null
  /** The active nutrition plan's name when it pins daily targets (Apply patches those in place). */
  planName: string | null
}

interface CheckInDueProps {
  status: CheckInStatus
  today: TodayContext
  refetch: () => Promise<void>
  onApplied: () => void
  onDone: () => void
  source: string | null
  onDetail: (detail: WeekDetail) => void
}

const fmt = (n: number) => Math.round(n).toLocaleString('en-AU')
const BAND = 'rounded-card px-4 py-3 text-caption leading-[1.4] text-ink'

/** Today's targets as four numbers; carbs and fat come from the plan or profile. */
export function currentTargets(status: Pick<CheckInStatus, 'targets'>, today: Pick<TodayContext, 'carbs' | 'fat'>): DayTargets {
  const calories = status.targets.calories ?? 0
  const protein = status.targets.protein_g ?? 0
  // shortcut: a profile without carbs or fat (never set) reads as the 28% split; upgrade if the status ever sends all four.
  const split = appliedTargets(calories, protein)
  return { calories, protein, carbs: today.carbs ?? split.carbs, fat: today.fat ?? split.fat }
}

export function CheckInDue({ status, today, refetch, onApplied, onDone, source, onDetail }: CheckInDueProps) {
  const online = useOnline()
  const [submitting, setSubmitting] = useState(false)
  const [keeping, setKeeping] = useState(false)
  const [failed, setFailed] = useState(false)
  const [outcome, setOutcome] = useState<{ saved: DayTargets | null } | null>(null)
  const [showNew, setShowNew] = useState(true)
  const { proposal, targets, week_so_far: week, weight } = status
  const changes = proposalChanges(status)
  const current = currentTargets(status, today)
  const proposed = changes && proposal ? appliedTargets(proposal.new_calories, proposal.new_protein_g) : null
  // After Apply the screen shows what the backend saved, which can differ from the proposal (it re-decides on POST).
  const next = outcome ? outcome.saved : proposed

  const handleApply = async () => {
    if (submitting || outcome || !proposal) return
    setSubmitting(true)
    setFailed(false)
    try {
      const result = await applyCheckIn(status.week.end)
      const saved = savedTargets(result, proposal, targets.protein_g)
      setOutcome({ saved })
      onApplied()
      if (saved) toast.success('Targets updated')
      await refetch()
      syncBus.emit('plans:updated')
    } catch {
      setFailed(true)
    } finally {
      setSubmitting(false)
    }
  }

  // Keeping is a decision too: it records this week's check-in, so the review doesn't come back until the next one.
  const keep = async () => {
    if (keeping || submitting) return
    setKeeping(true)
    try {
      await applyCheckIn(status.week.end, false)
      toast.success('Targets unchanged')
      onDone()
    } catch {
      toast.error("Couldn't save that. Try again.")
    } finally {
      setKeeping(false)
    }
  }

  const where = `Home, your food diary${today.planName ? ` and ${today.planName}` : ''}`
  const band = outcome
    ? outcome.saved
      ? <p role="status" className={`${BAND} bg-macro-teal/10`}>Saved. {where} now use {fmt(outcome.saved.calories)} kcal.</p>
      : <p role="status" className={`${BAND} bg-ink-06`}>Nothing changed. Your targets are still {fmt(current.calories)} kcal.</p>
    : failed
      ? <p role="alert" className={`${BAND} bg-accent/10`}>That didn&apos;t save, so your targets are still {fmt(current.calories)} kcal. Check your connection and try again.</p>
      : !changes
        ? <p className={`${BAND} bg-ink-06`}>No change this week. {where} keep {fmt(current.calories)} kcal.</p>
        : proposed
          ? <p className="mx-1.5 text-caption leading-[1.4] text-ink-65">{changeSentence(current, proposed, today.planName)}</p>
          : null

  // The header already shows the week; the card's corner carries the week's weight change, when there is one.
  const aside = weight.delta_week_kg === null ? null : `${formatDelta(weight.delta_week_kg)} kg this week`

  return (
    <div className="flex flex-col">
      <GeoRead verdict={status.verdict} aside={aside} />

      <div className="mt-2.5">
        <TodayPreview current={current} next={next} eaten={today.eaten} showNew={showNew} onShowNew={setShowNew} settled={!!outcome} />
      </div>
      <div className="mt-2.5">{band}</div>
      <AskGeo />

      <SectionTitle>Your week</SectionTitle>
      <div className="flex flex-col gap-2.5">
        <WeightTrendCard currentKg={weight.current_kg} deltaKg={weight.delta_week_kg} points={weight.points} tone="strong" source={source} hideDelta={weight.delta_week_kg !== null} onOpen={() => onDetail({ kind: 'weight' })} />
        <StatTiles
          items={[
            { label: 'Avg calories', value: formatMetric(week.avg_calories), sub: `of ${formatMetric(targets.calories)} kcal`, fraction: ratio(week.avg_calories, targets.calories), onClick: () => onDetail({ kind: 'calories' }) },
            { label: 'Avg protein', value: formatMetric(week.avg_protein_g), unit: 'g', sub: `of ${formatMetric(targets.protein_g)} g`, fraction: ratio(week.avg_protein_g, targets.protein_g), onClick: () => onDetail({ kind: 'protein' }) },
            { label: 'Sessions', value: week.sessions_done, sub: `of ${week.sessions_planned} planned`, fraction: ratio(week.sessions_done, week.sessions_planned), onClick: () => onDetail({ kind: 'sessions' }) },
            { label: 'Avg sleep', value: week.sleep_avg_h === null ? '—' : week.sleep_avg_h.toFixed(1), unit: 'h', sub: `${week.sleep_nights} ${week.sleep_nights === 1 ? 'night' : 'nights'} tracked`, fraction: ratio(week.sleep_avg_h, 8), onClick: () => onDetail({ kind: 'sleep' }) },
          ]}
        />
      </div>
      <DockSpacer tall={changes && !outcome} />

      <Dock>
        {/* Apply and Done share one cell and crossfade, so the swap never jumps (opacity only). */}
        <div className="grid">
          <div inert={!!outcome} className={`col-start-1 row-start-1 transition-opacity duration-200 ease-out ${outcome ? 'opacity-0' : ''}`}>
            {!changes ? (
              // A hold changes nothing, so keeping records nothing: Apply is never called for it.
              <button type="button" onClick={() => void keep()} disabled={keeping} aria-busy={keeping || undefined} className={INK_BUTTON}>{keeping ? <Busy>Saving</Busy> : 'Keep my targets'}</button>
            ) : !online ? (
              <button type="button" disabled className={SOFT_BUTTON}>Apply when you&apos;re back online</button>
            ) : (
              <button type="button" aria-busy={submitting || undefined} disabled={submitting} onClick={() => void handleApply()} className={ORANGE_BUTTON}>
                {submitting || outcome ? <Busy>Updating your targets</Busy> : failed ? 'Try again' : 'Apply new targets'}
              </button>
            )}
          </div>
          <div inert={!outcome} className={`col-start-1 row-start-1 transition-opacity duration-200 ease-out ${outcome ? '' : 'opacity-0'}`}>
            <button type="button" onClick={onDone} className={INK_BUTTON}>Done</button>
          </div>
        </div>
        {/* A proposal can be turned down: Keep records the check-in without changing anything. */}
        {changes && !outcome ? <TextButton onClick={() => void keep()}>{keeping ? 'Saving…' : 'Keep current targets'}</TextButton> : null}
      </Dock>
    </div>
  )
}
