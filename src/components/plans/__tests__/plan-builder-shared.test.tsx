import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import {
  NumberField,
  SearchablePicker,
  PlanNameField,
  PlanDateRangeField,
} from '@/components/plans/plan-builder-shared'

describe('NumberField', () => {
  it('renders label and suffix', () => {
    render(<NumberField label="Sets" suffix="reps" value={3} onChange={() => {}} />)
    expect(screen.getByText('Sets')).toBeInTheDocument()
    expect(screen.getByText('(reps)')).toBeInTheDocument()
    expect(screen.getByRole('spinbutton')).toHaveValue(3)
  })

  it('clamps values above max', () => {
    const onChange = vi.fn()
    render(<NumberField label="Reps" value={5} onChange={onChange} max={10} />)
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '50' } })
    expect(onChange).toHaveBeenCalledWith(10)
  })

  it('clamps values below min', () => {
    const onChange = vi.fn()
    render(<NumberField label="Reps" value={5} onChange={onChange} min={1} />)
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '0' } })
    expect(onChange).toHaveBeenCalledWith(1)
  })

  it('emits undefined for empty string', () => {
    const onChange = vi.fn()
    render(<NumberField label="Reps" value={5} onChange={onChange} />)
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '' } })
    expect(onChange).toHaveBeenCalledWith(undefined)
  })
})

describe('PlanNameField', () => {
  it('calls onChange when typing', () => {
    const onChange = vi.fn()
    render(<PlanNameField value="" onChange={onChange} />)
    fireEvent.change(screen.getByPlaceholderText('Plan name'), { target: { value: 'Bulk' } })
    expect(onChange).toHaveBeenCalledWith('Bulk')
  })
})

describe('PlanDateRangeField', () => {
  it('renders two date inputs and emits changes', () => {
    const onChange = vi.fn()
    render(<PlanDateRangeField startDate="" endDate="" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2025-01-01' } })
    expect(onChange).toHaveBeenCalledWith({ startDate: '2025-01-01', endDate: '' })
  })
})

interface Item {
  id: string
  name: string
}

describe('SearchablePicker', () => {
  it('debounces search calls and renders results', async () => {
    const search = vi.fn(async (_q: string): Promise<Item[]> => [{ id: '1', name: 'Bench Press' }])
    render(
      <SearchablePicker<Item>
        placeholder="Find exercise"
        search={search}
        renderItem={(item) => <span>{item.name}</span>}
        getItemKey={(item) => item.id}
        onSelect={() => {}}
        debounceMs={20}
      />,
    )

    const input = screen.getByPlaceholderText('Find exercise')
    fireEvent.change(input, { target: { value: 'be' } })
    fireEvent.change(input, { target: { value: 'ben' } })

    await waitFor(() => expect(search).toHaveBeenCalledTimes(1))
    expect(search).toHaveBeenCalledWith('ben')

    await waitFor(() => expect(screen.getByText('Bench Press')).toBeInTheDocument())
  })

  it('fires onSelect when a result is clicked', async () => {
    const search = vi.fn(async (_q: string): Promise<Item[]> => [{ id: '1', name: 'Squat' }])
    const onSelect = vi.fn()
    render(
      <SearchablePicker<Item>
        search={search}
        renderItem={(item) => <span>{item.name}</span>}
        getItemKey={(item) => item.id}
        onSelect={onSelect}
        debounceMs={20}
      />,
    )

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'squ' } })
    await waitFor(() => screen.getByText('Squat'))
    fireEvent.click(screen.getByText('Squat'))
    expect(onSelect).toHaveBeenCalledWith({ id: '1', name: 'Squat' })
  })

  it('shows a selected value chip with clear button', () => {
    const onClear = vi.fn()
    render(
      <SearchablePicker<Item>
        search={async () => []}
        renderItem={(item) => <span>{item.name}</span>}
        getItemKey={(item) => item.id}
        onSelect={() => {}}
        value="Bench Press"
        onClear={onClear}
      />,
    )
    expect(screen.getByText('Bench Press')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Clear selection'))
    expect(onClear).toHaveBeenCalled()
  })
})
