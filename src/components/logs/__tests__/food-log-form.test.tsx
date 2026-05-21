/**
 * FB-R6-13 — FoodLogForm Photo Estimate flow
 *
 * Focused tests on the new photo-estimate path. The pre-existing manual
 * form path is unchanged and isn't re-tested here.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  estimate: vi.fn(),
  logFromEstimate: vi.fn(),
  createLog: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  back: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mocks.back, push: vi.fn() }),
}))

vi.mock('sonner', () => ({
  toast: { error: mocks.toastError, success: mocks.toastSuccess },
}))

vi.mock('@/lib/api/foods.api', () => ({
  estimateFoodFromPhoto: (...args: unknown[]) => mocks.estimate(...args),
  logFromEstimate: (...args: unknown[]) => mocks.logFromEstimate(...args),
}))

vi.mock('@/lib/api/logs.api', () => ({
  createLog: (...args: unknown[]) => mocks.createLog(...args),
}))

import { FoodLogForm } from '@/components/logs/food-log-form'

function getFileInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector('input[type="file"]')
  if (!input) throw new Error('file input not found')
  return input as HTMLInputElement
}

function makeImageFile() {
  return new File([new Uint8Array([1, 2, 3])], 'meal.jpg', { type: 'image/jpeg' })
}

const STUB_ESTIMATE = {
  estimate_id: 'est-abc',
  items: [
    { name: 'grilled chicken', quantity_g: 150, calories: 250, protein: 40, carbs: 0, fat: 8, confidence: 0.85 },
    { name: 'rice', quantity_g: 100, calories: 130, protein: 3, carbs: 28, fat: 0.5, confidence: 0.75 },
  ],
  totals: { calories: 380, protein: 43, carbs: 28, fat: 8.5 },
  confidence: 0.75,
}

describe('FoodLogForm — FB-R6-13 Photo Estimate', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => {
      if (typeof m === 'function' && 'mockReset' in m) (m as { mockReset: () => void }).mockReset()
    })
  })

  it('AC01: Photo estimate button is visible at the top of the form', () => {
    render(<FoodLogForm />)
    expect(screen.getByTestId('photo-estimate-button')).toBeInTheDocument()
  })

  it('AC02: selecting a photo calls estimateFoodFromPhoto and populates form fields', async () => {
    mocks.estimate.mockResolvedValueOnce(STUB_ESTIMATE)
    const { container } = render(<FoodLogForm />)
    const input = getFileInput(container)
    const file = makeImageFile()
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    input.dispatchEvent(new Event('change', { bubbles: true }))

    await waitFor(() => expect(mocks.estimate).toHaveBeenCalledTimes(1))

    // Form populated with aggregated estimate.
    await waitFor(() => {
      expect((screen.getByPlaceholderText(/grilled chicken breast/i) as HTMLInputElement).value)
        .toBe('grilled chicken, rice')
    })
    expect((screen.getByPlaceholderText('kcal') as HTMLInputElement).value).toBe('380')
    // Protein/Carbs/Fat share the 'g' placeholder; use the surrounding label structure.
    const proteinInput = screen.getByText('Protein').nextElementSibling as HTMLInputElement | null
    expect(proteinInput?.value).toBe('43')
  })

  it('AC02: shows the estimate confidence chip after a successful estimate', async () => {
    mocks.estimate.mockResolvedValueOnce(STUB_ESTIMATE)
    const { container } = render(<FoodLogForm />)
    const input = getFileInput(container)
    Object.defineProperty(input, 'files', { value: [makeImageFile()], configurable: true })
    input.dispatchEvent(new Event('change', { bubbles: true }))

    await waitFor(() => expect(screen.getByTestId('estimate-chip')).toBeInTheDocument())
    expect(screen.getByText(/confidence 75%/i)).toBeInTheDocument()
  })

  it('AC03: Save calls logFromEstimate (not createLog) when an estimate is loaded', async () => {
    mocks.estimate.mockResolvedValueOnce(STUB_ESTIMATE)
    mocks.logFromEstimate.mockResolvedValueOnce({ id: 'log-1' })
    const { container } = render(<FoodLogForm />)
    const input = getFileInput(container)
    Object.defineProperty(input, 'files', { value: [makeImageFile()], configurable: true })
    input.dispatchEvent(new Event('change', { bubbles: true }))
    await waitFor(() => expect(screen.getByTestId('estimate-chip')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => expect(mocks.logFromEstimate).toHaveBeenCalledTimes(1))
    const [estimateId, edits] = mocks.logFromEstimate.mock.calls[0]
    expect(estimateId).toBe('est-abc')
    expect(edits.totals.calories).toBe(380)
    expect(mocks.createLog).not.toHaveBeenCalled()
  })

  it('AC04: clearing the estimate chip routes Save back through createLog', async () => {
    mocks.estimate.mockResolvedValueOnce(STUB_ESTIMATE)
    mocks.createLog.mockResolvedValueOnce({ id: 'log-2' })
    const { container } = render(<FoodLogForm />)
    const input = getFileInput(container)
    Object.defineProperty(input, 'files', { value: [makeImageFile()], configurable: true })
    input.dispatchEvent(new Event('change', { bubbles: true }))
    await waitFor(() => expect(screen.getByTestId('estimate-chip')).toBeInTheDocument())

    fireEvent.click(screen.getByLabelText(/clear photo estimate/i))

    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() => expect(mocks.createLog).toHaveBeenCalledTimes(1))
    expect(mocks.logFromEstimate).not.toHaveBeenCalled()
  })

  it('AC05: no_food_identified response surfaces a friendly toast', async () => {
    mocks.estimate.mockResolvedValueOnce({
      estimate_id: 'est-empty',
      items: [],
      totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      confidence: 0,
      error: 'no_food_identified',
    })
    const { container } = render(<FoodLogForm />)
    const input = getFileInput(container)
    Object.defineProperty(input, 'files', { value: [makeImageFile()], configurable: true })
    input.dispatchEvent(new Event('change', { bubbles: true }))

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalled())
    expect(screen.queryByTestId('estimate-chip')).not.toBeInTheDocument()
  })

  it('AC06: upload failure surfaces an error toast and does not freeze the button', async () => {
    mocks.estimate.mockRejectedValueOnce(new Error('500 server error'))
    const { container } = render(<FoodLogForm />)
    const input = getFileInput(container)
    Object.defineProperty(input, 'files', { value: [makeImageFile()], configurable: true })
    input.dispatchEvent(new Event('change', { bubbles: true }))

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalled())
    const btn = screen.getByTestId('photo-estimate-button') as HTMLButtonElement
    await waitFor(() => expect(btn.disabled).toBe(false))
  })
})
