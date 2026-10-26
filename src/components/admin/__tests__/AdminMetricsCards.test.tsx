/**
 * FB-R6-S2-v2 · AdminMetricsCards
 *
 * 4 KPI tiles fed directly from response.summary. Visual contract matches
 * the dashboard cards (v2: bg-card rounded-[24px] with the card shadow, uppercase
 * section labels, tabular-nums KPI numbers).
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdminMetricsCards } from '@/components/admin/AdminMetricsCards'
import { ADMIN_METRICS_STUB } from './_stub'

describe('AdminMetricsCards — FB-R6-S2-v2 AC01', () => {
  it('renders 4 KPI tiles with the stub numbers (47 / 12 / 28 / 5)', () => {
    render(<AdminMetricsCards summary={ADMIN_METRICS_STUB.summary} />)

    expect(screen.getByText('47')).toBeInTheDocument() // users_total
    expect(screen.getByText('12')).toBeInTheDocument() // dau_today
    expect(screen.getByText('28')).toBeInTheDocument() // wau_this_week
    expect(screen.getByText('5')).toBeInTheDocument() // new_signups_7d
  })

  it('renders the 4 labels (Users, DAU, WAU, New signups)', () => {
    render(<AdminMetricsCards summary={ADMIN_METRICS_STUB.summary} />)

    expect(screen.getByText(/users/i)).toBeInTheDocument()
    expect(screen.getByText(/dau/i)).toBeInTheDocument()
    expect(screen.getByText(/wau/i)).toBeInTheDocument()
    expect(screen.getByText(/new signups/i)).toBeInTheDocument()
  })

  it('uses the v2 card chrome: bg-card, card shadow, rounded-[24px], p-4 (AC17 visual contract)', () => {
    const { container } = render(<AdminMetricsCards summary={ADMIN_METRICS_STUB.summary} />)
    // Each tile is a Card with the shared dashboard chrome
    const tiles = container.querySelectorAll('[data-testid="admin-kpi-tile"]')
    expect(tiles.length).toBe(4)
    tiles.forEach((tile) => {
      const el = tile as HTMLElement
      expect(el.className).toContain('bg-card')
      expect(el.className).toContain('shadow-[var(--shadow-card)]')
      expect(el.className).toContain('rounded-[24px]')
    })
  })

  it('AC07 empty-state: zero summary values still render (no crash, no blank)', () => {
    render(
      <AdminMetricsCards
        summary={{ users_total: 0, dau_today: 0, wau_this_week: 0, new_signups_7d: 0 }}
      />
    )
    // Four zero readings present
    expect(screen.getAllByText('0')).toHaveLength(4)
  })
})
