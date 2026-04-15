import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the client module BEFORE importing the api file.
// The real `apiFetch` reads a zustand store for auth token and calls `fetch`,
// neither of which belong in a unit test. We assert that the wrappers call
// `apiFetch` with the exact method/path/body contract expected by the
// backend routes.
const apiFetchMock = vi.fn()
vi.mock('@/lib/api/client', () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}))

import {
  createPlan,
  updatePlan,
  deletePlan,
  isManualBuilderType,
  type CreateWorkoutPlanInput,
  type CreateMealPlanInput,
} from '@/lib/api/plans.api'

describe('plans.api — FB-08 manual create / customise wrappers', () => {
  beforeEach(() => {
    apiFetchMock.mockReset()
  })

  describe('createPlan', () => {
    it('POSTs a workout plan with generated_by forced to "manual"', async () => {
      apiFetchMock.mockResolvedValueOnce({ id: 'plan-1', type: 'workout' })
      const input: CreateWorkoutPlanInput = {
        type: 'workout',
        content: {
          days: [
            {
              date: '2026-04-20',
              name: 'Push',
              exercises: [{ name: 'Bench Press', sets: 3, reps: 8 }],
            },
          ],
        },
        start_date: '2026-04-20',
      }

      await createPlan(input)

      expect(apiFetchMock).toHaveBeenCalledTimes(1)
      expect(apiFetchMock).toHaveBeenCalledWith('/v1/plans', {
        method: 'POST',
        body: {
          type: 'workout',
          content: input.content,
          start_date: '2026-04-20',
          generated_by: 'manual',
        },
      })
    })

    it('POSTs a meal plan with generated_by forced to "manual"', async () => {
      apiFetchMock.mockResolvedValueOnce({ id: 'plan-2', type: 'meal' })
      const input: CreateMealPlanInput = {
        type: 'meal',
        content: {
          daily_targets: { calories: 2000, protein: 150, carbs: 200, fat: 60 },
          days: [
            {
              date: '2026-04-20',
              meals: [{ type: 'breakfast', name: 'Oatmeal', calories: 350 }],
            },
          ],
        },
      }

      await createPlan(input)

      expect(apiFetchMock).toHaveBeenCalledTimes(1)
      const [path, options] = apiFetchMock.mock.calls[0]
      expect(path).toBe('/v1/plans')
      expect(options.method).toBe('POST')
      expect(options.body.generated_by).toBe('manual')
      expect(options.body.content).toEqual(input.content)
    })

    it('returns the plan object from the backend', async () => {
      const serverPlan = { id: 'plan-3', type: 'workout', status: 'draft' }
      apiFetchMock.mockResolvedValueOnce(serverPlan)

      const result = await createPlan({
        type: 'workout',
        content: { days: [] },
      })

      expect(result).toEqual(serverPlan)
    })

    it('propagates apiFetch errors to the caller', async () => {
      apiFetchMock.mockRejectedValueOnce(new Error('validation failed'))

      await expect(
        createPlan({ type: 'workout', content: { days: [] } }),
      ).rejects.toThrow('validation failed')
    })
  })

  describe('updatePlan', () => {
    it('PUTs the update payload to /v1/plans/:id', async () => {
      apiFetchMock.mockResolvedValueOnce({ id: 'plan-1' })
      await updatePlan('plan-1', {
        content: { days: [{ date: '2026-04-20', name: 'Pull', exercises: [] }] },
      })

      expect(apiFetchMock).toHaveBeenCalledWith('/v1/plans/plan-1', {
        method: 'PUT',
        body: {
          content: { days: [{ date: '2026-04-20', name: 'Pull', exercises: [] }] },
        },
      })
    })

    it('supports status-only updates (e.g. mark completed)', async () => {
      apiFetchMock.mockResolvedValueOnce({ id: 'plan-1' })
      await updatePlan('plan-1', { status: 'completed' })

      expect(apiFetchMock).toHaveBeenCalledWith('/v1/plans/plan-1', {
        method: 'PUT',
        body: { status: 'completed' },
      })
    })
  })

  describe('deletePlan', () => {
    it('DELETEs /v1/plans/:id', async () => {
      apiFetchMock.mockResolvedValueOnce(undefined)
      await deletePlan('plan-1')

      expect(apiFetchMock).toHaveBeenCalledWith('/v1/plans/plan-1', {
        method: 'DELETE',
      })
    })
  })

  describe('isManualBuilderType', () => {
    it('accepts "meal" and "workout"', () => {
      expect(isManualBuilderType('meal')).toBe(true)
      expect(isManualBuilderType('workout')).toBe(true)
    })

    it('rejects any other string', () => {
      expect(isManualBuilderType('')).toBe(false)
      expect(isManualBuilderType('nutrition')).toBe(false)
      expect(isManualBuilderType('MEAL')).toBe(false)
    })
  })
})
