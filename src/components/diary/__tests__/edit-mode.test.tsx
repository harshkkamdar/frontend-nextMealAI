import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FoodSearchSheet } from '../food-search-sheet'
import type { Log, FoodPayload } from '@/types/logs.types'
import { updateLog } from '@/lib/api/logs.api'

vi.mock('@/lib/api/foods.api', () => ({
  searchFoods: vi.fn().mockResolvedValue([]),
  getRecentFoods: vi.fn().mockResolvedValue([]),
  updateFood: vi.fn(),
  saveFood: vi.fn(),
}))
vi.mock('@/lib/api/logs.api', () => ({
  createLog: vi.fn(),
  updateLog: vi.fn().mockResolvedValue({} as any),
  deleteLog: vi.fn(),
}))

describe('FoodSearchSheet edit mode (FB-R5-03)', () => {
  // Each test reads updateLog.mock.calls[0]; clear call history so one test's
  // call doesn't shift another's index.
  beforeEach(() => {
    vi.mocked(updateLog).mockClear()
  })

  const baseLog: Log = {
    id: 'log-1',
    user_id: 'u',
    type: 'food',
    payload: {
      food_name: 'Yopro vanilla yogurt',
      quantity_g: 350,
      servings: 1,
      est_macros: { calories: 200, protein: 33.3, carbs: 13.3, fat: 1.8 },
      meal_type: 'breakfast',
      user_food_id: 'food-1',
    },
    source: 'manual',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  it('opens in servings mode when log was logged as a serving', () => {
    render(
      <FoodSearchSheet isOpen mode="edit" existingLog={baseLog}
        mealType="Breakfast" onClose={() => {}} onFoodLogged={() => {}} />
    )
    expect(screen.getByDisplayValue('1')).toBeInTheDocument()
    // The label "Servings" or its toggle should be active/visible
    expect(screen.getByText(/servings/i)).toBeInTheDocument()
  })

  it('opens in grams mode when log has no `servings` field', () => {
    const gramLog: Log = { ...baseLog, payload: { ...baseLog.payload, servings: undefined, quantity_g: 31 } as any }
    render(
      <FoodSearchSheet isOpen mode="edit" existingLog={gramLog}
        mealType="Breakfast" onClose={() => {}} onFoodLogged={() => {}} />
    )
    expect(screen.getByDisplayValue('31')).toBeInTheDocument()
    expect(screen.getByText(/grams/i)).toBeInTheDocument()
  })

  it('shows Save and Delete buttons in edit mode (no Log button)', () => {
    render(
      <FoodSearchSheet isOpen mode="edit" existingLog={baseLog}
        mealType="Breakfast" onClose={() => {}} onFoodLogged={() => {}} />
    )
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^log$/i })).not.toBeInTheDocument()
  })

  it('re-saving a MULTI-serving entry unchanged does NOT double its macros', async () => {
    // Regression: est_macros is the TOTAL (472 for 2 servings). The editor must
    // treat it as per-serving=236 so 236×2 re-saves 472, not 944.
    const twoServingLog: Log = {
      ...baseLog,
      payload: {
        ...baseLog.payload,
        servings: 2,
        quantity_g: 200,
        est_macros: { calories: 472, protein: 20, carbs: 60, fat: 12 },
      } as FoodPayload,
    }
    const updateLogMock = vi.mocked(updateLog)
    updateLogMock.mockResolvedValue({} as any)
    render(
      <FoodSearchSheet isOpen mode="edit" existingLog={twoServingLog}
        mealType="Breakfast" onClose={() => {}} onFoodLogged={() => {}} />
    )
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(updateLogMock).toHaveBeenCalled())
    const arg = updateLogMock.mock.calls[0][1] as Partial<FoodPayload>
    expect(arg.servings).toBe(2)
    expect(arg.est_macros?.calories).toBe(472) // not 944
    expect(arg.quantity_g).toBe(200)
  })

  it('save flow updates the log with recomputed quantity_g when servings change', async () => {
    const updateLogMock = vi.mocked(updateLog)
    updateLogMock.mockResolvedValue({} as any)
    const onLogUpdated = vi.fn()
    render(
      <FoodSearchSheet isOpen mode="edit" existingLog={baseLog}
        mealType="Breakfast" onClose={() => {}} onFoodLogged={() => {}}
        onLogUpdated={onLogUpdated} />
    )
    // change servings from 1 to 2 — find the input and simulate change
    const servingsInput = screen.getByDisplayValue('1') as HTMLInputElement
    fireEvent.change(servingsInput, { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(updateLogMock).toHaveBeenCalled())
    const callArg = updateLogMock.mock.calls[0][1] as Partial<FoodPayload>
    expect(callArg.servings).toBe(2)
    expect(callArg.quantity_g).toBe(700)  // 350g/serving * 2 = 700
  })

  it('changing the meal saves meal_type with the amount', async () => {
    const updateLogMock = vi.mocked(updateLog)
    render(
      <FoodSearchSheet isOpen mode="edit" existingLog={baseLog} editSubtitle="Breakfast, Mon 26 Oct"
        mealType="Breakfast" onClose={() => {}} onFoodLogged={() => {}} />
    )
    expect(screen.getByText('Breakfast, Mon 26 Oct')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Lunch' }))
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(updateLogMock).toHaveBeenCalled())
    expect((updateLogMock.mock.calls[0][1] as Partial<FoodPayload>).meal_type).toBe('lunch')
  })

  it('an itemised log edits one component and saves the items with summed totals', async () => {
    const updateLogMock = vi.mocked(updateLog)
    const itemised: Log = {
      ...baseLog,
      payload: {
        food_name: 'Burrito bowl', meal_type: 'lunch',
        est_macros: { calories: 300, protein: 20, carbs: 30, fat: 10 },
        items: [
          { name: 'Rice', est_macros: { calories: 200, protein: 4, carbs: 30, fat: 1 } },
          { name: 'Chicken', est_macros: { calories: 100, protein: 16, carbs: 0, fat: 9 } },
        ],
      } as FoodPayload,
    }
    render(
      <FoodSearchSheet isOpen mode="edit" existingLog={itemised}
        mealType="Lunch" onClose={() => {}} onFoodLogged={() => {}} />
    )
    expect(screen.getByText('2 items from your photo')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Edit Rice' }))
    fireEvent.change(screen.getByLabelText('Calories'), { target: { value: '150' } })
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(updateLogMock).toHaveBeenCalled())
    const arg = updateLogMock.mock.calls[0][1] as Partial<FoodPayload>
    expect(arg.items?.[0].est_macros.calories).toBe(150)
    expect(arg.est_macros?.calories).toBe(250)
    expect(arg.meal_type).toBe('lunch')
  })
})
