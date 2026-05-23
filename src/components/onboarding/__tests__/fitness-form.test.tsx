/**
 * FB-R6-FE-A · Signup workout-frequency leading-zero
 *
 * Root cause: `useState<number>(3)` + `onChange={(e) => setWorkoutFrequency(Number(e.target.value))}`.
 * `Number('')` returns 0, which the controlled input then re-renders as "0",
 * so users can never delete the value and re-type.
 *
 * Tests assert the user-facing behavior: clearing the field leaves it empty;
 * retyping shows the typed value. They do NOT assert state shape — that's
 * negotiable per the PRD.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// vi.mock is hoisted before imports — use vi.hoisted to expose spies that the
// factory closures can capture without ReferenceError at module-eval time.
const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  submit: vi.fn().mockResolvedValue({}),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}))

vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}))

vi.mock('@/lib/api/profile.api', () => ({
  submitFitnessOnboarding: (...args: unknown[]) => mocks.submit(...args),
}))

// Import AFTER the mocks so the module picks up the mocked deps.
import { FitnessForm } from '@/components/onboarding/fitness-form'

function getFreqInput(): HTMLInputElement {
  return screen.getByLabelText(/workout frequency/i) as HTMLInputElement
}

describe('FitnessForm — workout-frequency leading-zero (FB-R6-FE-A)', () => {
  beforeEach(() => {
    mocks.push.mockClear()
    mocks.toastSuccess.mockClear()
    mocks.toastError.mockClear()
    mocks.submit.mockClear()
  })

  it('AC01: clearing the workout-frequency field leaves it empty (does not reassert 0)', () => {
    render(<FitnessForm />)
    const input = getFreqInput()
    // initial state from useState<number>(3)
    expect(input.value).toBe('3')

    fireEvent.change(input, { target: { value: '' } })

    // BUG (RED): today, the controlled state coerces '' → 0 and the input re-renders as "0".
    expect(input.value).toBe('')
  })

  it('AC02: clearing then typing 5 leaves the field showing 5', () => {
    render(<FitnessForm />)
    const input = getFreqInput()

    fireEvent.change(input, { target: { value: '' } })
    fireEvent.change(input, { target: { value: '5' } })

    expect(input.value).toBe('5')
  })

  it('AC07: typing 0 (intentional rest week) is accepted and not silently treated as empty', () => {
    render(<FitnessForm />)
    const input = getFreqInput()

    fireEvent.change(input, { target: { value: '0' } })

    expect(input.value).toBe('0')
  })
})
