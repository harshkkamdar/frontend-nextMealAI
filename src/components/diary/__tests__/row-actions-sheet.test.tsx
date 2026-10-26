import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { Log } from '@/types/logs.types'
import { RowActionsSheet } from '../row-actions-sheet'

const log: Log = {
  id: 'log-1', user_id: 'u', type: 'food', source: 'manual', local_date: '2026-10-26',
  payload: { food_name: 'Greek yoghurt', meal_type: 'breakfast', servings: 1, serving_label: 'bowl', est_macros: { calories: 412, protein: 24, carbs: 52, fat: 11 } },
  created_at: '2026-10-26T00:00:00Z', updated_at: '2026-10-26T00:00:00Z',
}

function setup(date = '2026-10-26') {
  const handlers = { onClose: vi.fn(), onEdit: vi.fn(), onMove: vi.fn(), onCopy: vi.fn(), onDelete: vi.fn() }
  render(<RowActionsSheet open log={log} date={date} today="2026-10-26" dayLabel={() => 'Mon 26 Oct'} {...handlers} />)
  return handlers
}

describe('RowActionsSheet', () => {
  it('lists the actions with the current meal', () => {
    setup()
    expect(screen.getByText('1 bowl · 412 kcal · Breakfast, Mon 26 Oct')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy to another day' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Change meal/ })).toHaveTextContent('Breakfast')
  })

  it('a past day offers Copy to today', () => {
    setup('2026-10-25')
    expect(screen.getByRole('button', { name: 'Copy to today' })).toBeInTheDocument()
  })

  it('Change meal moves to the picked meal; the current one is disabled', () => {
    const h = setup()
    fireEvent.click(screen.getByRole('button', { name: /Change meal/ }))
    expect(screen.getByRole('button', { name: /Breakfast/ })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Lunch' }))
    expect(h.onMove).toHaveBeenCalledWith(log, 'Lunch')
  })

  it('Copy defaults to tomorrow and the same meal', () => {
    const h = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Copy to another day' }))
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    expect(h.onCopy).toHaveBeenCalledWith(log, '2026-10-27', 'Breakfast')
  })

  it('Delete hands the log to the caller, which confirms', () => {
    const h = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(h.onDelete).toHaveBeenCalledWith(log)
  })
})
