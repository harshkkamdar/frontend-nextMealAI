/**
 * FB-R6-10 — CheckInCard
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CheckInCard } from '@/components/dashboard/check-in-card'
import type { DashboardCheckIn } from '@/lib/api/dashboard.api'

const FULL: DashboardCheckIn = {
  narrative: 'Strong week — macros hit target 5 of 7 days, weight trending down.',
  metrics: {
    macro_adherence_pct: 71,
    weight_delta_kg: -0.6,
    workout_count_7d: 3,
    data_days: 7,
  },
  generated_at: '2026-05-21T20:00:00.000Z',
}

describe('CheckInCard — FB-R6-10', () => {
  it('renders the narrative verbatim', () => {
    render(<CheckInCard checkIn={FULL} />)
    expect(screen.getByText(FULL.narrative)).toBeInTheDocument()
  })

  it('renders all 4 metrics with formatted values', () => {
    render(<CheckInCard checkIn={FULL} />)
    expect(screen.getByText('71%')).toBeInTheDocument()
    expect(screen.getByText('-0.6 kg')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('positive weight delta shows + prefix', () => {
    const positive: DashboardCheckIn = {
      ...FULL,
      metrics: { ...FULL.metrics, weight_delta_kg: 0.4 },
    }
    render(<CheckInCard checkIn={positive} />)
    expect(screen.getByText('+0.4 kg')).toBeInTheDocument()
  })

  it('null metrics render as em-dash placeholder', () => {
    const sparse: DashboardCheckIn = {
      ...FULL,
      metrics: {
        macro_adherence_pct: null,
        weight_delta_kg: null,
        workout_count_7d: null,
        data_days: null,
      },
    }
    render(<CheckInCard checkIn={sparse} />)
    // 4 metrics each rendered as '—'
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(4)
  })

  it('drill-down link prefills the Geo chat', () => {
    render(<CheckInCard checkIn={FULL} />)
    const link = screen.getByTestId('check-in-drilldown-link') as HTMLAnchorElement
    expect(link.getAttribute('href') ?? '').toMatch(/\/chat\/.+\?prefill=/)
  })

  it('uses the dashboard card chrome (visual contract)', () => {
    render(<CheckInCard checkIn={FULL} />)
    const card = screen.getByTestId('check-in-card')
    expect(card.className).toContain('bg-surface')
    expect(card.className).toContain('border-border')
    expect(card.className).toContain('rounded-2xl')
  })
})
