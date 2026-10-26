'use client'

import type { ComponentType, SVGProps } from 'react'
import { useEffect, useState } from 'react'
import { Check, History } from 'lucide-react'
import { toast } from 'sonner'
import { getLogs, bulkDeleteLogs } from '@/lib/api/logs.api'
import { PushedHeader } from '@/components/layout/screen-header'
import { OfflineBand } from '@/components/shared/offline-band'
import { formatMacroKcal } from '@/lib/macros'
import type { Log, LogType, FoodPayload, WorkoutPayload, SleepPayload, MoodPayload, EnergyPayload, WaterPayload, WeightPayload, StepsPayload } from '@/types/logs.types'
import { EnergyFill, FoodFill, MoodFill, SleepFill, StepsFill, TrainFill, WaterFill, WeightFill } from '@/components/ui/fiqr/icons'
import { haptic } from '@/lib/platform/app'
import { cn } from '@/lib/utils'
import { CARD, Chips, LIST, RowsSkeleton } from './log-ui'
import { clockTime, groupLogsByDay } from './log-math'

const FILTERS: { label: string; value: LogType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Food', value: 'food' },
  { label: 'Workout', value: 'workout' },
  { label: 'Water', value: 'water' },
  { label: 'Weight', value: 'weight' },
  { label: 'Mood', value: 'mood' },
  { label: 'Sleep', value: 'sleep' },
  { label: 'Energy', value: 'energy' },
  { label: 'Steps', value: 'steps' },
]

type Icon = ComponentType<SVGProps<SVGSVGElement>>

const FALLBACK_ICON = { icon: History as Icon, label: 'Activity' }

const TYPE_ICONS: Record<LogType, { icon: Icon; label: string }> = {
  food: { icon: FoodFill, label: 'Food activity' },
  workout: { icon: TrainFill, label: 'Workout activity' },
  water: { icon: WaterFill, label: 'Water activity' },
  weight: { icon: WeightFill, label: 'Weight activity' },
  mood: { icon: MoodFill, label: 'Mood activity' },
  sleep: { icon: SleepFill, label: 'Sleep activity' },
  energy: { icon: EnergyFill, label: 'Energy activity' },
  steps: { icon: StepsFill, label: 'Steps activity' },
  correction: { icon: History, label: 'Correction activity' },
}

function LogTypeIcon({ type }: { type: LogType }) {
  const entry = TYPE_ICONS[type] ?? FALLBACK_ICON
  const Icon = entry.icon
  return (
    <>
      <Icon aria-hidden="true" className="size-5 shrink-0 text-ink-80" />
      <span className="sr-only">{entry.label}</span>
    </>
  )
}

function getLogDescription(log: Log): string {
  switch (log.type) {
    case 'food':
      return (log.payload as FoodPayload).food_name
    case 'workout': {
      // Workout logs come from two sources:
      //   (a) manual form entry — payload has `exercise`
      //   (b) session completion (POST /v1/workout-sessions/:id/complete) —
      //       payload has `day_name` + `session_id`, no `exercise`
      // Fall back through the chain so no row ever renders a blank title. See FB-09.
      const w = log.payload as WorkoutPayload
      if (w.exercise) return w.exercise
      if (w.day_name) return `${w.day_name} completed`
      return 'Workout completed'
    }
    case 'water': {
      const w = log.payload as WaterPayload
      return `${w.glasses ?? 0} glasses`
    }
    case 'weight':
      return `${(log.payload as WeightPayload).weight_kg} kg`
    case 'mood':
      return `Mood ${(log.payload as MoodPayload).rating} of 10`
    case 'sleep':
      return `${(log.payload as SleepPayload).hours} hours asleep`
    case 'energy':
      return `Energy ${(log.payload as EnergyPayload).rating} of 10`
    case 'steps':
      return `${Number((log.payload as StepsPayload).steps ?? 0).toLocaleString('en-AU')} steps`
    default:
      return log.type
  }
}

function getLogMetric(log: Log): string {
  switch (log.type) {
    case 'food': {
      const f = log.payload as FoodPayload
      return f.est_macros?.calories != null ? `${formatMacroKcal(f.est_macros.calories)} kcal` : ''
    }
    case 'workout': {
      const w = log.payload as WorkoutPayload
      return w.duration_min ? `${w.duration_min} min` : ''
    }
    // The title already carries the number for every other type; repeating it on the right was noise.
    default:
      return ''
  }
}

interface LogListProps {
  filterType?: LogType | 'all'
  /** On /logs: renders the pushed header with Select in it. */
  onBack?: () => void
}

/** Holds a delete back this long so Undo can cancel it before anything reaches the server. */
const UNDO_MS = 4000

