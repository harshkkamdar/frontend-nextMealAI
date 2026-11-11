import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { Log } from '@/types/logs.types'
import { CopyMealDialog } from '../copy-meal-dialog'

const food = (id: string, name: string): Log => ({
  id, user_id: 'u1', type: 'food', source: 'manual', created_at: '2026-11-07T04:36:25Z', updated_at: '2026-11-07T04:36:25Z',
  payload: { food_name: name, meal_type: 'dinner', est_macros: { calories: 100, protein: 10, carbs: 5, fat: 4 } },
} as Log)

describe('CopyMealDialog', () => {
  it('copies only the ticked foods to the day and meal picked, a week ahead included', () => {
    const onCopy = vi.fn()
    const items = [food('a', 'Mince 95/5'), food('b', 'Burger pickles'), food('c', 'Wholemeal bread')]
    render(<CopyMealDialog open sourceMeal="Dinner" items={items} sourceDate="2026-11-07" today="2026-11-11" onClose={() => {}} onCopy={onCopy} />)

    fireEvent.click(screen.getByRole('checkbox', { name: /burger pickles/i }))
    fireEvent.click(screen.getByRole('button', { name: /tomorrow/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Lunch' }))
    expect(screen.getAllByRole('group', { name: 'Day' })[0].querySelectorAll('button')).toHaveLength(8)
    fireEvent.click(screen.getByRole('button', { name: 'Copy 2 foods' }))

    expect(onCopy).toHaveBeenCalledWith([items[0], items[2]], '2026-11-12', 'Lunch')
  })

  it('defaults to today for an older meal, and to tomorrow for today’s', () => {
    const onCopy = vi.fn()
    const { rerender } = render(<CopyMealDialog open sourceMeal="Dinner" items={[food('a', 'Rice')]} sourceDate="2026-11-07" today="2026-11-11" onClose={() => {}} onCopy={onCopy} />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy 1 food' }))
    rerender(<CopyMealDialog open sourceMeal="Dinner" items={[food('a', 'Rice')]} sourceDate="2026-11-11" today="2026-11-11" onClose={() => {}} onCopy={onCopy} />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy 1 food' }))
    expect(onCopy.mock.calls.map((call) => call[1])).toEqual(['2026-11-11', '2026-11-12'])
  })
})
