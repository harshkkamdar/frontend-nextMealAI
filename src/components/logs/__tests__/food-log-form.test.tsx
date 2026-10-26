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
  createLogs: vi.fn(),
  getPersonalFoods: vi.fn(async (): Promise<import('@/types/foods.types').UserFood[]> => []),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  back: vi.fn(),
  push: vi.fn(),
  // R6-12 — the form now reads useSearchParams (meal/date). Tests set this string.
  searchParamsStr: '',
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mocks.back, push: mocks.push }),
  useSearchParams: () => new URLSearchParams(mocks.searchParamsStr),
}))

vi.mock('sonner', () => ({
  toast: { error: mocks.toastError, success: mocks.toastSuccess },
}))

vi.mock('@/lib/api/foods.api', () => ({
  estimateFoodFromPhoto: (...args: unknown[]) => mocks.estimate(...args),
  logFromEstimate: (...args: unknown[]) => mocks.logFromEstimate(...args),
  // BUG-009 — the page now searches the food DB; tests never type so this
  // resolves to no results, but the export must exist on the mocked module.
  searchFoods: () => Promise.resolve([]),
  // R6-12 — the page loads the user's own foods (favourites + recents) up front.
  getPersonalFoods: () => mocks.getPersonalFoods(),
}))

vi.mock('@/lib/api/logs.api', () => ({
  createLog: (...args: unknown[]) => mocks.createLog(...args),
  createLogs: (...args: unknown[]) => mocks.createLogs(...args),
}))

