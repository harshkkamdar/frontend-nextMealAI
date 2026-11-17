/** The weight sheet's trend, with GET /v1/logs answered by the backend fake. */
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { backendGetLogs, logRow } from '@/test/backend-logs'

const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }))
vi.mock('@/lib/api/client', async (original) => ({ ...(await original<object>()), apiFetch }))
vi.mock('@/lib/platform/app', () => ({ haptic: vi.fn() }))

import { QuickLogSheet } from '../quick-log-sheet'

describe('Weight sheet trend', () => {
  it('draws from every recent weigh-in, not only the ones in Home\'s 8-day window', async () => {
    apiFetch.mockImplementation(backendGetLogs([
      logRow('w1', 'weight', '2026-11-05', '2026-11-05T07:00:00.000Z', { weight_kg: 78.8 }),
      logRow('w2', 'weight', '2026-11-17', '2026-11-17T07:00:00.000Z', { weight_kg: 78.6 }),
    ], '2026-11-17'))
    // What Home passes: weightTile over its 8 days of logs, so only today's weigh-in.
    render(<QuickLogSheet type="weight" onDone={() => {}} onClose={() => {}} water={0} weight={{ kg: 78.6, weekDelta: null, series: [78.6], date: '2026-11-17', today: '2026-11-17' }} />)
    expect(await screen.findByRole('img', { name: 'Weight, last 2 weigh-ins, 78.8 to 78.6 kg' })).toBeInTheDocument()
    expect(screen.queryByText('Your trend draws after two weigh-ins.')).toBeNull()
  })
})
