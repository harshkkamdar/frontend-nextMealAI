/**
 * FB-R6-S2-v2 · TopToolsChart — horizontal bar chart of tool_calls_7d.
 * BE returns the array ORDER BY call_count DESC.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TopToolsChart } from '@/components/admin/TopToolsChart'
import { ADMIN_METRICS_STUB } from './_stub'

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 800, height: 400 }}>{children}</div>
    ),
  }
})

describe('TopToolsChart — FB-R6-S2-v2 AC04', () => {
  it('renders create_log as the top entry (84 calls) — AC04 stub assertion', () => {
    render(<TopToolsChart data={ADMIN_METRICS_STUB.tool_calls_7d} />)
    // The component exposes the first tool name + count via a sr-only or
    // visible top label so the test can assert ordering without DOM-walking Recharts.
    const top = screen.getByTestId('top-tool-row-0')
    expect(top.textContent).toContain('create_log')
    expect(top.textContent).toContain('84')
  })

  it('renders all 5 stub tools', () => {
    render(<TopToolsChart data={ADMIN_METRICS_STUB.tool_calls_7d} />)
    const chart = screen.getByTestId('top-tools-chart')
    expect(chart.getAttribute('data-point-count')).toBe('5')
  })

  it('AC07 empty state: empty array renders an empty-state surface', () => {
    render(<TopToolsChart data={[]} />)
    expect(screen.getByText(/no tool/i)).toBeInTheDocument()
  })

  it('AC04 caps display at 20 entries even if BE returns more', () => {
    const big = Array.from({ length: 30 }, (_, i) => ({ tool_name: `tool_${i}`, call_count: 100 - i }))
    render(<TopToolsChart data={big} />)
    const chart = screen.getByTestId('top-tools-chart')
    expect(chart.getAttribute('data-point-count')).toBe('20')
  })
})
