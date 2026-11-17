/** Steps pushed from Home's tile, on the web (no Apple Health or Health Connect here). */
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { backendGetLogs } from '@/test/backend-logs'

const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }))
vi.mock('@/lib/api/client', async (original) => ({ ...(await original<object>()), apiFetch }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }))
vi.mock('@/components/shared/offline-band', () => ({ OfflineBand: () => null }))

import { HealthWeek } from '../health-week'

describe('HealthWeek on the web', () => {
  it('with no steps, says steps come from the phone app', async () => {
    apiFetch.mockImplementation(backendGetLogs([], '2026-11-17'))
    render(<HealthWeek metric="steps" />)
    expect(await screen.findByText('No steps synced this week. Steps sync from the FIQR phone app.')).toBeInTheDocument()
  })
})
