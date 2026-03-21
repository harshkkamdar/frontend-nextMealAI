'use client'

import { useEffect, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { getLogs } from '@/lib/api/logs.api'
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

export function LogList() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<LogType | 'all'>('all')

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
      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4 scrollbar-hide">
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
              className="flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3"
            >
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
    </div>
  )
}
