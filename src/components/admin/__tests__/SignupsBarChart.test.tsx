/**
 * FB-R6-S2-v2 · SignupsBarChart — last 30 days of signups as a Recharts BarChart.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SignupsBarChart } from '@/components/admin/SignupsBarChart'
import { ADMIN_METRICS_STUB } from './_stub'

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 800, height: 200 }}>{children}</div>
    ),
  }
})

describe('SignupsBarChart — FB-R6-S2-v2 AC03', () => {
  it('renders the chart with the 7 stub data points', () => {
    render(<SignupsBarChart data={ADMIN_METRICS_STUB.signups} />)
    const chart = screen.getByTestId('signups-bar-chart')
    expect(chart.getAttribute('data-point-count')).toBe('7')
  })

  it('AC07 empty state: empty array renders an empty-state surface', () => {
    render(<SignupsBarChart data={[]} />)
    expect(screen.getByText(/no signups/i)).toBeInTheDocument()
  })

  it('AC12 boundary: zero-only data is allowed (real-world: some days have 0 signups)', () => {
    const allZero = [
      { day: '2026-05-19', signups: 0 },
      { day: '2026-05-20', signups: 0 },
      { day: '2026-05-21', signups: 0 },
    ]
    render(<SignupsBarChart data={allZero} />)
    const chart = screen.getByTestId('signups-bar-chart')
    expect(chart.getAttribute('data-point-count')).toBe('3')
  })
})
