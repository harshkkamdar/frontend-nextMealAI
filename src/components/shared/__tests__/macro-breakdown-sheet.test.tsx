import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MacroBreakdownSheet } from '@/components/shared/macro-breakdown-sheet'
import type { Log } from '@/types/logs.types'

function foodLog(id: string, name: string, est: Record<string, unknown>): Log {
  return {
    id,
    user_id: 'u1',
    type: 'food',
    payload: { food_name: name, est_macros: est },
    source: 'manual',
    created_at: '2026-04-14T12:00:00Z',
    updated_at: '2026-04-14T12:00:00Z',
  } as unknown as Log
}

const sampleLogs: Log[] = [
  foodLog('a', 'Chicken breast', { protein: 48, carbs: 0, fat: 5, calories: 240 }),
  foodLog('b', 'Rice', { protein: 4, carbs: 45, fat: 0.4, calories: 200 }),
  foodLog('c', 'Olive oil', { protein: 0, carbs: 0, fat: 14, calories: 120 }),
]

describe('MacroBreakdownSheet', () => {
  // AC01.4 — opens with macro-specific title, rows sorted by contribution desc
  it('renders title and sorted rows for the selected macro', () => {
    render(
      <MacroBreakdownSheet open macro="protein" foodLogs={sampleLogs} onClose={() => {}} />,
    )
    expect(screen.getByText(/protein breakdown/i)).toBeInTheDocument()
    const rows = screen.getAllByTestId('breakdown-row')
    expect(rows).toHaveLength(2) // chicken 48, rice 4 — olive oil has 0
    expect(within(rows[0]).getByText('Chicken breast')).toBeInTheDocument()
    expect(within(rows[1]).getByText('Rice')).toBeInTheDocument()
  })

  // AC01.5 — each row shows contribution + percent
  it('shows contribution value and percent per row', () => {
    render(
      <MacroBreakdownSheet open macro="carbs" foodLogs={sampleLogs} onClose={() => {}} />,
    )
    const rows = screen.getAllByTestId('breakdown-row')
    // only rice contributes 45g, 100%
    expect(rows).toHaveLength(1)
    const row = rows[0]
    expect(within(row).getByText(/45g/)).toBeInTheDocument()
    expect(within(row).getByText(/100%/)).toBeInTheDocument()
  })

  // AC01.6 — backdrop click closes
  it('closes when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(
      <MacroBreakdownSheet open macro="protein" foodLogs={sampleLogs} onClose={onClose} />,
    )
    fireEvent.click(screen.getByTestId('breakdown-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  // AC01.7 — uses logs passed in (diary selected date)
  it('uses the foodLogs prop (not global state)', () => {
    const diaryLogs: Log[] = [foodLog('d', 'Yesterday steak', { protein: 60 })]
    render(
      <MacroBreakdownSheet open macro="protein" foodLogs={diaryLogs} onClose={() => {}} />,
    )
    expect(screen.getByText('Yesterday steak')).toBeInTheDocument()
    expect(screen.queryByText('Chicken breast')).not.toBeInTheDocument()
  })

  // AC01.8 — empty state
  it('shows empty-state row when no food logs', () => {
    render(<MacroBreakdownSheet open macro="protein" foodLogs={[]} onClose={() => {}} />)
    expect(screen.getByText(/no food logged yet/i)).toBeInTheDocument()
    expect(screen.queryAllByTestId('breakdown-row')).toHaveLength(0)
  })

  // AC01.9 — malformed est_macros coerced; no NaN in DOM
  it('coerces malformed est_macros and never renders NaN', () => {
    const bad: Log[] = [
      foodLog('1', 'Broken', { protein: Number.NaN }),
      foodLog('2', 'Null', { protein: null }),
      foodLog('3', 'Good', { protein: 20 }),
    ]
    const { container } = render(
      <MacroBreakdownSheet open macro="protein" foodLogs={bad} onClose={() => {}} />,
    )
    expect(container.textContent).not.toMatch(/NaN/)
    expect(screen.getAllByTestId('breakdown-row')).toHaveLength(1)
    expect(screen.getByText('Good')).toBeInTheDocument()
  })

  // AC01.12 — trace values (0.04g) excluded
  it('excludes trace contributions that round to 0g', () => {
    const trace: Log[] = [
      foodLog('1', 'Trace', { protein: 0.04 }),
      foodLog('2', 'Real', { protein: 10 }),
    ]
    render(<MacroBreakdownSheet open macro="protein" foodLogs={trace} onClose={() => {}} />)
    expect(screen.queryByText('Trace')).not.toBeInTheDocument()
    expect(screen.getByText('Real')).toBeInTheDocument()
  })

  // does not render when closed
  it('renders nothing when open=false', () => {
    const { container } = render(
      <MacroBreakdownSheet open={false} macro="protein" foodLogs={sampleLogs} onClose={() => {}} />,
    )
    expect(container.textContent).toBe('')
  })
})
