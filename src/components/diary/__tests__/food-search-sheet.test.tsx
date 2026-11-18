import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { logRow } from '@/test/backend-logs'

const mocks = vi.hoisted(() => ({ apiFetch: vi.fn(), success: vi.fn(), warning: vi.fn(), error: vi.fn() }))

vi.mock('sonner', () => ({ toast: { success: mocks.success, warning: mocks.warning, error: mocks.error } }))
vi.mock('@/lib/platform/app', () => ({ haptic: vi.fn() }))
vi.mock('@/lib/api/client', async (original) => ({ ...(await original<object>()), apiFetch: mocks.apiFetch }))
vi.mock('@/lib/api/foods.api', () => ({
  searchFoods: vi.fn().mockResolvedValue([]),
  updateFood: vi.fn(),
  saveFood: vi.fn(),
  getRecentFoods: vi.fn().mockResolvedValue([
    { id: 'f-salmon', name: 'Salmon nigiri', serving_size_g: 170, macros_per_serving: { calories: 280, protein: 14, carbs: 40, fat: 6 }, is_favorite: false, use_count: 2 },
    { id: 'f-rice', name: 'Rice', serving_size_g: 150, macros_per_serving: { calories: 195, protein: 4, carbs: 43, fat: 0 }, is_favorite: false, use_count: 5 },
  ]),
}))

import { FoodSearchSheet } from '../food-search-sheet'

const VEGETARIAN = { food_name: 'salmon nigiri', restriction: 'vegetarian', source: 'dietary_style' as const }

describe('FoodSearchSheet logging', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // POST /v1/logs as logs.controller.ts createLog answers it: 201 with the row, plus diet_warning for a food the profile avoids.
    mocks.apiFetch.mockImplementation(async (_path: string, { body }: { body: { payload: { food_name: string } } }) => {
      const row = logRow(`log-${body.payload.food_name}`, 'food', '2026-11-17', '2026-11-17T09:00:00.000Z', body.payload)
      return body.payload.food_name === 'Salmon nigiri' ? { ...row, diet_warning: VEGETARIAN } : row
    })
  })

  const open = () => render(<FoodSearchSheet isOpen mode="log" mealType="Snack" logDate="2026-11-17" onClose={() => {}} onFoodLogged={() => {}} />)

  it('a meal of several foods still says when one clashes with the diet', async () => {
    open()
    fireEvent.click(await screen.findByRole('button', { name: /^Salmon nigiri/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Add to meal' }))
    fireEvent.click(await screen.findByRole('button', { name: /^Rice/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Log meal (2)' }))

    await waitFor(() => expect(mocks.warning).toHaveBeenCalledWith("Logged 2 items. Salmon nigiri doesn't fit your vegetarian diet.", undefined))
    expect(mocks.success).not.toHaveBeenCalled()
  })

  it('one food logged on its own says so too', async () => {
    open()
    fireEvent.click(await screen.findByRole('button', { name: /^Salmon nigiri/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Log food' }))

    await waitFor(() => expect(mocks.warning).toHaveBeenCalledWith("Salmon nigiri logged. Salmon nigiri doesn't fit your vegetarian diet.", undefined))
  })
})
