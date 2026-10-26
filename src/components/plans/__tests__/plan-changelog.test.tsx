import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const apiFetchMock = vi.fn()
vi.mock('@/lib/api/client', () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}))

import { PlanChangelog } from '@/components/plans/plan-changelog'

beforeEach(() => apiFetchMock.mockReset())

describe('PlanChangelog', () => {
  it('renders nothing when there is only one version', async () => {
    apiFetchMock.mockResolvedValue({ versions: [{ id: 'v1', version: 1, status: 'active', created_at: '2026-09-14T10:00:00Z' }] })
    const { container } = render(<PlanChangelog planId="plan-1" />)
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledWith('/v1/plans/plan-1/versions'))
    await waitFor(() => expect(container.querySelector('[aria-hidden]')).toBeNull())
    expect(container).toBeEmptyDOMElement()
  })

  it('expands a version and renders neutral change prefixes', async () => {
    apiFetchMock
      .mockResolvedValueOnce({ versions: [
        { id: 'v3', version: 3, status: 'active', created_at: '2026-09-14T10:00:00Z' },
        { id: 'v2', version: 2, status: 'superseded', created_at: '2026-09-10T10:00:00Z' },
      ] })
      .mockResolvedValueOnce({ current: { id: 'v3', version: 3, created_at: '2026-09-14T10:00:00Z' }, previous: null, changes: [{ type: 'exercise_added', field: 'days', description: 'Added Bench Press' }] })
    render(<PlanChangelog planId="plan-1" />)
    await screen.findByText('History')
    fireEvent.click(screen.getByRole('button', { name: /Version 3, 14 Sep/ }))
    expect(await screen.findByText('Added Bench Press')).toBeInTheDocument()
    expect(screen.getByText('+')).toHaveClass('text-ink')
    expect(screen.getByText('Current')).toBeInTheDocument()
  })
})
