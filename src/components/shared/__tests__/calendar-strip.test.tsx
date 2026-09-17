import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { CalendarStrip } from '../calendar-strip'

describe('CalendarStrip', () => {
  const scrollIntoView = vi.fn()

  beforeEach(() => {
    scrollIntoView.mockClear()
    HTMLElement.prototype.scrollIntoView = scrollIntoView
  })

  it('selects a date and centers the selected cell on mount', () => {
    const onSelectDate = vi.fn()
    render(
      <CalendarStrip
        selectedDate="2026-09-17"
        onSelectDate={onSelectDate}
        tz="UTC"
      />
    )

    expect(scrollIntoView).toHaveBeenCalledWith({ inline: 'center', block: 'nearest' })
    fireEvent.click(screen.getByRole('button', { name: /2026-09-18/i }))
    expect(onSelectDate).toHaveBeenCalledWith('2026-09-18')
  })

  it('renders one activity dot when food and workout are both present', () => {
    const indicators = new Map([
      ['2026-09-17', { food: true, workout: true }],
    ])
    render(
      <CalendarStrip
        selectedDate="2026-09-17"
        onSelectDate={() => {}}
        indicators={indicators}
        tz="UTC"
      />
    )

    expect(screen.getByRole('button', { name: /2026-09-17/i }).querySelectorAll('[data-indicator="activity"]')).toHaveLength(1)
  })
})
