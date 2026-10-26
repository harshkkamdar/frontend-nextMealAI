/**
 * Log food (journey-log B2 item sheet, C2 photo rows, D2 plate pill).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import type { UserFood } from '@/types/foods.types'

const mocks = vi.hoisted(() => ({
  estimate: vi.fn(),
  logFromEstimate: vi.fn(),
  updateLog: vi.fn(),
  createLogs: vi.fn(),
  getPersonalFoods: vi.fn(),
  searchFoods: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  back: vi.fn(),
  push: vi.fn(),
  searchParamsStr: '',
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mocks.back, push: mocks.push }),
  useSearchParams: () => new URLSearchParams(mocks.searchParamsStr),
}))
vi.mock('sonner', () => ({ toast: { error: mocks.toastError, success: mocks.toastSuccess } }))
vi.mock('@/components/ui/bottom-sheet', () => ({
  BottomSheet: ({ open, children }: { open: boolean; children: React.ReactNode }) => (open ? <div role="dialog">{children}</div> : null),
}))
vi.mock('@/lib/api/foods.api', () => ({
  estimateFoodFromPhoto: (...args: unknown[]) => mocks.estimate(...args),
  logFromEstimate: (...args: unknown[]) => mocks.logFromEstimate(...args),
  searchFoods: (...args: unknown[]) => mocks.searchFoods(...args),
  getPersonalFoods: () => mocks.getPersonalFoods(),
}))
vi.mock('@/lib/api/logs.api', () => ({
  createLogs: (...args: unknown[]) => mocks.createLogs(...args),
  updateLog: (...args: unknown[]) => mocks.updateLog(...args),
}))
vi.mock('@/lib/image/compress', () => ({ compressImage: (file: File) => Promise.resolve(file) }))

import { FoodLogForm } from '@/components/logs/food-log-form'

const FOOD: UserFood = {
  id: 'f1', user_id: 'u', name: 'Greek yoghurt', serving_size_g: 170, source: 'manual', is_favorite: true, use_count: 3,
  macros_per_serving: { calories: 100, protein: 17, carbs: 6, fat: 0.7 }, created_at: '2026-10-01T00:00:00Z', last_used_at: '2026-10-26T01:00:00Z',
}
const BANANA: UserFood = { ...FOOD, id: 'f2', name: 'Banana', serving_size_g: 118, is_favorite: false, macros_per_serving: { calories: 105, protein: 1, carbs: 27, fat: 0 } }

const ESTIMATE = {
  estimate_id: 'est-1',
  items: [
    { name: 'Chicken', quantity_g: 150, calories: 250, protein: 40, carbs: 0, fat: 8, confidence: 0.85 },
    { name: 'Sauce', quantity_g: 30, calories: 90, protein: 1, carbs: 6, fat: 7, confidence: 0.4 },
  ],
  totals: { calories: 340, protein: 41, carbs: 6, fat: 15 },
  confidence: 0.75,
}

URL.createObjectURL = vi.fn(() => 'blob:photo')
URL.revokeObjectURL = vi.fn()

function pickPhoto(container: HTMLElement) {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement
  Object.defineProperty(input, 'files', { value: [new File([new Uint8Array([1])], 'meal.jpg', { type: 'image/jpeg' })], configurable: true })
  fireEvent.change(input)
}

describe('FoodLogForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getPersonalFoods.mockResolvedValue([FOOD, BANANA])
    mocks.searchFoods.mockResolvedValue([])
    mocks.createLogs.mockResolvedValue({ created: [{}], failures: [] })
    mocks.searchParamsStr = ''
  })

  it('lists recent and favourite foods before a search, favourites first', async () => {
    render(<FoodLogForm />)
    const rows = await screen.findAllByTestId('personal-food-row')
    expect(rows.map((r) => r.textContent)).toEqual([expect.stringContaining('Greek yoghurt'), expect.stringContaining('Banana')])
  })

  it('the item sheet scales macros with the portion chips and grams', async () => {
    render(<FoodLogForm />)
    fireEvent.click((await screen.findAllByTestId('personal-food-row'))[0])
    const sheet = screen.getByTestId('food-item-sheet')
    expect(within(sheet).getByTestId('item-kcal').textContent).toBe('100')
    fireEvent.click(within(sheet).getByRole('radio', { name: '1½ servings' }))
    expect(within(sheet).getByTestId('item-kcal').textContent).toBe('150')
    expect((within(sheet).getByLabelText('Grams') as HTMLInputElement).value).toBe('255')
    fireEvent.change(within(sheet).getByLabelText('Grams'), { target: { value: '85' } })
    expect(within(sheet).getByTestId('item-kcal').textContent).toBe('50')
    expect(within(sheet).getByRole('radio', { name: '½ serving' })).toHaveAttribute('aria-checked', 'true')
  })

  it('Add to meal fills the plate pill; Log logs the plate to the meal and day from the URL', async () => {
    mocks.searchParamsStr = 'meal=dinner&date=2026-10-25'
    mocks.createLogs.mockResolvedValueOnce({ created: [{}, {}], failures: [] })
    render(<FoodLogForm />)
    fireEvent.click((await screen.findAllByTestId('personal-food-row'))[0])
    fireEvent.click(screen.getByRole('radio', { name: '2 servings' }))
    fireEvent.click(screen.getByRole('button', { name: /Add to meal/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Add Banana to your plate' }))
    expect(screen.getByTestId('food-meal-tray').textContent).toContain('2 items · 305 kcal')
    fireEvent.click(screen.getByRole('button', { name: 'Log' }))
    await waitFor(() => expect(mocks.createLogs).toHaveBeenCalledTimes(1))
    const items = mocks.createLogs.mock.calls[0][0]
    expect(items).toHaveLength(2)
    expect(items[0]).toMatchObject({ type: 'food', local_date: '2026-10-25', payload: { food_name: 'Greek yoghurt', quantity_g: 340, meal_type: 'dinner', user_food_id: 'f1', est_macros: { calories: 200 } } })
    await waitFor(() => expect(mocks.back).toHaveBeenCalled())
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Logged 2 items to Dinner')
  })

  it('a partial save keeps only what failed on the plate and says so', async () => {
    mocks.createLogs.mockResolvedValueOnce({ created: [{}], failures: [{ index: 1, error: 'x' }] })
    render(<FoodLogForm />)
    await screen.findAllByTestId('personal-food-row')
    fireEvent.click(screen.getByRole('button', { name: 'Add Greek yoghurt to your plate' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add Banana to your plate' }))
    fireEvent.click(screen.getByRole('button', { name: 'Log' }))
    expect(await screen.findByRole('alert')).toHaveTextContent("Banana didn't save. The other 1 did.")
    expect(screen.getByRole('button', { name: 'Done, 1 logged' })).toBeInTheDocument()
    expect(mocks.back).not.toHaveBeenCalled()
  })

  it('photo: one row per item with steppers, unsure items marked, edits sent through log-from-estimate', async () => {
    mocks.estimate.mockResolvedValueOnce(ESTIMATE)
    mocks.logFromEstimate.mockResolvedValueOnce({ log: { id: 'log-9' } })
    mocks.updateLog.mockResolvedValueOnce({})
    const { container } = render(<FoodLogForm />)
    pickPhoto(container)
    await screen.findByTestId('photo-result')
    expect(screen.getByText('Not sure, check this')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'More Chicken' }))
    fireEvent.click(screen.getByRole('button', { name: 'Leave out Sauce' }))
    fireEvent.click(screen.getByRole('button', { name: /^Log 1 item to/ }))
    await waitFor(() => expect(mocks.logFromEstimate).toHaveBeenCalledTimes(1))
    const [id, edits] = mocks.logFromEstimate.mock.calls[0]
    expect(id).toBe('est-1')
    expect(edits.items).toEqual([expect.objectContaining({ name: 'Chicken', quantity_g: 160, calories: 267 })])
    await waitFor(() => expect(mocks.updateLog).toHaveBeenCalledWith('log-9', { meal_type: expect.any(String) }))
    expect(mocks.back).toHaveBeenCalled()
  })

  it('photo: no food and a reading failure each get their card', async () => {
    mocks.estimate.mockResolvedValueOnce({ ...ESTIMATE, items: [], error: 'no_food_identified' })
    const { container } = render(<FoodLogForm />)
    pickPhoto(container)
    expect(await screen.findByText('I can’t see food in this one')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Search instead' }))
    mocks.estimate.mockRejectedValueOnce(new Error('500'))
    pickPhoto(container)
    expect(await screen.findByText('Photo reading is down for a minute')).toBeInTheDocument()
    mocks.estimate.mockResolvedValueOnce(ESTIMATE)
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByTestId('photo-result')).toBeInTheDocument()
  })
})
