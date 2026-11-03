'use client'

import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

import { HueDot, INK_BUTTON, MACRO_HUE, SOFT_BUTTON } from '@/components/plans/spatial-parts'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { ChevronRightIcon } from '@/components/ui/fiqr/icons'
import type { CheckInDay, CheckInStatus } from '@/lib/api/check-in.api'
import { cn } from '@/lib/utils'

/** What the Check-in screen drills into: one day of the week, or one measure across it. */
export type WeekDetail = { kind: 'day'; date: string } | { kind: 'calories' | 'protein' | 'sessions' | 'sleep' | 'weight' } | null

const at = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}
/** "Mon 2 Nov", "M" and so on, read in UTC so a YYYY-MM-DD never shifts a day. */
export const dateLabel = (iso: string, options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  at(iso).toLocaleDateString('en-AU', { ...options, timeZone: 'UTC' }).replace(',', '')
const fmt = (n: number) => Math.round(n).toLocaleString('en-AU')
/** An empty value, quieter than a real one. */
const none = (text: string) => <span className="font-normal text-ink-62">{text}</span>
const hours = (h: number) => `${Math.floor(h)}h ${String(Math.round((h % 1) * 60)).padStart(2, '0')}m`

/** The week as seven tappable days: ink when food was logged, a ring on today, later days quiet and inert. */
export function DayStrip({ days, today, onDay }: { days: CheckInDay[]; today: string; onDay: (date: string) => void }) {
  return (
    <ol className="grid grid-cols-7 gap-1" aria-label="Days this week">
      {days.map((day) => {
        const future = day.date > today
        const logged = day.calories !== null
        const state = future ? 'still to come' : logged ? `${fmt(day.calories!)} kcal logged` : 'nothing logged'
        return (
          <li key={day.date}>
            <button
              type="button"
              disabled={future}
              aria-label={`${dateLabel(day.date, { weekday: 'long', day: 'numeric', month: 'short' })}, ${state}${day.date === today ? ', today' : ''}`}
              onClick={() => onDay(day.date)}
              className="flex min-h-11 w-full flex-col items-center gap-1.5 py-1 transition-transform enabled:active:scale-[.94] disabled:cursor-default"
            >
              <span aria-hidden="true" className="text-[11px] font-semibold text-ink-62">{dateLabel(day.date, { weekday: 'narrow' })}</span>
              <span
                aria-hidden="true"
                className={cn(
                  'grid size-9 place-items-center rounded-full text-[14px] font-semibold tabular-nums',
                  logged ? 'bg-ink text-cream' : future ? 'text-ink-35' : 'bg-ink-06 text-ink-62',
                  day.date === today && 'outline outline-[1.5px] outline-offset-2 outline-ink',
                )}
              >
                {at(day.date).getUTCDate()}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

/** A tappable row: label left, value right, a chevron when it goes somewhere. */
function Row({ label, value, onClick }: { label: ReactNode; value: ReactNode; onClick?: () => void }) {
  const body = (
    <>
      <span className="flex-1 text-body text-ink">{label}</span>
      <span className="text-right text-body font-semibold text-ink tabular-nums">{value}</span>
      {onClick ? <ChevronRightIcon aria-hidden="true" className="size-4 shrink-0 text-ink-35" /> : null}
    </>
  )
  const row = 'flex min-h-[52px] w-full items-center gap-3 border-b border-ink-06 last:border-b-0'
  return onClick
    ? <li><button type="button" onClick={onClick} className={cn(row, 'text-left active:opacity-60')}>{body}</button></li>
    : <li className={row}>{body}</li>
}

/** Seven bars against a dashed target line; days with nothing logged stay empty. */
function WeekBars({ days, value, target, hue, today, unit }: { days: CheckInDay[]; value: (day: CheckInDay) => number | null; target: number | null; hue: string; today: string; unit: string }) {
  const values = days.map(value)
  const top = Math.max(...values.map((v) => v ?? 0), (target ?? 0) * 1.2, 1)
  return (
    <div className="relative mt-4" role="img" aria-label={days.map((day, i) => `${dateLabel(day.date, { weekday: 'short' })} ${values[i] === null ? 'nothing' : `${fmt(values[i]!)} ${unit}`}`).join(', ')}>
      <ol aria-hidden="true" className="flex h-[132px] items-end gap-2">
        {days.map((day, i) => (
          <li key={day.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <span className="flex w-full flex-1 items-end">
              <span
                className="block w-full rounded-[7px]"
                style={{ height: values[i] === null ? 3 : `${Math.max(4, (values[i]! / top) * 100)}%`, background: values[i] === null ? 'var(--color-ink-06)' : hue, opacity: day.date > today ? 0.3 : 1 }}
              />
            </span>
            <span className={cn('text-label font-medium', day.date === today ? 'text-ink' : 'text-ink-65')}>{dateLabel(day.date, { weekday: 'narrow' })}</span>
          </li>
        ))}
      </ol>
      {/* The bars stand on the 22 px weekday row, in the 110 px above it. */}
      {target ? <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 border-t-[1.5px] border-dashed border-ink-35" style={{ bottom: 22 + (target / top) * 110 }} /> : null}
    </div>
  )
}

function Summary({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-caption text-ink-65 tabular-nums">{children}</p>
}

interface WeekDetailSheetProps {
  detail: WeekDetail
  status: CheckInStatus
  today: string
  onClose: () => void
  onDetail: (detail: WeekDetail) => void
  onLog: (type: 'weight' | 'sleep') => void
}

/** The drill-down behind every number on the Check-in screen, as one sheet. */
export function WeekDetailSheet({ detail, status, today, onClose, onDetail, onLog }: WeekDetailSheetProps) {
  const router = useRouter()
  // Keeps the last content while the sheet slides away.
  const [shown, setShown] = useState(detail)
  if (detail !== null && detail !== shown) setShown(detail)
  const { days, targets, week_so_far: week, weight } = status
  const past = days.filter((day) => day.date <= today)
  const diary = (date: string) => { onClose(); router.push(`/food?date=${date}`) }
  const log = (type: 'weight' | 'sleep') => { onClose(); onLog(type) }

  let title = ''
  let body: ReactNode = null
  if (shown?.kind === 'day') {
    const day = days.find((d) => d.date === shown.date)
    title = dateLabel(shown.date, { weekday: 'long', day: 'numeric', month: 'long' })
    if (day) {
      body = (
        <>
          <ul className="mt-2">
            <Row label={<span className="flex items-center gap-2"><HueDot macro="calories" />Calories</span>} value={day.calories === null ? none('Nothing logged') : `${fmt(day.calories)}${targets.calories ? ` of ${fmt(targets.calories)}` : ''} kcal`} />
            <Row label={<span className="flex items-center gap-2"><HueDot macro="protein" />Protein</span>} value={day.protein_g === null ? none('—') : `${fmt(day.protein_g)}${targets.protein_g ? ` of ${fmt(targets.protein_g)}` : ''} g`} />
            <Row label={<span className="flex items-center gap-2"><HueDot macro="carbs" />Carbs</span>} value={day.carbs_g === null ? none('—') : `${fmt(day.carbs_g)} g`} />
            <Row label={<span className="flex items-center gap-2"><HueDot macro="fat" />Fat</span>} value={day.fat_g === null ? none('—') : `${fmt(day.fat_g)} g`} />
            <Row label="Training" value={day.sessions.length ? day.sessions.join(', ') : none('No session')} onClick={() => { onClose(); router.push('/train') }} />
            <Row label="Sleep" value={day.sleep_h === null ? none('Not logged') : hours(day.sleep_h)} />
            <Row label="Weight" value={day.weight_kg === null ? none('No weigh-in') : `${day.weight_kg.toFixed(1)} kg`} />
          </ul>
          <button type="button" className={cn(INK_BUTTON, 'mt-4')} onClick={() => diary(day.date)}>{day.calories === null ? 'Log food for this day' : 'Open food diary'}</button>
        </>
      )
    }
  } else if (shown?.kind === 'calories' || shown?.kind === 'protein') {
    const calories = shown.kind === 'calories'
    const unit = calories ? 'kcal' : 'g'
    const target = calories ? targets.calories : targets.protein_g
    const avg = calories ? week.avg_calories : week.avg_protein_g
    const value = (day: CheckInDay) => (calories ? day.calories : day.protein_g)
    title = calories ? 'Calories this week' : 'Protein this week'
    body = (
      <>
        <Summary>
          {avg === null ? 'Nothing logged yet this week' : `Average ${fmt(avg)} ${unit} over ${status.days_logged} logged ${status.days_logged === 1 ? 'day' : 'days'}`}
          {target ? `, target ${fmt(target)} ${unit}` : ''}
        </Summary>
        <WeekBars days={days} value={value} target={target} hue={MACRO_HUE[shown.kind]} today={today} unit={unit} />
        <ul className="mt-3">
          {past.map((day) => (
            <Row key={day.date} label={dateLabel(day.date)} value={value(day) === null ? none('Not logged') : `${fmt(value(day)!)} ${unit}`} onClick={() => diary(day.date)} />
          ))}
        </ul>
      </>
    )
  } else if (shown?.kind === 'sessions') {
    title = 'Training this week'
    body = (
      <>
        <Summary>{week.sessions_done} of {week.sessions_planned} planned {week.sessions_planned === 1 ? 'session' : 'sessions'} done</Summary>
        <ul className="mt-2">
          {past.map((day) => (
            <Row key={day.date} label={dateLabel(day.date)} value={day.sessions.length ? day.sessions.join(', ') : none('No session')} onClick={() => onDetail({ kind: 'day', date: day.date })} />
          ))}
        </ul>
        <button type="button" className={cn(SOFT_BUTTON, 'mt-4')} onClick={() => { onClose(); router.push('/train') }}>Go to Train</button>
      </>
    )
  } else if (shown?.kind === 'sleep') {
    title = 'Sleep this week'
    body = (
      <>
        <Summary>{week.sleep_avg_h === null ? 'No nights logged yet this week' : `Average ${hours(week.sleep_avg_h)} over ${week.sleep_nights} ${week.sleep_nights === 1 ? 'night' : 'nights'}`}</Summary>
        <WeekBars days={days} value={(day) => day.sleep_h} target={8} hue="var(--color-ink)" today={today} unit="hours" />
        <ul className="mt-3">
          {past.map((day) => <Row key={day.date} label={dateLabel(day.date)} value={day.sleep_h === null ? none('Not logged') : hours(day.sleep_h)} onClick={() => onDetail({ kind: 'day', date: day.date })} />)}
        </ul>
        <button type="button" className={cn(INK_BUTTON, 'mt-4')} onClick={() => log('sleep')}>Log last night</button>
      </>
    )
  } else if (shown?.kind === 'weight') {
    const weighIns = past.filter((day) => day.weight_kg !== null)
    title = 'Weight'
    body = (
      <>
        <Summary>{weight.current_kg === null ? 'No weigh-ins yet' : `Latest ${weight.current_kg.toFixed(1)} kg`}</Summary>
        <h3 className="mt-4 text-[11.5px] font-semibold uppercase tracking-[1.8px] text-ink-62">This week</h3>
        <ul>
          {weighIns.length
            ? weighIns.map((day) => <Row key={day.date} label={dateLabel(day.date)} value={`${day.weight_kg!.toFixed(1)} kg`} onClick={() => onDetail({ kind: 'day', date: day.date })} />)
            : <li className="py-3 text-body text-ink-65">No weigh-ins this week</li>}
        </ul>
        {weight.points.length ? (
          <>
            <h3 className="mt-4 text-[11.5px] font-semibold uppercase tracking-[1.8px] text-ink-62">Weekly average</h3>
            <ul>
              {[...weight.points].reverse().map((point) => <Row key={point.week_end} label={`Week to ${dateLabel(point.week_end, { day: 'numeric', month: 'short' })}`} value={`${point.kg.toFixed(1)} kg`} />)}
            </ul>
          </>
        ) : null}
        <button type="button" className={cn(INK_BUTTON, 'mt-4')} onClick={() => log('weight')}>Log weight</button>
      </>
    )
  }

  return (
    <BottomSheet open={detail !== null} onClose={onClose} ariaLabel={title || 'Week detail'}>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-[calc(20px+var(--safe-bottom))] pt-2">
        <h2 className="text-[22px] font-bold leading-tight tracking-[-0.4px] text-ink">{title}</h2>
        {body}
      </div>
    </BottomSheet>
  )
}
