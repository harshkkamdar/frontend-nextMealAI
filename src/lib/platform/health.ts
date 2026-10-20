import { postHealthSync, type HealthDay, type HealthWorkout } from '@/lib/api/health.api'
import { syncBus } from '@/lib/sync/sync-bus'
import { detectIanaTimezone, todayLocalISO } from '@/lib/timezone'
import { isNative, platform } from './index'
import { kvGet, kvRemove, kvSet } from './storage'

const CONNECTED_KEY = 'fiqr:health-connected'
const LAST_SYNC_KEY = 'fiqr:health-last-sync'

export function healthLabel(): 'Apple Health' | 'Health Connect' | null {
  const current = platform()
  if (current === 'ios') return 'Apple Health'
  if (current === 'android') return 'Health Connect'
  return null
}

export async function isHealthAvailable(): Promise<boolean> {
  if (!isNative()) return false
  try {
    const { Health } = await import('@flomentumsolutions/capacitor-health-extended')
    return (await Health.isHealthAvailable()).available
  } catch {
    return false
  }
}

export async function isHealthConnected(): Promise<boolean> {
  return (await kvGet(CONNECTED_KEY)) === '1'
}

export async function connectHealth(): Promise<boolean> {
  if (!isNative()) return false
  try {
    const { Health } = await import('@flomentumsolutions/capacitor-health-extended')
    const result = await Health.requestHealthPermissions({
      permissions: [
        'READ_STEPS',
        'READ_ACTIVE_CALORIES',
        'READ_WEIGHT',
        'READ_SLEEP',
        'READ_WORKOUTS',
        'WRITE_WORKOUTS',
        'WRITE_ACTIVE_CALORIES',
      ],
    })
    const connected = platform() === 'ios' || (platform() === 'android' && result.permissions.READ_STEPS === true)
    if (!connected) return false
    await kvSet(CONNECTED_KEY, '1')
    await syncHealth(30)
    return true
  } catch {
    return false
  }
}

export async function disconnectHealth(): Promise<void> {
  await Promise.all([kvRemove(CONNECTED_KEY), kvRemove(LAST_SYNC_KEY)])
  if (!isNative() || platform() !== 'android') return
  try {
    const { Health } = await import('@flomentumsolutions/capacitor-health-extended')
    await Health.openHealthConnectSettings()
  } catch {
    // The local disconnect still succeeds when native settings cannot open.
  }
}

export async function lastHealthSync(): Promise<string | null> {
  return kvGet(LAST_SYNC_KEY)
}

export async function syncHealth(days = 7): Promise<number> {
  if (!isNative()) return 0
  try {
    if (!(await isHealthConnected())) return 0
    const { Health } = await import('@flomentumsolutions/capacitor-health-extended')
    const end = new Date()
    const start = new Date(end)
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - (days - 1))
    const request = { startDate: start.toISOString(), endDate: end.toISOString(), bucket: 'day' }
    const [steps, calories, weight, sleep, workoutResult] = await Promise.all([
      Health.queryAggregated({ ...request, dataType: 'steps' }),
      Health.queryAggregated({ ...request, dataType: 'active-calories' }),
      Health.queryAggregated({ ...request, dataType: 'weight' }),
      Health.queryAggregated({ ...request, dataType: 'sleep' }),
      Health.queryWorkouts({
        startDate: request.startDate,
        endDate: request.endDate,
        includeHeartRate: false,
        includeRoute: false,
        includeSteps: false,
      }),
    ])

    const timezone = detectIanaTimezone()
    const daysByDate = new Map<string, HealthDay>()
    const dayFor = (startDate: string) => {
      const localDate = todayLocalISO(timezone, new Date(startDate))
      const day = daysByDate.get(localDate) ?? { local_date: localDate }
      daysByDate.set(localDate, day)
      return day
    }

    for (const sample of steps.aggregatedData) dayFor(sample.startDate).steps = Math.round(sample.value)
    for (const sample of calories.aggregatedData) dayFor(sample.startDate).active_kcal = Math.round(sample.value)
    for (const sample of weight.aggregatedData) {
      if (sample.value) dayFor(sample.startDate).weight_kg = Math.round(sample.value * 10) / 10
    }
    for (const sample of sleep.aggregatedData) {
      const hours = sample.unit === 'h' || sample.unit === 'hour' ? sample.value : sample.value / 60
      if (hours) dayFor(sample.startDate).sleep_hours = hours
    }

    const workouts: HealthWorkout[] = workoutResult.workouts
      .filter((workout) => workout.sourceBundleId !== 'app.fiqr.mobile' && workout.sourceName !== 'FIQR')
      .map((workout) => ({
        external_id: workout.id ?? `${workout.startDate}|${workout.workoutType}`,
        local_date: todayLocalISO(timezone, new Date(workout.startDate)),
        started_at: workout.startDate,
        ended_at: workout.endDate,
        duration_min: Math.round(workout.duration / 60),
        activity: workout.workoutType,
        calories: Math.round(workout.calories) || undefined,
        source: workout.sourceName,
      }))
    const healthDays = [...daysByDate.values()]
    if (healthDays.length === 0 && workouts.length === 0) return 0

    const { upserted } = await postHealthSync({ days: healthDays, workouts })
    await kvSet(LAST_SYNC_KEY, new Date().toISOString())
    syncBus.emit('logs:updated')
    return upserted
  } catch {
    return 0
  }
}

export async function writeWorkoutToHealth(session: {
  started_at: string
  completed_at: string | null
  duration_minutes: number | null
  day_name: string
}): Promise<void> {
  if (!isNative() || !session.completed_at) return
  try {
    if (!(await isHealthConnected())) return
    const { Health } = await import('@flomentumsolutions/capacitor-health-extended')
    await Health.saveWorkout({
      activityType: 'strength-training',
      startDate: session.started_at,
      endDate: session.completed_at,
      metadata: { title: session.day_name },
    })
  } catch {
    // Health write-back must never block completing a FIQR workout.
  }
}
