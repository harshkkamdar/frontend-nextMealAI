/** "Log again" (Home and the + sheet): POST /v1/logs through the real API module, apiFetch answering as logs.controller.ts does. */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { logRow } from '@/test/backend-logs'

const mocks = vi.hoisted(() => ({ apiFetch: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn() }))
vi.mock('@/lib/api/client', async (original) => ({ ...(await original<object>()), apiFetch: mocks.apiFetch }))
vi.mock('@/lib/platform/network', () => ({ isOnline: () => Promise.resolve(true) }))
vi.mock('@/lib/platform/app', () => ({ haptic: vi.fn() }))
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: mocks.error, warning: mocks.warning } }))

import { logWithUndo } from '../log-with-undo'
import { dietWarningText } from '@/components/logs/diet-warning'

const SALMON = { food_name: 'Salmon nigiri', quantity_g: 170, est_macros: { calories: 280, protein: 14, carbs: 38, fat: 7 }, meal_type: 'snack' }

describe('logWithUndo', () => {
  beforeEach(() => vi.clearAllMocks())

  it('a food that clashes with the diet still logs; the same toast warns and keeps Undo', async () => {
    // 201 { ...newLog, diet_warning } for a manual log of a food the profile avoids.
    mocks.apiFetch.mockResolvedValueOnce({ ...logRow('log-7', 'food', '2026-11-17', '2026-11-17T09:00:00.000Z', SALMON), diet_warning: { food_name: 'salmon nigiri', restriction: 'vegetarian', source: 'dietary_style' } })
    expect(await logWithUndo({ type: 'food', source: 'manual', payload: SALMON }, 'Salmon nigiri logged to Snack', () => {}, () => {})).toBe(true)
    expect(mocks.success).not.toHaveBeenCalled()
    const [text, options] = mocks.warning.mock.calls[0]
    expect(text).toBe("Salmon nigiri logged to Snack. Salmon nigiri doesn't fit your vegetarian diet.")
    expect(options.action.label).toBe('Undo')
    mocks.apiFetch.mockResolvedValueOnce(undefined)
    options.action.onClick()
    expect(mocks.apiFetch).toHaveBeenLastCalledWith('/v1/logs/log-7', { method: 'DELETE' })
  })

  it('names each kind of clash', () => {
    expect(dietWarningText({ food_name: 'peanut butter', restriction: 'peanuts', source: 'allergy' })).toBe('Peanut butter is on your allergy list.')
    expect(dietWarningText({ food_name: 'Beer', restriction: 'alcohol', source: 'dietary_restriction' })).toBe('Beer has alcohol, which you avoid.')
  })
})
