/**
 * Saved meals in the food sheet: one tap logs a favourite (POST /v1/favourites/:id/log) through the real API module,
 * with apiFetch answering as favourites.controller.ts does.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ApiException } from '@/types/api.types'

const mocks = vi.hoisted(() => ({ apiFetch: vi.fn(), online: true, success: vi.fn(), error: vi.fn(), warning: vi.fn() }))

vi.mock('@/lib/api/client', async (original) => ({ ...(await original<object>()), apiFetch: mocks.apiFetch }))
vi.mock('@/lib/platform/network', () => ({ isOnline: () => Promise.resolve(mocks.online), useOnline: () => mocks.online }))
vi.mock('@/lib/platform/app', () => ({ haptic: vi.fn() }))
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: mocks.error, warning: mocks.warning } }))
vi.mock('@/lib/api/foods.api', () => ({ searchFoods: vi.fn(), getRecentFoods: () => Promise.resolve([]), updateFood: vi.fn(), saveFood: vi.fn() }))

import { FoodSearchSheet } from '../food-search-sheet'
import { useOfflineQueue } from '@/lib/offline/queue.store'

// favourites.service.ts select: id, user_id, name, items, default_meal_type, created_at.
const FAVOURITE = {
  id: 'fav-1', user_id: 'u', name: 'Weekday breakfast', default_meal_type: 'breakfast', created_at: '2026-11-10T08:00:00.000Z',
  items: [{ food_name: 'eggs', quantity_g: 100, est_macros: { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 } }, { food_name: 'toast', quantity_g: 60, est_macros: { calories: 160, protein: 5, carbs: 30, fat: 2 } }],
}

function backend(log: () => Promise<unknown>) {
  mocks.apiFetch.mockImplementation((path: string) => {
    if (path === '/v1/favourites') return Promise.resolve({ favourites: [FAVOURITE] })
    if (path === '/v1/favourites/fav-1/log') return log()
    return Promise.reject(new Error(`unexpected ${path}`))
  })
}

async function logSavedMeal() {
  const onFoodLogged = vi.fn()
  render(<FoodSearchSheet isOpen mealType="Breakfast" logDate="2026-11-17" onClose={() => {}} onFoodLogged={onFoodLogged} />)
  fireEvent.click(await screen.findByRole('button', { name: /Saved meals · 1/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Log Weekday breakfast' }))
  return onFoodLogged
}

describe('FoodSearchSheet saved meals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.online = true
    useOfflineQueue.setState({ items: [] })
  })

  it('logging nothing shows the backend reason, not "Logged …, 0 items"', async () => {
    // client.ts turns 400 { error: true, code: 'NOTHING_LOGGED', message } into this.
    backend(() => Promise.reject(new ApiException(400, 'Bad Request', 'NOTHING_LOGGED', 'None of the foods in "Weekday breakfast" could be logged.')))
    const onFoodLogged = await logSavedMeal()
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('None of the foods in "Weekday breakfast" could be logged.'))
    expect(mocks.success).not.toHaveBeenCalled()
    expect(onFoodLogged).not.toHaveBeenCalled()
  })

  it('offline, it says the meal waits on the phone, not "0 items"', async () => {
    mocks.online = false
    backend(() => Promise.reject(new Error('not sent offline')))
    await logSavedMeal()
    await waitFor(() => expect(mocks.success).toHaveBeenCalledWith("Logged Weekday breakfast. Saved on your phone, syncs when you're back online"))
    expect(useOfflineQueue.getState().items[0]).toMatchObject({ kind: 'favourite_log', path: '/v1/favourites/fav-1/log' })
  })

  it('a diet clash rides on the logged toast', async () => {
    backend(() => Promise.resolve({ success: true, favourite: 'Weekday breakfast', logged: 2, total: 2, target_date: '2026-11-17', items: [], diet_warning: { food_name: 'eggs', restriction: 'eggs', source: 'allergy' } }))
    await logSavedMeal()
    await waitFor(() => expect(mocks.warning).toHaveBeenCalledWith('Logged Weekday breakfast, 2 items. Eggs is on your allergy list.', undefined))
    expect(mocks.success).not.toHaveBeenCalled()
  })
})