vi.mock('@/lib/image/compress', () => ({
  compressImage: (file: File) => Promise.resolve(file),
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
    // Restore defaults cleared by mockReset (the form calls these on mount).
    mocks.getPersonalFoods.mockResolvedValue([])
    mocks.searchParamsStr = ''
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
    expect((screen.getByLabelText('Calories') as HTMLInputElement).value).toBe('380')
    expect((screen.getByLabelText('Protein') as HTMLInputElement).value).toBe('43')
  })

  it('AC02: shows the estimate confidence chip after a successful estimate', async () => {
    mocks.estimate.mockResolvedValueOnce(STUB_ESTIMATE)
    const { container } = render(<FoodLogForm />)
    const input = getFileInput(container)
    Object.defineProperty(input, 'files', { value: [makeImageFile()], configurable: true })
    input.dispatchEvent(new Event('change', { bubbles: true }))

    await waitFor(() => expect(screen.getByTestId('estimate-chip')).toBeInTheDocument())
    expect(screen.getByText(/about 75% sure/i)).toBeInTheDocument()
  })

  it('scrolls the filled editor card clear of the pinned tray', async () => {
    mocks.estimate.mockResolvedValueOnce(STUB_ESTIMATE)
    const scrollBy = vi.spyOn(window, 'scrollBy').mockImplementation(() => {})
    // Card ends at 700 px (the search bar too, so the tray rule decides); the 190 px tray rests 12 px above the 768 px window bottom, so its top is at 566.
    const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top: 300, bottom: 700 } as DOMRect)
    const height = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(190)
    const style = vi.spyOn(window, 'getComputedStyle').mockReturnValue({ bottom: '12px' } as CSSStyleDeclaration)
    const { container } = render(<FoodLogForm />)
    const input = getFileInput(container)
    Object.defineProperty(input, 'files', { value: [makeImageFile()], configurable: true })
    input.dispatchEvent(new Event('change', { bubbles: true }))

    // 700 + 16 gap - 566 = 150
    await waitFor(() => expect(scrollBy).toHaveBeenCalledWith({ top: 150, behavior: 'smooth' }))
    ;[scrollBy, rect, height, style].forEach((spy) => spy.mockRestore())
  })

  it('AC03: Save calls logFromEstimate (not createLog) when an estimate is loaded', async () => {
    mocks.estimate.mockResolvedValueOnce(STUB_ESTIMATE)
    mocks.logFromEstimate.mockResolvedValueOnce({ id: 'log-1' })
    const { container } = render(<FoodLogForm />)
    const input = getFileInput(container)
    Object.defineProperty(input, 'files', { value: [makeImageFile()], configurable: true })
    input.dispatchEvent(new Event('change', { bubbles: true }))
    await waitFor(() => expect(screen.getByTestId('estimate-chip')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /^log meal$/i }))

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

    fireEvent.click(screen.getByRole('button', { name: /^log meal$/i }))
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

// ── R6-12 — food logging as its own page: favourites/recents-first + meal/date ──
function userFood(over: Partial<import('@/types/foods.types').UserFood> = {}): import('@/types/foods.types').UserFood {
  return {
    id: over.id ?? 'f1', user_id: 'u1', name: over.name ?? 'Oat Toast',
    serving_size_g: over.serving_size_g ?? 40,
    macros_per_serving: over.macros_per_serving ?? { calories: 90, protein: 3, carbs: 15, fat: 1 },
    source: 'personal', is_favorite: over.is_favorite ?? false,
    use_count: over.use_count ?? 1, last_used_at: over.last_used_at, created_at: '2026-08-01T00:00:00Z',
    ...over,
  }
}

describe('FoodLogForm — R6-12 full-page logging (favourites/recents-first)', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => {
      if (typeof m === 'function' && 'mockReset' in m) (m as { mockReset: () => void }).mockReset()
    })
    mocks.getPersonalFoods.mockResolvedValue([])
    mocks.searchParamsStr = ''
  })

  it('shows the user\'s favourites and recents BEFORE searching', async () => {
    mocks.getPersonalFoods.mockResolvedValue([
      userFood({ id: 'fav1', name: 'Greek Yogurt', is_favorite: true }),
      userFood({ id: 'rec1', name: 'Raisin Toast', last_used_at: '2026-08-13T09:00:00Z' }),
    ])
    render(<FoodLogForm />)
    await waitFor(() => expect(screen.getByTestId('your-foods')).toBeInTheDocument())
    expect(screen.getByText('Greek Yogurt')).toBeInTheDocument()
    expect(screen.getByText('Raisin Toast')).toBeInTheDocument()
    expect(screen.getByText('Favourites')).toBeInTheDocument()
    expect(screen.getByText('Recent')).toBeInTheDocument()
  })

  it('keeps the tray save action disabled when there is no food', () => {
    render(<FoodLogForm />)
    expect(screen.queryByTestId('food-meal-tray')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^log meal$/i })).not.toBeInTheDocument()
  })

  it('prefills the meal pill from the URL', () => {
    mocks.searchParamsStr = 'meal=Dinner'
    render(<FoodLogForm />)
    expect(screen.getByRole('button', { name: /Dinner/ })).toBeInTheDocument()
  })

  it('tapping a saved food prefills the form', async () => {
    mocks.getPersonalFoods.mockResolvedValue([userFood({ name: 'Greek Yogurt', is_favorite: true })])
    render(<FoodLogForm />)
    await waitFor(() => expect(screen.getByText('Greek Yogurt')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Greek Yogurt'))
    // Food Name input now carries the tapped food.
    expect(screen.getByDisplayValue('Greek Yogurt')).toBeInTheDocument()
  })

  it('a real 0 macro shows as 0 g in its tile and is logged as 0, not left blank', async () => {
    mocks.getPersonalFoods.mockResolvedValue([userFood({ name: 'Chicken breast', is_favorite: true, macros_per_serving: { calories: 165, protein: 28, carbs: 0, fat: 0 } })])
    mocks.createLog.mockResolvedValue({ id: 'log1' })
    render(<FoodLogForm />)
    await waitFor(() => expect(screen.getByText('Chicken breast')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Chicken breast'))
    expect(screen.getByLabelText('Carbs')).toHaveValue(0)
    expect(screen.getByLabelText('Fat')).toHaveValue(0)
    fireEvent.click(screen.getByText('Log meal'))
    await waitFor(() => expect(mocks.createLog).toHaveBeenCalled())
    expect(mocks.createLog.mock.calls[0][0].payload.est_macros).toEqual({ calories: 165, protein: 28, carbs: 0, fat: 0 })
  })

  it('logs to the meal + date from the URL (not "today")', async () => {
    mocks.searchParamsStr = 'meal=Lunch&date=2026-08-10'
    mocks.getPersonalFoods.mockResolvedValue([userFood({ name: 'Greek Yogurt', is_favorite: true })])
    mocks.createLog.mockResolvedValue({ id: 'log1' })
    render(<FoodLogForm />)
    await waitFor(() => expect(screen.getByText('Greek Yogurt')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Greek Yogurt'))
    fireEvent.click(screen.getByText('Log meal'))
    await waitFor(() => expect(mocks.createLog).toHaveBeenCalled())
    const arg = mocks.createLog.mock.calls[0][0]
    expect(arg.local_date).toBe('2026-08-10')
    expect(arg.payload.meal_type).toBe('Lunch')
    expect(arg.payload.food_name).toBe('Greek Yogurt')
  })

  it('hides Your Foods once the user starts typing a search', async () => {
    mocks.getPersonalFoods.mockResolvedValue([userFood({ name: 'Greek Yogurt', is_favorite: true })])
    render(<FoodLogForm />)
    await waitFor(() => expect(screen.getByTestId('your-foods')).toBeInTheDocument())
    fireEvent.change(screen.getByTestId('food-search-input'), { target: { value: 'chicken' } })
    await waitFor(() => expect(screen.queryByTestId('your-foods')).not.toBeInTheDocument())
  })

  it('shows the staged and current item count in the tray', async () => {
    mocks.getPersonalFoods.mockResolvedValue([
      userFood({ name: 'Greek Yogurt', is_favorite: true }),
    ])
    render(<FoodLogForm />)
    await waitFor(() => expect(screen.getByText('Greek Yogurt')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Greek Yogurt'))
    fireEvent.click(screen.getByRole('button', { name: 'Add to tray' }))
    await waitFor(() => expect(screen.getAllByText('Greek Yogurt')).toHaveLength(2))
    fireEvent.click(screen.getByTestId('personal-food-row'))
    expect(screen.getByText('2 items · 180 kcal')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log 2 items' })).toBeInTheDocument()
  })
})

describe('FoodLogForm — R7-07 servings selector', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => {
      if (typeof m === 'function' && 'mockReset' in m) (m as { mockReset: () => void }).mockReset()
    })
    mocks.getPersonalFoods.mockResolvedValue([])
    mocks.searchParamsStr = ''
  })

  it('tapping a food with a serving size shows the Servings/Grams toggle (default Servings)', async () => {
    mocks.getPersonalFoods.mockResolvedValue([userFood({ name: 'Bega Cheese Slice', serving_size_g: 21, is_favorite: true })])
    render(<FoodLogForm />)
    await waitFor(() => expect(screen.getByText('Bega Cheese Slice')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Bega Cheese Slice'))
    expect(screen.getByTestId('serving-mode-toggle')).toBeInTheDocument()
    expect(screen.getByTestId('servings-value').textContent).toBe('1')
    expect(screen.getByText(/21 g/)).toBeInTheDocument() // derived grams
  })

  it('the + stepper increases servings (and derived grams)', async () => {
    mocks.getPersonalFoods.mockResolvedValue([userFood({ name: 'Bega Cheese Slice', serving_size_g: 21, is_favorite: true })])
    render(<FoodLogForm />)
    await waitFor(() => expect(screen.getByText('Bega Cheese Slice')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Bega Cheese Slice'))
    fireEvent.click(screen.getByLabelText('More servings'))
    expect(screen.getByTestId('servings-value').textContent).toBe('1.25')
  })

  it('logs quantity_g = servings × serving size (no manual gram math)', async () => {
    mocks.searchParamsStr = 'meal=Dinner'
    mocks.getPersonalFoods.mockResolvedValue([userFood({ name: 'Bega Cheese Slice', serving_size_g: 21, is_favorite: true })])
    mocks.createLog.mockResolvedValue({ id: 'log1' })
    render(<FoodLogForm />)
    await waitFor(() => expect(screen.getByText('Bega Cheese Slice')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Bega Cheese Slice'))
    // 1 → 2 servings (4 × +0.25)
    for (let i = 0; i < 4; i++) fireEvent.click(screen.getByLabelText('More servings'))
    expect(screen.getByTestId('servings-value').textContent).toBe('2')
    fireEvent.click(screen.getByText('Log meal'))
    await waitFor(() => expect(mocks.createLog).toHaveBeenCalled())
    expect(mocks.createLog.mock.calls[0][0].payload.quantity_g).toBe(42) // 2 × 21
  })
})