/** Recent logs (journey-log L): filter chips, day groups, Select to delete several with Undo. */
export function LogList({ filterType, onBack }: LogListProps = {}) {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [reload, setReload] = useState(0)
  const [filter, setFilter] = useState<LogType | 'all'>('all')
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (filterType !== undefined) setFilter(filterType)
  }, [filterType])

  const toggleSelect = (id: string) => {
    void haptic('selection')
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const exitSelectMode = () => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  // Rows leave at once; the server delete waits out the Undo window, and a failed delete brings them back.
  const handleBulkDelete = () => {
    const ids = [...selectedIds]
    if (ids.length === 0) return
    const show = (on: boolean) => setHidden((prev) => { const next = new Set(prev); ids.forEach((id) => (on ? next.delete(id) : next.add(id))); return next })
    show(false)
    exitSelectMode()
    void haptic('success')
    let undone = false
    const timer = setTimeout(() => {
      if (undone) return
      bulkDeleteLogs(ids).then(
        () => setLogs((prev) => prev.filter((l) => !ids.includes(l.id))),
        () => { show(true); toast.error("Couldn't delete those logs. Try again.") },
      )
    }, UNDO_MS)
    toast.success(`${ids.length} log${ids.length === 1 ? '' : 's'} deleted`, {
      duration: UNDO_MS,
      action: { label: 'Undo', onClick: () => { undone = true; clearTimeout(timer); show(true) } },
    })
  }

  useEffect(() => {
    let alive = true
    const params: { limit: number; type?: string } = { limit: 50 }
    if (filter !== 'all') params.type = filter
    getLogs(params).then(
      (data) => { if (!alive) return; setLogs(data); setLoadFailed(false) },
      () => { if (!alive) return; setLogs([]); setLoadFailed(true) },
    ).finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [filter, reload])

  const visible = logs.filter((log) => !hidden.has(log.id))
  const groups = groupLogsByDay(visible)

  return (
    <div>
      {onBack ? (
        <PushedHeader
          title="Log"
          onBack={onBack}
          actions={visible.length > 0 && !loading ? (
            <button type="button" onClick={selectMode ? exitSelectMode : () => setSelectMode(true)} className="glass h-11 shrink-0 rounded-full px-4 text-body-sm font-semibold text-ink transition-transform active:scale-[.96]">
              {selectMode ? 'Done' : 'Select'}
            </button>
          ) : undefined}
        />
      ) : null}
      {onBack ? <div className="-mx-4 [&:not(:empty)]:mb-2"><OfflineBand /></div> : null}
      <Chips
        className="scrollbar-hide -mx-4 mb-3 overflow-x-auto px-4 py-1"
        label="Filter by type"
        options={FILTERS}
        value={filter}
        onChange={(value) => { if (value && value !== filter) { setLoading(true); setFilter(value) } }}
      />

      {loading ? (
        <div className="mt-2">
          <p className="mb-2 px-1 text-label text-ink-65">Today</p>
          <RowsSkeleton rows={5} label="Loading your logs" />
        </div>
      ) : loadFailed ? (
        <div role="alert" className={`${CARD} p-4`}>
          <p className="text-body-sm text-ink">I couldn&apos;t load your logs.</p>
          <button type="button" onClick={() => { setLoading(true); setReload((n) => n + 1) }} className="-ml-1 mt-1 min-h-11 px-1 text-body-sm font-semibold text-ink underline decoration-ink-35 underline-offset-4">Try again</button>
        </div>
      ) : visible.length === 0 ? (
        <div className={`${CARD} p-4`}>
          <p className="text-headline text-ink">{filter === 'all' ? 'Nothing logged yet' : 'Nothing of this kind yet'}</p>
          <p className="mt-1 text-caption leading-[1.4] text-ink-65">Tap + to log your first meal. Everything you log lands here, newest first.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.label} aria-label={group.label}>
              <h2 className="mb-2 px-1 text-label text-ink-65">{group.label}</h2>
              <ul className={LIST}>
                {group.logs.map((log) => {
                  const selected = selectedIds.has(log.id)
                  const metric = getLogMetric(log)
                  const body = (
                    <>
                      {selectMode ? (
                        <span aria-hidden="true" className={cn('grid size-6 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors', selected ? 'border-ink bg-ink text-cream' : 'border-ink-35')}>
                          {selected ? <Check className="size-3.5" strokeWidth={3} /> : null}
                        </span>
                      ) : null}
                      <LogTypeIcon type={log.type} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body-sm font-semibold text-ink">{getLogDescription(log)}</span>
                        <span className="block text-caption text-ink-65 tabular-nums">{clockTime(log.created_at)}</span>
                      </span>
                      {metric ? <span className="shrink-0 whitespace-nowrap text-body-sm font-bold text-ink tabular-nums">{metric}</span> : null}
                    </>
                  )
                  const row = 'flex min-h-row w-full items-center gap-3 px-4 py-2 text-left'
                  return (
                    <li key={log.id} className="border-b border-ink-06 last:border-b-0">
                      {selectMode ? (
                        <button type="button" role="checkbox" aria-checked={selected} onClick={() => toggleSelect(log.id)} className={`${row} transition-colors ${selected ? 'bg-ink-04' : 'active:bg-ink-04'}`}>
                          {body}
                        </button>
                      ) : (
                        <div className={row}>{body}</div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* Floating capsule for the delete, above the tab bar. */}
      {selectMode && selectedIds.size > 0 ? (
        <div className="fixed inset-x-0 z-40 flex justify-center px-4" style={{ bottom: 'calc(96px + var(--safe-bottom))' }}>
          <div className="glass flex items-center gap-3 rounded-full py-1.5 pl-5 pr-1.5">
            <span className="text-body-sm font-semibold text-ink tabular-nums">{selectedIds.size} selected</span>
            <button type="button" onClick={handleBulkDelete} className="h-11 rounded-full bg-ink px-5 text-body-sm font-semibold text-cream transition-transform active:scale-[.96]">
              Delete
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
