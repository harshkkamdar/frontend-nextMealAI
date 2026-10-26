'use client'

import type { ComponentType, SVGProps } from 'react'
import { useEffect, useState } from 'react'
import { Check, History } from 'lucide-react'
import { toast } from 'sonner'
import { getLogs, bulkDeleteLogs } from '@/lib/api/logs.api'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { formatMacroKcal } from '@/lib/macros'
import type { Log, LogType, FoodPayload, WorkoutPayload, SleepPayload, MoodPayload, EnergyPayload, WaterPayload, WeightPayload, StepsPayload } from '@/types/logs.types'
import { ErrorState } from '@/components/ui/fiqr/error-state'
import { EnergyFill, FoodFill, MoodFill, SleepFill, StepsFill, TrainFill, WaterFill, WeightFill } from '@/components/ui/fiqr/icons'
import { haptic } from '@/lib/platform/app'
import { cn } from '@/lib/utils'
import { Chips, EmptySlot, LIST, ROW, RiseList, RowsSkeleton } from './log-ui'

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
      <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-ink-06 text-ink"><Icon className="size-5" /></span>
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
      return `${(log.payload as StepsPayload).steps} steps`
    default:
      return log.type
  }
}

function getLogMetric(log: Log): string {
  switch (log.type) {
    case 'food': {
      const f = log.payload as FoodPayload
      return f.est_macros?.calories ? `${formatMacroKcal(f.est_macros.calories)} kcal` : ''
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

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD}d ago`
  return new Date(dateStr).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
}

interface LogListProps {
  filterType?: LogType | 'all'
}

export function LogList({ filterType }: LogListProps = {}) {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [reload, setReload] = useState(0)
  const [filter, setFilter] = useState<LogType | 'all'>('all')
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)

  // Sync external filterType prop when it changes
  useEffect(() => {
    if (filterType !== undefined) {
      setFilter(filterType)
    }
  }, [filterType])

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    setBulkDeleting(true)
    try {
      await bulkDeleteLogs(Array.from(selectedIds))
      setLogs(prev => prev.filter(l => !selectedIds.has(l.id)))
      toast.success(`${selectedIds.size} logs deleted`)
      setSelectedIds(new Set())
      setSelectMode(false)
    } catch {
      toast.error('Failed to delete logs')
    } finally {
      setBulkDeleting(false)
      setShowBulkDeleteConfirm(false)
    }
  }

  const exitSelectMode = () => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      try {
        const params: { limit: number; type?: string } = { limit: 50 }
        if (filter !== 'all') params.type = filter
        const data = await getLogs(params)
        setLogs(data)
        setLoadFailed(false)
      } catch {
        setLogs([])
        setLoadFailed(true)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [filter, reload])

  const toggleWithHaptic = (id: string) => { void haptic('selection'); toggleSelect(id) }

  return (
    <div>
      <div className="mb-3 flex items-end justify-between px-1">
        <h2 className="text-[13px] font-semibold text-ink-65">Recent</h2>
        {logs.length > 0 && !loading ? (
          <button
            type="button"
            onClick={selectMode ? exitSelectMode : () => setSelectMode(true)}
            className="-mb-3 -mr-3 h-11 shrink-0 rounded-full px-3 text-[15px] font-semibold text-ink"
          >
            {selectMode ? 'Done' : 'Select'}
          </button>
        ) : null}
      </div>
      <Chips
        className="scrollbar-hide -mx-4 mb-4 overflow-x-auto px-4 py-1"
        label="Filter by type"
        options={FILTERS}
        value={filter}
        onChange={(value) => { if (value) setFilter(value) }}
      />

      {loading ? (
        <RowsSkeleton label="Loading your logs" />
      ) : loadFailed ? (
        <ErrorState onRetry={() => setReload((n) => n + 1)}>I couldn&apos;t load your recent logs. Check your connection and try again.</ErrorState>
      ) : logs.length === 0 ? (
        <EmptySlot>{filter === 'all' ? 'Nothing logged yet. Tap + to log your first meal.' : 'Nothing of this kind yet.'}</EmptySlot>
      ) : (
        <RiseList className={LIST}>
          {logs.map((log) => {
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
                  <span className="block truncate text-[15.5px] font-semibold text-ink">{getLogDescription(log)}</span>
                  <span className="mt-0.5 block text-[13px] text-ink-65">{relativeTime(log.created_at)}</span>
                </span>
                {metric ? <span className="whitespace-nowrap text-[15px] font-semibold text-ink tabular-nums">{metric}</span> : null}
              </>
            )
            return selectMode ? (
              <button key={log.id} type="button" role="checkbox" aria-checked={selected} onClick={() => toggleWithHaptic(log.id)} className={cn(ROW, selected && 'bg-ink-04')}>
                {body}
              </button>
            ) : (
              <div key={log.id} className={ROW}>{body}</div>
            )
          })}
        </RiseList>
      )}

      {/* Floating glass bar for bulk delete, above the tab bar. */}
      {selectMode && selectedIds.size > 0 && (
        <div className="fixed inset-x-0 z-40 flex justify-center px-4" style={{ bottom: 'calc(96px + var(--safe-bottom))' }}>
          <div className="glass flex items-center gap-3 rounded-full py-1.5 pl-5 pr-1.5">
            <span className="text-[15px] font-semibold text-ink tabular-nums">{selectedIds.size} selected</span>
            <button
              type="button"
              onClick={() => setShowBulkDeleteConfirm(true)}
              disabled={bulkDeleting}
              className="h-11 rounded-full bg-ink px-5 text-[15px] font-semibold text-cream transition-transform active:scale-[.96] disabled:opacity-50"
            >
              {bulkDeleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title={`Delete ${selectedIds.size} log${selectedIds.size !== 1 ? 's' : ''}?`}
        description="They'll be gone for good, and your totals will update."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
