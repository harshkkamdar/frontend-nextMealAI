/**
 * FB-R6-S2-v2 · ActiveUsersTable — sortable by every numeric column.
 * Clicking a column header toggles asc → desc → asc.
 */

import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { ActiveUsersTable } from '@/components/admin/ActiveUsersTable'
import { ADMIN_METRICS_STUB } from './_stub'

function getRowUserIds(): string[] {
  const rows = screen.getAllByTestId('active-user-row')
  return rows.map((r) => within(r).getByTestId('user-id').textContent ?? '')
}

describe('ActiveUsersTable — FB-R6-S2-v2 AC05', () => {
  it('renders one row per active user', () => {
    render(<ActiveUsersTable users={ADMIN_METRICS_STUB.active_users_30d} />)
    expect(screen.getAllByTestId('active-user-row')).toHaveLength(3)
  })

  it('starts unsorted (BE order preserved) — stub-user-1 first', () => {
    render(<ActiveUsersTable users={ADMIN_METRICS_STUB.active_users_30d} />)
    expect(getRowUserIds()).toEqual(['stub-user-1', 'stub-user-2', 'stub-user-3'])
  })

  it('AC05 sort by food_log_count: clicking header sorts desc (42, 28, 19)', () => {
    render(<ActiveUsersTable users={ADMIN_METRICS_STUB.active_users_30d} />)
    fireEvent.click(screen.getByRole('button', { name: /food log count/i }))
    expect(getRowUserIds()).toEqual(['stub-user-1', 'stub-user-2', 'stub-user-3'])
  })

  it('AC05 sort toggles asc on second click (19, 28, 42)', () => {
    render(<ActiveUsersTable users={ADMIN_METRICS_STUB.active_users_30d} />)
    const header = screen.getByRole('button', { name: /food log count/i })
    fireEvent.click(header) // desc
    fireEvent.click(header) // asc
    expect(getRowUserIds()).toEqual(['stub-user-3', 'stub-user-2', 'stub-user-1'])
  })

  it('AC05 sort by workout_session_count desc puts stub-user-2 first (12)', () => {
    render(<ActiveUsersTable users={ADMIN_METRICS_STUB.active_users_30d} />)
    fireEvent.click(screen.getByRole('button', { name: /workout session count/i }))
    expect(getRowUserIds()).toEqual(['stub-user-2', 'stub-user-1', 'stub-user-3'])
  })

  it('AC05 sort by chat_turn_count desc (67, 41, 22)', () => {
    render(<ActiveUsersTable users={ADMIN_METRICS_STUB.active_users_30d} />)
    fireEvent.click(screen.getByRole('button', { name: /chat turn count/i }))
    expect(getRowUserIds()).toEqual(['stub-user-1', 'stub-user-2', 'stub-user-3'])
  })

  it('AC07 empty state: empty users array renders an empty-state surface', () => {
    render(<ActiveUsersTable users={[]} />)
    expect(screen.getByText(/no active users/i)).toBeInTheDocument()
  })
})
