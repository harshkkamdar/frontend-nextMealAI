import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { backendGetLogs, logRow, shiftDay } from '@/test/backend-logs'

const { getLogs, apiFetch } = vi.hoisted(() => ({ getLogs: vi.fn(), apiFetch: vi.fn() }))
vi.mock('@/lib/api/logs.api', () => ({ getLogs }))
vi.mock('@/lib/api/client', async (original) => ({ ...(await original<object>()), apiFetch }))

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

describe('MonthViewSheet on a past month', () => {
  afterEach(() => vi.useRealTimers())

  it('fills every day of last month, past the newest 50 rows', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-17T10:00:00Z'))
    // Five food rows a day from 1 October to today.
    const rows = Array.from({ length: 48 * 5 }, (_, i) => {
      const date = shiftDay('2026-10-01', Math.floor(i / 5))
      return logRow(`f${i}`, 'food', date, `${date}T0${i % 5}:00:00.000Z`, { food_name: 'Toast', est_macros: { calories: 300 } })
    })
    getLogs.mockImplementation((await vi.importActual<typeof import('@/lib/api/logs.api')>('@/lib/api/logs.api')).getLogs)
    apiFetch.mockImplementation(backendGetLogs(rows, '2026-11-17'))
    render(<MonthViewSheet isOpen initialDate="2026-10-26" onClose={() => {}} onSelectDate={() => {}} tz="UTC" />)
    expect(await screen.findByText('31 days logged')).toBeInTheDocument()
  })
})
