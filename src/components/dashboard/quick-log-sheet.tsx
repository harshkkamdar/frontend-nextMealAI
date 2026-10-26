'use client'

import { useId, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { WeightFill } from '@/components/ui/fiqr/icons'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { createLogWithStatus } from '@/lib/api/logs.api'
import { haptic } from '@/lib/platform/app'
import { useOnline } from '@/lib/platform/network'
import { cn } from '@/lib/utils'
import type { CreateLogInput } from '@/types/logs.types'
import { WATER_GOAL_GLASSES, weightDeltaText } from './home-cards'
import { AlertIcon, MinusLine, PlusLine } from './home-icons'
import { formatSleep } from './home-data'

export type QuickLogType = 'water' | 'mood' | 'sleep' | 'energy' | 'weight' | null

const glasses = (n: number) => `${n} ${n === 1 ? 'glass' : 'glasses'}`

function Title({ children }: { children: ReactNode }) {
  return <h2 className="font-display text-[22px] font-extrabold leading-tight text-ink">{children}</h2>
}

const ROUND = 'grid size-stepper shrink-0 place-items-center rounded-full bg-ink-06 text-ink transition-transform active:scale-[.94] disabled:opacity-35'

function Stepper({ value, unit, label, onChange, step = 1, min = 0, max = 99, format = String }: {
  value: number
  unit: string
  /** Names the two buttons, less then more. */
  label: [string, string]
  onChange: (next: number) => void
  step?: number
  min?: number
  max?: number
  format?: (n: number) => string
}) {
  const set = (next: number) => {
    const clamped = Math.min(max, Math.max(min, Math.round(next * 10) / 10))
    if (clamped !== value) void haptic('selection')
    onChange(clamped)
  }
  return (
    <div className="flex items-center justify-center gap-10">
      <button type="button" aria-label={label[0]} disabled={value <= min} onClick={() => set(value - step)} className={ROUND}><MinusLine className="size-5" /></button>
      <div className="min-w-20 text-center">
        <span className="font-display text-title leading-none text-ink tabular-nums" aria-live="polite">{format(value)}</span>
        <p className="mt-1 text-caption font-semibold text-ink-65">{unit}</p>
      </div>
      <button type="button" aria-label={label[1]} disabled={value >= max} onClick={() => set(value + step)} className={ROUND}><PlusLine className="size-5" /></button>
    </div>
  )
}

function Scale({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-5 gap-2">
      {Array.from({ length: 10 }, (_, index) => index + 1).map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={n === value}
          onClick={() => { void haptic('selection'); onChange(n) }}
          className={cn('h-12 rounded-[14px] text-[16px] font-semibold tabular-nums transition-transform active:scale-[.94]', n === value ? 'bg-ink text-cream' : 'bg-ink-06 text-ink')}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

/** Saves one log; a failure keeps the sheet open with the reason, offline saves to the queue and says so. */
function useSave(onDone: () => void) {
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const save = async (input: CreateLogInput, success: string) => {
    setSaving(true)
    setFailed(false)
    try {
      const result = await createLogWithStatus(input)
      void haptic('success')
      toast.success(result.queued ? `${success}. Saved on your phone, syncs when you're back online` : success)
      onDone()
    } catch {
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }
  return { saving, failed, save }
}

function Hint({ id, bad, children }: { id?: string; bad?: boolean; children: ReactNode }) {
  // Orange text fails contrast, so a problem is ink and bold with an orange mark.
  return (
    <p id={id} role={bad ? 'alert' : undefined} className={cn('flex items-start gap-1.5 text-[13px] leading-[1.3]', bad ? 'font-semibold text-ink' : 'text-ink-65')}>
      {bad ? <AlertIcon className="mt-px size-4 shrink-0 text-accent" /> : null}{children}
    </p>
  )
}

function SaveButton({ saving, disabled, onClick, children }: { saving: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return <PrimaryButton type="button" disabled={saving || disabled} onClick={onClick}>{saving ? 'Saving…' : children}</PrimaryButton>
}

function WaterSheet({ today, onDone }: { today: number; onDone: () => void }) {
  const [count, setCount] = useState(1)
  const { saving, failed, save } = useSave(onDone)
  const online = useOnline()
  const after = today + count
  return (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <Title>Water</Title>
        <span className="text-caption font-semibold text-ink-65 tabular-nums">{today} of {WATER_GOAL_GLASSES} today</span>
      </div>
      {/* Today plus what you are adding, one square per glass. */}
      <div className="flex flex-wrap justify-center gap-1.5" aria-hidden="true">
        {Array.from({ length: Math.max(WATER_GOAL_GLASSES, after) }, (_, index) => (
          <span key={index} className={cn('h-6 w-[18px] rounded-[5px] transition-colors duration-200', index < today ? 'bg-macro-teal' : index < after ? 'bg-macro-teal/45' : 'bg-ink-06')} />
        ))}
      </div>
      <Stepper value={count} unit={count === 1 ? 'glass' : 'glasses'} label={['One glass less', 'One glass more']} min={1} max={20} onChange={setCount} />
      {failed ? <Hint bad>Couldn&apos;t log water. Check your connection and try again.</Hint> : null}
      {!online && !failed ? <Hint>You&apos;re offline. This saves on your phone and syncs when you&apos;re back.</Hint> : null}
      <SaveButton saving={saving} onClick={() => void save({ type: 'water', payload: { glasses: count }, source: 'manual' }, `Water logged, ${after} of ${WATER_GOAL_GLASSES}`)}>
        {failed ? 'Try again' : `Add ${glasses(count)}`}
      </SaveButton>
    </>
  )
}

function MoodEnergySheet({ type, onDone }: { type: 'mood' | 'energy'; onDone: () => void }) {
  const [rating, setRating] = useState(0)
  const { saving, failed, save } = useSave(onDone)
  const title = type === 'mood' ? 'Mood' : 'Energy'
  return (
    <>
      <Title>{title}</Title>
      <p className="-mt-2 text-body-sm text-ink-65">{type === 'mood' ? 'How are you feeling, 1 to 10?' : 'How much energy do you have, 1 to 10?'}</p>
      <Scale value={rating} onChange={setRating} label={`${title} from 1 to 10`} />
      {failed ? <Hint bad>Couldn&apos;t log {title.toLowerCase()}. Try again.</Hint> : null}
      <SaveButton saving={saving} disabled={!rating} onClick={() => void save({ type, payload: { rating }, source: 'manual' }, `${title} logged`)}>Save</SaveButton>
    </>
  )
}

function SleepSheet({ onDone }: { onDone: () => void }) {
  const [hours, setHours] = useState(7.5)
  const [quality, setQuality] = useState(0)
  const { saving, failed, save } = useSave(onDone)
  return (
    <>
      <Title>Last night</Title>
      <Stepper value={hours} unit="asleep" label={['Half an hour less', 'Half an hour more']} step={0.5} min={0.5} max={16} onChange={setHours} format={formatSleep} />
      <div>
        <p className="mb-2 text-caption font-semibold text-ink-65">How well did you sleep?</p>
        <Scale value={quality} onChange={setQuality} label="Sleep quality from 1 to 10" />
      </div>
      {failed ? <Hint bad>Couldn&apos;t log sleep. Try again.</Hint> : null}
      <SaveButton saving={saving} disabled={!quality} onClick={() => void save({ type: 'sleep', payload: { hours, quality_rating: quality }, source: 'manual' }, `Sleep logged, ${formatSleep(hours)}`)}>Save</SaveButton>
    </>
  )
}

export interface WeightHistory {
  kg: number | null
  weekDelta: number | null
  /** Oldest to newest, one per day with a weigh-in. */
  series: number[]
  /** Day of the newest weigh-in, YYYY-MM-DD; null when the weight comes from the profile. */
  date: string | null
  today: string
}

/** "today", a weekday within the last week, else "21 Oct". */
export function dayLabel(date: string, today: string): string {
  const at = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d) }
  const days = Math.round((at(today) - at(date)) / 86400000)
  if (days === 0) return 'today'
  const opts: Intl.DateTimeFormatOptions = days > 0 && days < 7 ? { weekday: 'short', timeZone: 'UTC' } : { day: 'numeric', month: 'short', timeZone: 'UTC' }
  return `on ${new Date(at(date)).toLocaleDateString('en-AU', opts)}`
}

/** Teal area trend of the recent weigh-ins, the newest one marked. */
function WeightTrend({ series }: { series: number[] }) {
  if (series.length < 2) return <p className="rounded-[18px] bg-macro-teal/10 px-4 py-5 text-caption text-ink-65">Your trend draws after two weigh-ins.</p>
  const lo = Math.min(...series) - 0.1
  const hi = Math.max(...series) + 0.1
  const H = 64
  const points = series.map((v, i) => [(i * 100) / (series.length - 1), 6 + ((hi - v) / (hi - lo)) * (H - 12)])
  const line = 'M' + points.map((p) => p.map((n) => n.toFixed(1)).join(' ')).join('L')
  const [lx, ly] = points[points.length - 1]
  return (
    <div className="rounded-[18px] bg-macro-teal/10 px-3 pb-2 pt-3">
      <span className="relative block h-16">
        <svg viewBox={`0 0 100 ${H}`} className="block size-full overflow-visible" preserveAspectRatio="none" role="img" aria-label={`Weight, last ${series.length} weigh-ins, ${series[0]} to ${series[series.length - 1]} kg`}>
          <path d={`${line}L100 ${H}L0 ${H}Z`} fill="var(--color-macro-teal)" fillOpacity=".14" />
          <path d={line} fill="none" stroke="var(--color-macro-teal)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {/* An HTML dot so it stays round under the stretched viewBox. */}
        <span className="absolute size-2 -translate-1/2 rounded-full bg-macro-teal" style={{ left: `${lx}%`, top: `${(ly / H) * 100}%` }} aria-hidden="true" />
      </span>
      <span className="mt-1 flex justify-between text-label font-medium text-ink-65">
        <span>{series.length} weigh-ins ago</span><span>Latest</span>
      </span>
    </div>
  )
}

function WeightSheet({ history, onDone }: { history: WeightHistory; onDone: () => void }) {
  const [kg, setKg] = useState(history.kg ? history.kg.toFixed(1) : '')
  const { saving, failed, save } = useSave(onDone)
  const hintId = useId()
  const value = Number(kg)
  const valid = kg !== '' && Number.isFinite(value) && value >= 20 && value <= 400
  const bad = kg !== '' && !valid
  const nudge = (by: number) => {
    const base = kg !== '' && Number.isFinite(value) ? value : history.kg ?? 70
    void haptic('selection')
    setKg((Math.round((base + by) * 10) / 10).toFixed(1))
  }
  const delta = weightDeltaText(history.weekDelta)
  const down = history.weekDelta !== null && history.weekDelta < 0
  return (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-macro-teal/12 text-macro-teal"><WeightFill className="size-5" /></span>
        <div className="min-w-32 flex-1">
          <Title>Weight</Title>
          <p className="truncate text-caption text-ink-65">{history.date && history.kg ? `Last ${history.kg.toFixed(1)} kg ${dayLabel(history.date, history.today)}` : 'First weigh-in'}</p>
        </div>
        {delta ? <span className={cn('shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold', down ? 'bg-macro-teal text-card' : 'bg-ink-06 text-ink')}>{delta} this week</span> : null}
      </div>
      <WeightTrend series={history.series.slice(-14)} />
      <div className={cn('flex h-field items-center gap-2 rounded-[20px] bg-card px-2 outline outline-1 -outline-offset-1', bad ? 'outline-accent' : 'outline-ink-10')}>
        <button type="button" aria-label="Down 0.1 kg" onClick={() => nudge(-0.1)} className="grid size-11 shrink-0 place-items-center rounded-full bg-ink-06 text-ink active:scale-[.94]"><MinusLine className="size-5" /></button>
        <input
          inputMode="decimal"
          placeholder="75.0"
          value={kg}
          aria-label="Weight in kilograms"
          aria-describedby={hintId}
          aria-invalid={bad}
          onChange={(event) => setKg(event.target.value.replace(',', '.'))}
          className="font-display h-full min-w-0 flex-1 bg-transparent text-center text-title text-ink outline-none placeholder:text-ink-35 tabular-nums"
        />
        <span className="text-caption font-semibold text-ink-65" aria-hidden="true">kg</span>
        <button type="button" aria-label="Up 0.1 kg" onClick={() => nudge(0.1)} className="grid size-11 shrink-0 place-items-center rounded-full bg-ink-06 text-ink active:scale-[.94]"><PlusLine className="size-5" /></button>
      </div>
      <Hint id={hintId} bad={bad || failed}>
        {failed ? "Couldn't log weight. Check your connection and try again." : bad ? 'Enter a weight between 20 and 400 kg.' : 'Weigh at the same time each day for a clean trend.'}
      </Hint>
      <SaveButton saving={saving} disabled={!valid} onClick={() => void save({ type: 'weight', payload: { weight_kg: value }, source: 'manual' }, `Weight logged, ${value.toFixed(1)} kg`)}>
        {valid ? `Save ${value.toFixed(1)} kg` : 'Save'}
      </SaveButton>
    </>
  )
}

/** Home's quick logs for the tiles (water, weight, sleep) and mood or energy. */
export function QuickLogSheet({ type, onDone, onClose, water, weight }: {
  type: QuickLogType
  onDone: () => void
  onClose: () => void
  /** Glasses logged today. */
  water: number
  weight: WeightHistory
}) {
  // Keeps the last sheet's content while it slides away; cleared at once, the sheet collapsed to its handle in one frame.
  const [shown, setShown] = useState(type)
  if (type !== null && type !== shown) setShown(type)
  return (
    <BottomSheet open={type !== null} onClose={onClose} ariaLabel={shown ? `Log ${shown}` : 'Quick log'}>
      <div className="flex flex-col gap-4 px-5 pb-5 pt-2">
        {shown === 'water' ? <WaterSheet today={water} onDone={onDone} /> : null}
        {shown === 'mood' || shown === 'energy' ? <MoodEnergySheet type={shown} onDone={onDone} /> : null}
        {shown === 'sleep' ? <SleepSheet onDone={onDone} /> : null}
        {shown === 'weight' ? <WeightSheet history={weight} onDone={onDone} /> : null}
      </div>
    </BottomSheet>
  )
}
