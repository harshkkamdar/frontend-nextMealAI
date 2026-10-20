import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  native: false,
  currentPlatform: 'web' as 'ios' | 'android' | 'web',
  connected: false,
  queryAggregated: vi.fn(),
  queryWorkouts: vi.fn(),
  saveWorkout: vi.fn(),
  apiFetch: vi.fn(),
  kvSet: vi.fn(),
  emit: vi.fn(),
}))

vi.mock('@/lib/platform', () => ({
  isNative: () => mocks.native,
  platform: () => mocks.currentPlatform,
}))

vi.mock('@/lib/platform/storage', () => ({
  kvGet: vi.fn(async (key: string) => key === 'fiqr:health-connected' && mocks.connected ? '1' : null),
  kvSet: mocks.kvSet,
  kvRemove: vi.fn(),
}))

vi.mock('@flomentumsolutions/capacitor-health-extended', () => ({
  Health: {
    queryAggregated: mocks.queryAggregated,
    queryWorkouts: mocks.queryWorkouts,
    saveWorkout: mocks.saveWorkout,
  },
}))

vi.mock('@/lib/api/client', () => ({ apiFetch: mocks.apiFetch }))
vi.mock('@/lib/sync/sync-bus', () => ({ syncBus: { emit: mocks.emit } }))

import { healthLabel, syncHealth, writeWorkoutToHealth } from '@/lib/platform/health'

describe('health platform adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.native = false
    mocks.currentPlatform = 'web'
    mocks.connected = false
  })

  it('returns no health data or label on the web', async () => {
    await expect(syncHealth()).resolves.toBe(0)
    expect(healthLabel()).toBeNull()
  })

  it('merges daily metrics and skips workouts written by FIQR', async () => {
    mocks.native = true
    mocks.currentPlatform = 'ios'
    mocks.connected = true
    mocks.queryAggregated.mockImplementation(async ({ dataType }: { dataType: string }) => ({
      aggregatedData: [{
        startDate: '2026-10-20T08:00:00.000Z',
        endDate: '2026-10-20T09:00:00.000Z',
        value: {
          steps: 1234.4,
          'active-calories': 456.7,
          weight: 72.34,
          sleep: 450,
        }[dataType],
        unit: dataType === 'sleep' ? 'min' : undefined,
      }],
    }))
    mocks.queryWorkouts.mockResolvedValue({
      workouts: [
        {
          id: 'own-workout',
          startDate: '2026-10-20T08:00:00.000Z',
          endDate: '2026-10-20T09:00:00.000Z',
          workoutType: 'strength-training',
          sourceName: 'FIQR',
          sourceBundleId: 'app.fiqr.mobile',
          duration: 3600,
          calories: 200,
        },
        {
          id: 'external-workout',
          startDate: '2026-10-20T10:00:00.000Z',
          endDate: '2026-10-20T10:30:00.000Z',
          workoutType: 'running',
          sourceName: 'Watch',
          sourceBundleId: 'com.example.watch',
          duration: 1800,
          calories: 120.4,
        },
      ],
    })
    mocks.apiFetch.mockResolvedValue({ upserted: 2 })

    await expect(syncHealth()).resolves.toBe(2)
    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/health/sync', {
      method: 'POST',
      body: {
        days: [{
          local_date: '2026-10-20',
          steps: 1234,
          active_kcal: 457,
          weight_kg: 72.3,
          sleep_hours: 7.5,
        }],
        workouts: [{
          external_id: 'external-workout',
          local_date: '2026-10-20',
          started_at: '2026-10-20T10:00:00.000Z',
          ended_at: '2026-10-20T10:30:00.000Z',
          duration_min: 30,
          activity: 'running',
          calories: 120,
          source: 'Watch',
        }],
      },
    })
    expect(mocks.emit).toHaveBeenCalledWith('logs:updated')
  })

  it('does not write an unfinished workout', async () => {
    mocks.native = true
    mocks.currentPlatform = 'ios'
    mocks.connected = true

    await writeWorkoutToHealth({
      started_at: '2026-10-20T08:00:00.000Z',
      completed_at: null,
      duration_minutes: null,
      day_name: 'Upper body',
    })

    expect(mocks.saveWorkout).not.toHaveBeenCalled()
  })
})
