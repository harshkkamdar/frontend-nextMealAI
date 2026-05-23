/**
 * FB-R6-S2-v2 · ActiveUsersTable — sortable by every numeric column.
 * Clicking a column header toggles asc → desc → asc.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ActiveUsersTable } from '@/components/admin/ActiveUsersTable'
import { ADMIN_METRICS_STUB } from './_stub'

function getRowUserIds(): string[] {
  const rows = screen.getAllByTestId('active-user-row')
  return rows.map((r) => r.getAttribute('data-user-id') ?? '')
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

  // FB-R6-S2-v2.5: email column + click-to-drill
  it('renders the email column with each user\'s email (not just UUID)', () => {
    render(<ActiveUsersTable users={ADMIN_METRICS_STUB.active_users_30d} />)
    expect(screen.getByText('alice@stub.local')).toBeInTheDocument()
    expect(screen.getByText('bob@stub.local')).toBeInTheDocument()
    expect(screen.getByText('carol@stub.local')).toBeInTheDocument()
  })

  it('renders display_name below the email when present', () => {
    render(<ActiveUsersTable users={ADMIN_METRICS_STUB.active_users_30d} />)
    expect(screen.getByText('Alice Stubbins')).toBeInTheDocument()
    expect(screen.getByText('Bob Stubbins')).toBeInTheDocument()
  })

  it('falls back to truncated UUID when email is missing (data shape robustness)', () => {
    const usersWithMissingEmail = [
      { ...ADMIN_METRICS_STUB.active_users_30d[0], email: '', user_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' },
    ]
    render(<ActiveUsersTable users={usersWithMissingEmail} />)
    // Truncated to first 8 chars + ellipsis
    expect(screen.getByText(/aaaaaaaa…/)).toBeInTheDocument()
  })

  it('fires onRowClick with the full user object when a row is clicked', () => {
    const handler = vi.fn()
    render(
      <ActiveUsersTable
        users={ADMIN_METRICS_STUB.active_users_30d}
        onRowClick={handler}
      />
    )
    const aliceRow = screen.getAllByTestId('active-user-row')[0]
    fireEvent.click(aliceRow)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler.mock.calls[0][0].user_id).toBe('stub-user-1')
    expect(handler.mock.calls[0][0].email).toBe('alice@stub.local')
  })

  it('does NOT add a click cursor or fire handler when onRowClick is absent', () => {
    render(<ActiveUsersTable users={ADMIN_METRICS_STUB.active_users_30d} />)
    const row = screen.getAllByTestId('active-user-row')[0]
    expect(row.className).not.toContain('cursor-pointer')
  })
})
