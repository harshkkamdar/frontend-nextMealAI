'use client'

import { useEffect, useState } from 'react'
import {
  ClipboardList,
  Check,
  Utensils,
  Dumbbell,
  Droplet,
  Scale,
  Smile,
  Moon,
  Zap,
  History,
  Footprints,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { getLogs, bulkDeleteLogs } from '@/lib/api/logs.api'
import { EmptyState } from '@/components/shared/empty-state'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { formatMacroKcal } from '@/lib/macros'
import type { Log, LogType, FoodPayload, WorkoutPayload, SleepPayload, MoodPayload, EnergyPayload, WaterPayload, WeightPayload, StepsPayload } from '@/types/logs.types'

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

const FALLBACK_ICON = { icon: ClipboardList, label: 'Activity' } as const

const TYPE_ICONS: Record<LogType, { icon: LucideIcon; label: string }> = {
  food: { icon: Utensils, label: 'Food activity' },
  workout: { icon: Dumbbell, label: 'Workout activity' },
  water: { icon: Droplet, label: 'Water activity' },
  weight: { icon: Scale, label: 'Weight activity' },
  mood: { icon: Smile, label: 'Mood activity' },
  sleep: { icon: Moon, label: 'Sleep activity' },
  energy: { icon: Zap, label: 'Energy activity' },
  steps: { icon: Footprints, label: 'Steps activity' },
  correction: { icon: History, label: 'Correction activity' },
}

function LogTypeIcon({ type }: { type: LogType }) {
  const entry = TYPE_ICONS[type] ?? FALLBACK_ICON
  const Icon = entry.icon
  return (
    <>
      <Icon aria-hidden="true" className="size-5 shrink-0 text-ink-65" />
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
      return `Mood: ${(log.payload as MoodPayload).rating}/10`
    case 'sleep':
      return `${(log.payload as SleepPayload).hours} hours`
    case 'energy':
      return `Energy: ${(log.payload as EnergyPayload).rating}/10`
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
    case 'water': {
      const w = log.payload as WaterPayload
      return `${w.glasses ?? 0} glasses`
    }
    case 'weight':
      return `${(log.payload as WeightPayload).weight_kg} kg`
    case 'mood':
      return `${(log.payload as MoodPayload).rating}/10`
    case 'sleep':
      return `${(log.payload as SleepPayload).hours}h`
    case 'energy':
      return `${(log.payload as EnergyPayload).rating}/10`
    case 'steps':
      return `${(log.payload as StepsPayload).steps} steps`
    default:
      return ''
  }
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD}d ago`
  return new Date(dateStr).toLocaleDateString()
}

interface LogListProps {
  filterType?: LogType | 'all'
}

export function LogList({ filterType }: LogListProps = {}) {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
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
      } catch {
        setLogs([])
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [filter])

  return (
    <div>
      {/* Header row: filter chips + Select/Cancel button */}
      <div className="mb-4 flex items-center justify-between">
        <div className="scrollbar-hide -mx-4 flex flex-1 gap-2 overflow-x-auto px-4 pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`h-9 whitespace-nowrap rounded-full px-3 text-[13.5px] font-semibold ${
                filter === f.value ? 'bg-ink text-cream' : 'bg-ink-08 text-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {logs.length > 0 && !loading && (
          <button
            onClick={selectMode ? exitSelectMode : () => setSelectMode(true)}
            className="ml-2 h-9 shrink-0 whitespace-nowrap rounded-full bg-ink-08 px-3 text-[13.5px] font-semibold text-ink"
          >
            {selectMode ? 'Cancel' : 'Select'}
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No logs yet"
          description="Start tracking your food, workouts, and more to see them here."
        />
      ) : (
        <div className="overflow-hidden rounded-[16px] border border-ink-12 bg-card divide-y divide-ink-09">
          {logs.map((log) => (
            <div
              key={log.id}
              onClick={selectMode ? () => toggleSelect(log.id) : undefined}
              className={`flex min-h-14 items-center gap-3 px-[14px] py-2.5 ${
                selectMode && selectedIds.has(log.id) ? 'bg-ink-08' : ''
              } ${selectMode ? 'cursor-pointer' : ''}`}
            >
              {/* Checkbox in select mode */}
              {selectMode && (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSelect(log.id) }}
                  className={`flex size-5 shrink-0 items-center justify-center rounded border ${
                    selectedIds.has(log.id) ? 'border-ink bg-ink' : 'border-ink-16'
                  }`}
                >
                  {selectedIds.has(log.id) && <Check className="size-3 text-cream" />}
                </button>
              )}

              {/* Typed icon — doubles as the legend (FB-09) */}
              <LogTypeIcon type={log.type} />

              {/* Description */}
              <div className="flex-1 min-w-0">
                <p className="truncate text-[15.5px] font-semibold text-ink">
                  {getLogDescription(log)}
                </p>
                <p className="mt-0.5 text-[13px] text-ink-65">
                  {relativeTime(log.created_at)}
                </p>
              </div>

              {/* Metric */}
              {getLogMetric(log) && (
                <span className="whitespace-nowrap text-[13.5px] font-medium text-ink-65">
                  {getLogMetric(log)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Floating action bar for bulk delete */}
      {selectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-24 left-0 right-0 z-40 flex justify-center">
          <div className="flex items-center gap-3 rounded-full bg-ink px-4 py-2 text-cream">
            <span className="text-[13.5px] font-semibold">{selectedIds.size} selected</span>
            <button
              onClick={() => setShowBulkDeleteConfirm(true)}
              disabled={bulkDeleting}
              className="rounded-full bg-cream-22 px-3 py-1.5 text-[13px] font-semibold text-cream disabled:opacity-50"
            >
              {bulkDeleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      )}

      {/* Bulk delete confirmation dialog */}
      <ConfirmDialog
        open={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title={`Delete ${selectedIds.size} log${selectedIds.size !== 1 ? 's' : ''}?`}
        description="This action cannot be undone. The selected logs will be permanently removed."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
