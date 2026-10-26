/**
 * MealGroup rows: photo-led media, a tap opens the row's actions, itemised logs read as their item count (their
 * components are edited in the edit sheet now), long meals fold.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { Log } from '@/types/logs.types'

vi.mock('@/lib/api/logs.api', () => ({
  deleteLog: vi.fn(),
  updateLog: vi.fn(),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { MealGroup } from '../meal-group'

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

describe('MealGroup photo-led rows (journey-food C3, D1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('tapping a row opens its actions with that log', () => {
    const log = makeFoodLog({ id: 'plain' })
    const onOpenLog = vi.fn()
    render(<MealGroup mealType="Breakfast" items={[log]} onAddFood={() => {}} onOpenLog={onOpenLog} />)

    fireEvent.click(screen.getByRole('button', { name: /^breakfast bowl, 1 serving, 681 kcal$/i }))

    expect(onOpenLog).toHaveBeenCalledWith(log)
  })

  it('an itemised (photo) log reads as its item count, with no expand control', () => {
    render(<MealGroup mealType="Breakfast" items={[itemisedLog]} onAddFood={() => {}} />)
    expect(screen.getByText(/3 items, from your photo/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /expand items/i })).toBeNull()
  })

  it('a row without a photo shows a glyph, and an https photo_url shows the photo', () => {
    const { container, rerender } = render(<MealGroup mealType="Lunch" items={[makeFoodLog()]} onAddFood={() => {}} />)
    expect(container.querySelector('img')).toBeNull()
    const withPhoto = makeFoodLog({ payload: { food_name: 'Bowl', est_macros: { calories: 10 }, photo_url: 'https://cdn.example.com/p.jpg' } as never })
    rerender(<MealGroup mealType="Lunch" items={[withPhoto]} onAddFood={() => {}} />)
    expect(container.querySelector('img')?.getAttribute('src')).toBe('https://cdn.example.com/p.jpg')
  })

  it('a meal with more than 7 rows shows 6 and a Show more row', () => {
    const many = Array.from({ length: 9 }, (_, i) => makeFoodLog({ id: `m${i}`, payload: { food_name: `Food ${i}`, est_macros: { calories: 10 } } }))
    render(<MealGroup mealType="Snack" items={many} onAddFood={() => {}} />)
    expect(screen.queryByText('Food 6')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Show 3 more' }))
    expect(screen.getByText('Food 8')).toBeInTheDocument()
  })

  it('the empty meal row calls onAddFood', () => {
    const onAddFood = vi.fn()
    render(<MealGroup mealType="Lunch" items={[]} onAddFood={onAddFood} />)

    fireEvent.click(screen.getByRole('button', { name: /add lunch/i }))

    expect(onAddFood).toHaveBeenCalledOnce()
  })

  it('hides Copy to today from the meal actions sheet when viewing today', () => {
    render(
      <MealGroup
        mealType="Breakfast"
        items={[makeFoodLog()]}
        onAddFood={() => {}}
        isToday
        onCopyToToday={() => {}}
        onSaveFavourite={() => {}}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /breakfast actions/i }))

    expect(screen.queryByRole('button', { name: /copy to today/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save as meal/i })).toBeInTheDocument()
  })
})

// George, 2026-07-10: countable single-serve foods must read as natural
// servings ("3 eggs", "2 slices"), not grams or a bare "1 serving".
describe('serving_label quantity rendering', () => {
  beforeEach(() => vi.clearAllMocks())

  function renderWith(payload: Record<string, unknown>) {
    render(
      <MealGroup mealType="Breakfast" items={[makeFoodLog({ payload: payload as never })]} onAddFood={() => {}} />,
    )
  }

  it('renders "3 eggs" when serving_label + servings are present', () => {
    renderWith({
      food_name: 'Egg, whole',
      servings: 3, serving_label: 'egg', serving_size_g: 50, quantity_g: 150,
      est_macros: { calories: 216, protein: 19, carbs: 1, fat: 15 },
    })
    expect(screen.getByText(/3 eggs/i)).toBeInTheDocument()
    expect(screen.queryByText(/150g/)).not.toBeInTheDocument()
  })

  it('pluralizes correctly: "1 egg" (singular) and "4 slices"', () => {
    render(
      <MealGroup
        mealType="Lunch"
        items={[
          makeFoodLog({ id: 'a', payload: { food_name: 'Egg', servings: 1, serving_label: 'egg', quantity_g: 50, est_macros: { calories: 72 } } as never }),
          makeFoodLog({ id: 'b', payload: { food_name: 'Cheese', servings: 4, serving_label: 'slice', quantity_g: 84, est_macros: { calories: 184 } } as never }),
        ]}
        onAddFood={() => {}}
      />,
    )
    expect(screen.getByText(/1 egg\b/i)).toBeInTheDocument()
    expect(screen.getByText(/4 slices/i)).toBeInTheDocument()
  })

  it('falls back to grams for a bulk food with no serving_label', () => {
    renderWith({ food_name: 'Rice', quantity_g: 180, est_macros: { calories: 234 } })
    expect(screen.getByText(/180g/)).toBeInTheDocument()
  })

  it('still shows "N servings" when servings present but no serving_label', () => {
    renderWith({ food_name: 'Protein shake', servings: 2, quantity_g: 500, est_macros: { calories: 300 } })
    expect(screen.getByText(/2 servings/i)).toBeInTheDocument()
  })
})
