/**
 * FB-R6-S2-v2 · DauLineChart — last 30 days of DAU as a Recharts LineChart.
 * jsdom can't render full Recharts SVG, so we mock ResponsiveContainer to
 * give the chart a fixed parent size and assert on the data the component
 * passes downstream (data-testid attribute carries point count).
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DauLineChart } from '@/components/admin/DauLineChart'
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

describe('DauLineChart — FB-R6-S2-v2 AC02', () => {
  it('renders the chart container with the 7 stub data points', () => {
    render(<DauLineChart data={ADMIN_METRICS_STUB.dau} />)
    const chart = screen.getByTestId('dau-line-chart')
    expect(chart.getAttribute('data-point-count')).toBe('7')
  })

  it('AC07 empty state: empty array renders an empty-state surface, not an empty chart', () => {
    render(<DauLineChart data={[]} />)
    expect(screen.getByText(/no dau/i)).toBeInTheDocument()
  })

  it('AC12 boundary: single data point still renders without throwing', () => {
    expect(() =>
      render(<DauLineChart data={[{ day: '2026-05-21', active_users: 1 }]} />)
    ).not.toThrow()
  })

  it('clips to the most recent 30 days when more entries are passed (AC12)', () => {
    const fortyDays = Array.from({ length: 40 }, (_, i) => ({
      day: `2026-04-${String(i + 1).padStart(2, '0')}`,
      active_users: i,
    }))
    render(<DauLineChart data={fortyDays} />)
    const chart = screen.getByTestId('dau-line-chart')
    expect(chart.getAttribute('data-point-count')).toBe('30')
  })
})
