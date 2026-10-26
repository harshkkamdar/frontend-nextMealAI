import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

const getLogs = vi.hoisted(() => vi.fn())
vi.mock('@/lib/api/logs.api', () => ({ getLogs }))

import { MonthViewSheet } from '../month-view-sheet'

const food = { id: 'f1', user_id: 'u', type: 'food', source: 'manual', local_date: '2026-10-26', payload: { food_name: 'Toast', est_macros: { calories: 300 } }, created_at: '2026-10-26T00:00:00Z', updated_at: '2026-10-26T00:00:00Z' }

describe('MonthViewSheet', () => {
  it('shows a failed load with a retry instead of an empty month', async () => {
    getLogs.mockRejectedValue(new Error('offline'))
    render(<MonthViewSheet isOpen initialDate="2026-10-26" onClose={() => {}} onSelectDate={() => {}} tz="Australia/Sydney" />)
    expect(await screen.findByText("Couldn't load this month")).toBeInTheDocument()
    expect(screen.queryByText('No logs this month')).toBeNull()

    getLogs.mockImplementation(({ type }: { type: string }) => Promise.resolve(type === 'food' ? [food] : []))
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('1 day logged')).toBeInTheDocument()
    expect(screen.queryByText("Couldn't load this month")).toBeNull()
  })
})
