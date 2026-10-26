import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import type { UserFood } from '@/types/foods.types'

const mocks = vi.hoisted(() => ({ push: vi.fn(), getPersonalFoods: vi.fn(), logWithUndo: vi.fn(async () => true), online: true }))

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }))
vi.mock('@/lib/api/foods.api', () => ({ getPersonalFoods: () => mocks.getPersonalFoods() }))
vi.mock('@/components/dashboard/log-with-undo', () => ({ logWithUndo: (...args: unknown[]) => mocks.logWithUndo(...(args as [])) }))
vi.mock('@/lib/platform/network', () => ({ useOnline: () => mocks.online }))
vi.mock('@/lib/depth', () => ({ useSheetDepth: () => ({ drag: vi.fn(), settle: vi.fn() }) }))

import { LogSheet } from '@/components/layout/log-sheet'
import { LOG_SHEET } from '@/components/layout/tab-bar'
import { useUIStore } from '@/stores/ui.store'

const food = (id: string, name: string, lastUsed: string): UserFood => ({
  id, user_id: 'u', name, serving_size_g: 250, source: 'manual', is_favorite: false, use_count: 2,
  macros_per_serving: { calories: 130 }, created_at: '2026-10-01T00:00:00Z', last_used_at: lastUsed,
})

describe('LogSheet (journey-log A2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.online = true
    act(() => useUIStore.getState().closeSheet())
  })

  it('shows Log again newest first and logs a tap to the current meal', async () => {
    mocks.getPersonalFoods.mockResolvedValue([food('a', 'Banana', '2026-10-20T00:00:00Z'), food('b', 'Flat white', '2026-10-26T00:00:00Z')])
    render(<LogSheet />)
    act(() => useUIStore.getState().openSheet(LOG_SHEET))
    const first = await screen.findByRole('button', { name: /^Log Flat white again/ })
    expect(screen.getAllByRole('button', { name: /again,/ })[1]).toHaveAccessibleName(/^Log Banana again/)
    fireEvent.click(first)
    const [input, message] = mocks.logWithUndo.mock.calls[0] as unknown as [{ payload: { food_name: string; meal_type: string; user_food_id: string } }, string]
    expect(input.payload).toMatchObject({ food_name: 'Flat white', user_food_id: 'b' })
    expect(message).toMatch(/^Logged Flat white to (Breakfast|Lunch|Snack|Dinner)$/)
    expect(useUIStore.getState().activeSheet).toBeNull()
  })

  it('first run explains Log again; offline marks Photo and Menu as needing a connection', async () => {
    mocks.getPersonalFoods.mockResolvedValue([])
    mocks.online = false
    render(<LogSheet />)
    act(() => useUIStore.getState().openSheet(LOG_SHEET))
    expect(await screen.findByText(/Foods you log land here/)).toBeInTheDocument()
    expect(screen.getByText('Offline. Logs save here and send when you are back.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
    expect(mocks.push).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Water' }))
    expect(mocks.push).toHaveBeenCalledWith('/logs/new/water')
  })
})
