'use client'

import { useEffect, useState } from 'react'
import { ClipboardList, Check } from 'lucide-react'
import { toast } from 'sonner'
import { getLogs, bulkDeleteLogs } from '@/lib/api/logs.api'
import { EmptyState } from '@/components/shared/empty-state'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import type { Log, LogType, FoodPayload, WorkoutPayload, SleepPayload, MoodPayload, EnergyPayload, WaterPayload, WeightPayload } from '@/types/logs.types'

const FILTERS: { label: string; value: LogType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Food', value: 'food' },
  { label: 'Workout', value: 'workout' },
  { label: 'Water', value: 'water' },
  { label: 'Weight', value: 'weight' },
  { label: 'Mood', value: 'mood' },
  { label: 'Sleep', value: 'sleep' },
  { label: 'Energy', value: 'energy' },
]

const TYPE_COLORS: Record<LogType, string> = {
  food: 'bg-accent',
  workout: 'bg-[#34C759]',
  water: 'bg-[#3B82F6]',
  weight: 'bg-[#A855F7]',
  mood: 'bg-[#FF9F0A]',
  sleep: 'bg-[#6366F1]',
  energy: 'bg-accent',
  correction: 'bg-text-tertiary',
}

function getLogDescription(log: Log): string {
  switch (log.type) {
    case 'food':
      return (log.payload as FoodPayload).food_name
    case 'workout':
      return (log.payload as WorkoutPayload).exercise
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
    default:
      return log.type
  }
}

function getLogMetric(log: Log): string {
  switch (log.type) {
    case 'food': {
      const f = log.payload as FoodPayload
      return f.est_macros?.calories ? `${f.est_macros.calories} kcal` : ''
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide flex-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                filter === f.value
                  ? 'bg-accent border border-accent text-white'
                  : 'bg-surface border border-border text-text-primary hover:bg-surface-hover'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {logs.length > 0 && !loading && (
          <button
            onClick={selectMode ? exitSelectMode : () => setSelectMode(true)}
            className="ml-2 px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors bg-surface border border-border text-text-primary hover:bg-surface-hover shrink-0"
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
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              onClick={selectMode ? () => toggleSelect(log.id) : undefined}
              className={`flex items-center gap-3 bg-surface border rounded-xl px-4 py-3 ${
                selectMode && selectedIds.has(log.id)
                  ? 'border-accent'
                  : 'border-border'
              } ${selectMode ? 'cursor-pointer' : ''}`}
            >
              {/* Checkbox in select mode */}
              {selectMode && (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSelect(log.id) }}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    selectedIds.has(log.id) ? 'bg-accent border-accent' : 'border-border'
                  }`}
                >
                  {selectedIds.has(log.id) && <Check className="w-3 h-3 text-white" />}
                </button>
              )}

              {/* Color dot */}
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${TYPE_COLORS[log.type] ?? 'bg-text-tertiary'}`}
              />

              {/* Description */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {getLogDescription(log)}
                </p>
                <p className="text-xs text-text-tertiary mt-0.5">
                  {relativeTime(log.created_at)}
                </p>
              </div>

              {/* Metric */}
              {getLogMetric(log) && (
                <span className="text-sm font-medium text-text-secondary whitespace-nowrap">
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
          <div className="bg-surface border border-border rounded-full px-4 py-2 shadow-lg flex items-center gap-3">
            <span className="text-sm text-text-primary font-medium">{selectedIds.size} selected</span>
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="px-3 py-1.5 text-xs font-medium rounded-full bg-destructive text-white disabled:opacity-50"
            >
              {bulkDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
