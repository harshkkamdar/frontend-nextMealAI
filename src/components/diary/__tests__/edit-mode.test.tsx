import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FoodSearchSheet } from '../food-search-sheet'
import type { Log, FoodPayload } from '@/types/logs.types'
import { updateLog } from '@/lib/api/logs.api'
import { backendUpdateLog, logRow } from '@/test/backend-logs'
import { quantityLabel } from '../diary-logic'

vi.mock('@/lib/api/foods.api', () => ({
  searchFoods: vi.fn().mockResolvedValue([]),
  getRecentFoods: vi.fn().mockResolvedValue([]),
  updateFood: vi.fn(),
  saveFood: vi.fn(),
}))
vi.mock('@/lib/api/logs.api', () => ({
  createLog: vi.fn(),
  updateLog: vi.fn(),
  deleteLog: vi.fn(),
}))

describe('FoodSearchSheet edit mode (FB-R5-03)', () => {
  // The backend's rows: a test files the log it edits with stored(), and updateLog merges into it as PATCH does.
  let rows: Log[] = []
  const stored = (log: Log) => { const row = structuredClone(log); rows.push(row); return row }
  beforeEach(() => {
    rows = []
    vi.mocked(updateLog).mockReset().mockImplementation(backendUpdateLog(rows))
  })

  const baseLog: Log = logRow('log-1', 'food', '2026-10-26', '2026-10-26T08:00:00.000Z', {
    food_name: 'Yopro vanilla yogurt',
    quantity_g: 350,
    servings: 1,
    est_macros: { calories: 200, protein: 33.3, carbs: 13.3, fat: 1.8 },
    meal_type: 'breakfast',
    user_food_id: 'food-1',
  })

  it('opens in servings mode when log was logged as a serving', () => {
    render(
      <FoodSearchSheet isOpen mode="edit" existingLog={baseLog}
        mealType="Breakfast" onClose={() => {}} onFoodLogged={() => {}} />
    )
    expect(screen.getByDisplayValue('1')).toBeInTheDocument()
    // The label "Servings" or its toggle should be active/visible
    expect(screen.getByText(/servings/i)).toBeInTheDocument()
  })

  it('uses the saved serving size and count when both are present', () => {
    const twoServings: Log = {
      ...baseLog,
      payload: { ...baseLog.payload, quantity_g: 100, servings: 2, serving_size_g: 50 } as FoodPayload,
    }
    render(
      <FoodSearchSheet isOpen mode="edit" existingLog={twoServings}
        mealType="Breakfast" onClose={() => {}} onFoodLogged={() => {}} />
    )
    expect(screen.getByLabelText('Servings')).toHaveValue(2)
    fireEvent.click(screen.getByRole('button', { name: 'Grams' }))
    expect(screen.getByLabelText('Grams')).toHaveValue(100)
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

  it('offers the existing copy flow under Save', () => {
    const onRequestCopy = vi.fn()
    render(
      <FoodSearchSheet isOpen mode="edit" existingLog={baseLog}
        mealType="Breakfast" onClose={() => {}} onFoodLogged={() => {}} onRequestCopy={onRequestCopy} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Copy to another day' }))
    expect(onRequestCopy).toHaveBeenCalledWith(baseLog)
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
    stored(twoServingLog)
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
    stored(baseLog)
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
    stored(baseLog)
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

  it('switching "2 eggs" to grams stores grams only: the serving count and its label are cleared', async () => {
    const eggs = logRow('log-2', 'food', '2026-10-26', '2026-10-26T08:00:00.000Z', {
      food_name: 'Eggs', quantity_g: 100, servings: 2, serving_label: 'egg', serving_size_g: 50,
      est_macros: { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 }, meal_type: 'breakfast',
    })
    const row = stored(eggs)
    render(
      <FoodSearchSheet isOpen mode="edit" existingLog={eggs}
        mealType="Breakfast" onClose={() => {}} onFoodLogged={() => {}} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Grams' }))
    fireEvent.change(screen.getByLabelText('Grams'), { target: { value: '150' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(updateLog).toHaveBeenCalled())
    expect(row.payload).not.toHaveProperty('servings')
    expect(quantityLabel(row.payload as FoodPayload)).toBe('150g') // was still "2 eggs"
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
    stored(itemised)
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

  it('opens legacy photo estimate items when payload.items is empty', () => {
    const photoLog: Log = {
      ...baseLog,
      payload: {
        food_name: 'Photo meal',
        meal_type: 'lunch',
        est_macros: { calories: 300 },
        estimate: { items: [{ name: 'Chicken', estimated_portion_g: 150, estimated_macros: { calories: 250, protein: 30, carbs: 0, fat: 8 }, confidence: 0.8 }] },
      } as never,
    }
    render(
      <FoodSearchSheet isOpen mode="edit" existingLog={photoLog}
        mealType="Lunch" onClose={() => {}} onFoodLogged={() => {}} />
    )
    expect(screen.getByText('1 item from your photo')).toBeInTheDocument()
    expect(screen.getByText('Chicken')).toBeInTheDocument()
  })
})
