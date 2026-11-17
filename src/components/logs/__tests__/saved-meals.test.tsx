/**
 * Saved meals on Log food ("It's under Meals when you add food"): one tap logs a favourite through the real API
 * module, with apiFetch answering as foods.controller.ts and favourites.controller.ts do.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { ApiException } from '@/types/api.types'

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(), online: true, success: vi.fn(), error: vi.fn(), warning: vi.fn(), back: vi.fn(),
  params: new URLSearchParams('meal=dinner&date=2026-11-16'),
}))

vi.mock('next/navigation', () => ({ useRouter: () => ({ back: mocks.back, push: vi.fn() }), useSearchParams: () => mocks.params }))
vi.mock('@/lib/api/client', async (original) => ({ ...(await original<object>()), apiFetch: mocks.apiFetch }))
vi.mock('@/lib/platform/network', () => ({ isOnline: () => Promise.resolve(mocks.online), useOnline: () => true }))
vi.mock('@/lib/platform/app', () => ({ haptic: vi.fn() }))
vi.mock('@/components/shared/offline-band', () => ({ OfflineBand: () => null }))
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: mocks.error, warning: mocks.warning } }))

import { FoodLogForm } from '../food-log-form'
import { useOfflineQueue } from '@/lib/offline/queue.store'

// favourites.service.ts select: id, user_id, name, items, default_meal_type, created_at.
const FAVOURITE = {
  id: 'fav-1', user_id: 'u', name: 'Weekday breakfast', default_meal_type: 'breakfast', created_at: '2026-11-10T08:00:00.000Z',
  items: [{ food_name: 'eggs', quantity_g: 100, est_macros: { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 } }, { food_name: 'toast', quantity_g: 60, est_macros: { calories: 160, protein: 5, carbs: 30, fat: 2 } }],
}
// A user_foods row (GET /v1/foods).
const YOGHURT = { id: 'f1', user_id: 'u', name: 'Greek yoghurt', brand: null, serving_size_g: 170, macros_per_serving: { calories: 100, protein: 17, carbs: 6, fat: 0.7 }, source: 'manual', usda_fdc_id: null, is_favorite: true, use_count: 3, last_used_at: '2026-11-15T08:00:00.000Z', created_at: '2026-10-01T00:00:00.000Z' }

function backend(log: () => Promise<unknown>) {
  mocks.apiFetch.mockImplementation((path: string) => {
    if (path === '/v1/foods') return Promise.resolve({ foods: [YOGHURT] })
    if (path === '/v1/favourites') return Promise.resolve({ favourites: [FAVOURITE] })
    if (path === '/v1/favourites/fav-1/log') return log()
    return Promise.reject(new Error(`unexpected ${path}`))
  })
}

const meals = async () => within(await screen.findByRole('region', { name: 'Meals' }))

describe('Log food: saved meals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.online = true
    useOfflineQueue.setState({ items: [] })
  })

  it('one tap logs the whole meal onto the day and meal Log food is set to, then goes back', async () => {
    backend(() => Promise.resolve({ success: true, favourite: 'Weekday breakfast', logged: 2, total: 2, target_date: '2026-11-16', items: [] }))
    render(<FoodLogForm />)
    fireEvent.click((await meals()).getByRole('button', { name: 'Log Weekday breakfast' }))
    await waitFor(() => expect(mocks.success).toHaveBeenCalledWith('Logged Weekday breakfast, 2 items', undefined))
    expect(mocks.apiFetch).toHaveBeenCalledWith('/v1/favourites/fav-1/log', expect.objectContaining({ method: 'POST', body: { target_date: '2026-11-16', target_meal_type: 'dinner' } }))
    expect(mocks.back).toHaveBeenCalled()
  })

  it('a plate still being built stays on screen', async () => {
    backend(() => Promise.resolve({ success: true, favourite: 'Weekday breakfast', logged: 2, total: 2, target_date: '2026-11-16', items: [] }))
    render(<FoodLogForm />)
    fireEvent.click(await screen.findByRole('button', { name: 'Add Greek yoghurt to your plate' }))
    fireEvent.click((await meals()).getByRole('button', { name: 'Log Weekday breakfast' }))
    await waitFor(() => expect(mocks.success).toHaveBeenCalled())
    expect(mocks.back).not.toHaveBeenCalled()
  })

  it('logging nothing shows the backend reason', async () => {
    // client.ts turns 400 { error: true, code: 'NOTHING_LOGGED', message } into this.
    backend(() => Promise.reject(new ApiException(400, 'Bad Request', 'NOTHING_LOGGED', 'None of the foods in "Weekday breakfast" could be logged.')))
    render(<FoodLogForm />)
    fireEvent.click((await meals()).getByRole('button', { name: 'Log Weekday breakfast' }))
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('None of the foods in "Weekday breakfast" could be logged.'))
    expect(mocks.success).not.toHaveBeenCalled()
    expect(mocks.back).not.toHaveBeenCalled()
  })

  it('gone offline after the screen loaded, the meal queues and says so', async () => {
    backend(() => Promise.reject(new Error('not sent offline')))
    render(<FoodLogForm />)
    const list = await meals()
    mocks.online = false
    fireEvent.click(list.getByRole('button', { name: 'Log Weekday breakfast' }))
    await waitFor(() => expect(mocks.success).toHaveBeenCalledWith("Logged Weekday breakfast. Saved on your phone, syncs when you're back online"))
    expect(useOfflineQueue.getState().items[0]).toMatchObject({ kind: 'favourite_log', path: '/v1/favourites/fav-1/log', body: { target_date: '2026-11-16', target_meal_type: 'dinner' } })
  })

  it('a diet clash rides on the logged toast', async () => {
    backend(() => Promise.resolve({ success: true, favourite: 'Weekday breakfast', logged: 2, total: 2, target_date: '2026-11-16', items: [], diet_warning: { food_name: 'eggs', restriction: 'eggs', source: 'allergy' } }))
    render(<FoodLogForm />)
    fireEvent.click((await meals()).getByRole('button', { name: 'Log Weekday breakfast' }))
    await waitFor(() => expect(mocks.warning).toHaveBeenCalledWith('Logged Weekday breakfast, 2 items. Eggs is on your allergy list.', undefined))
    expect(mocks.success).not.toHaveBeenCalled()
  })
})
