import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ apiFetch: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams('id=p-old'),
  usePathname: () => '/plans/view',
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/contexts/geo-screen-context', () => ({ useSetGeoScreen: () => {} }))
vi.mock('@/components/plans/plan-changelog', () => ({ PlanChangelog: () => null }))
vi.mock('@/components/shared/offline-band', () => ({ OfflineBand: () => null }))
vi.mock('@/lib/api/client', async (original) => ({ ...(await original<object>()), apiFetch: mocks.apiFetch }))

import PlanDetailPage from '../page'

// plans rows as plans.controller.ts getPlanById returns them: an old plan the user replaced, and the live one.
const rows = [
  { id: 'p-old', user_id: 'u1', type: 'workout', status: 'superseded', version: 1, previous_version_id: null, start_date: '2026-09-01', end_date: '2026-11-29', generated_by: 'manual', approved_at: null, deleted_at: null, content: { name: 'PPL', days: [{ name: 'Push', is_rest_day: false, exercises: [] }] }, created_at: '2026-09-01T00:00:00.000Z', updated_at: '2026-10-01T00:00:00.000Z' },
  { id: 'p-live', user_id: 'u1', type: 'workout', status: 'active', version: 1, previous_version_id: null, start_date: '2026-10-01', end_date: '2026-12-29', generated_by: 'manual', approved_at: null, deleted_at: null, content: { name: 'Upper lower', days: [] }, created_at: '2026-10-01T00:00:00.000Z', updated_at: '2026-10-01T00:00:00.000Z' },
]

// Mirrors getPlanById and activatePlan in plans.controller.ts: activating retires the type's active plan and makes this one active.
function backend(path: string, options?: { method?: string }) {
  const id = path.split('/')[3]
  const plan = rows.find((row) => row.id === id)
  if (!plan) return Promise.reject(new Error('404 NOT_FOUND'))
  if (options?.method === 'POST' && path.endsWith('/activate')) {
    if (plan.status === 'active') return Promise.reject(new Error('400 INVALID_STATUS: Plan is already active'))
    for (const row of rows) if (row.type === plan.type && row.status === 'active') row.status = 'superseded'
    plan.status = 'active'
    return Promise.resolve({ ...plan })
  }
  return Promise.resolve({ ...plan })
}

describe('Plan view, Make this my plan', () => {
  it('shows the plan as active once it is, with no second Make this my plan', async () => {
    mocks.apiFetch.mockImplementation(backend)
    render(<PlanDetailPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Make this my plan' }))
    expect(await screen.findByText(/^Active until/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Make this my plan' })).toBeNull()
  })
})
