/**
 * FB-10 — Expandable itemised food row inside MealGroup.
 *
 * A food log that carries a non-empty `items` array should render a
 * disclosure control (aria-expanded chevron button) which, when toggled,
 * shows each child component name + per-child macros. Children have an
 * edit flow that calls updateLog with the edited items array.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { Log } from '@/types/logs.types'

vi.mock('@/lib/api/logs.api', () => ({
  deleteLog: vi.fn(),
  updateLog: vi.fn(),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { updateLog } from '@/lib/api/logs.api'
import { MealGroup } from '../meal-group'

const mockedUpdateLog = vi.mocked(updateLog)

function makeFoodLog(overrides: Partial<Log> = {}): Log {
  return {
    id: 'log-1',
    user_id: 'user-1',
    type: 'food',
    payload: {
      food_name: 'Breakfast bowl',
      est_macros: { calories: 681, protein: 35, carbs: 45, fat: 38 },
    },
    source: 'manual',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  } as Log
}

const itemisedLog: Log = makeFoodLog({
  id: 'log-iti',
  payload: {
    food_name: 'Breakfast bowl',
    est_macros: { calories: 681, protein: 35, carbs: 45, fat: 38 },
    items: [
      { name: 'Scrambled eggs', quantity_label: '3 whole eggs', est_macros: { calories: 210, protein: 18, carbs: 2, fat: 15 } },
      { name: 'Avocado', quantity_label: '1 medium', est_macros: { calories: 240, protein: 3, carbs: 12, fat: 22 } },
      { name: 'Toast', quantity_g: 60, est_macros: { calories: 231, protein: 14, carbs: 31, fat: 1 } },
    ],
  },
})

describe('FB-10: MealGroup expandable itemised rows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not render a chevron when items is undefined', () => {
    const log = makeFoodLog({ id: 'plain' })
    render(
      <MealGroup
        mealType="Breakfast"
        items={[log]}
        onAddFood={() => {}}
        onDeleteLog={() => {}}
      />
    )
    expect(screen.queryByRole('button', { name: /expand items/i })).toBeNull()
  })

  it('does not render a chevron when items is an empty array', () => {
    const log = makeFoodLog({
      id: 'empty',
      payload: {
        food_name: 'Apple',
        est_macros: { calories: 95, protein: 0, carbs: 25, fat: 0 },
        items: [],
      },
    })
    render(
      <MealGroup
        mealType="Snack"
        items={[log]}
        onAddFood={() => {}}
        onDeleteLog={() => {}}
      />
    )
    expect(screen.queryByRole('button', { name: /expand items/i })).toBeNull()
  })

  it('renders a chevron button when items has 3 entries', () => {
    render(
      <MealGroup
        mealType="Breakfast"
        items={[itemisedLog]}
        onAddFood={() => {}}
        onDeleteLog={() => {}}
      />
    )
    const btn = screen.getByRole('button', { name: /expand items/i })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
  })

  it('clicking the chevron expands and reveals all 3 child names', async () => {
    render(
      <MealGroup
        mealType="Breakfast"
        items={[itemisedLog]}
        onAddFood={() => {}}
        onDeleteLog={() => {}}
      />
    )
    const btn = screen.getByRole('button', { name: /expand items/i })
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    expect(await screen.findByText('Scrambled eggs')).toBeInTheDocument()
    expect(screen.getByText('Avocado')).toBeInTheDocument()
    expect(screen.getByText('Toast')).toBeInTheDocument()
    // Quantity labels surface too
    expect(screen.getByText(/3 whole eggs/)).toBeInTheDocument()
  })

  it('clicking the chevron twice collapses the children again', () => {
    render(
      <MealGroup
        mealType="Breakfast"
        items={[itemisedLog]}
        onAddFood={() => {}}
        onDeleteLog={() => {}}
      />
    )
    const btn = screen.getByRole('button', { name: /expand items/i })
    fireEvent.click(btn)
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Scrambled eggs')).toBeNull()
  })

  it('editing a child macro calls updateLog with the new items[] array', async () => {
    mockedUpdateLog.mockResolvedValueOnce({ ...itemisedLog })
    render(
      <MealGroup
        mealType="Breakfast"
        items={[itemisedLog]}
        onAddFood={() => {}}
        onDeleteLog={() => {}}
      />
    )
    // Expand
    fireEvent.click(screen.getByRole('button', { name: /expand items/i }))
    // Open the edit form for the first child
    const editBtn = screen.getAllByRole('button', { name: /edit item/i })[0]
    fireEvent.click(editBtn)
    // Change calories
    const input = screen.getByLabelText(/calories/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: '180' } })
    // Save
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(mockedUpdateLog).toHaveBeenCalledTimes(1)
    })
    const [id, payload] = mockedUpdateLog.mock.calls[0]
    expect(id).toBe('log-iti')
    const items = (payload as { items?: Array<{ est_macros: { calories?: number } }> }).items!
    expect(items).toHaveLength(3)
    expect(items[0].est_macros.calories).toBe(180)
    expect(items[1].est_macros.calories).toBe(240)
    expect(items[2].est_macros.calories).toBe(231)
  })
})
