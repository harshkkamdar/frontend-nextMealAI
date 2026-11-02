import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Log } from '@/types/logs.types'

const mocks = vi.hoisted(() => ({ push: vi.fn(), refetch: vi.fn() }))

const log: Log = {
  id: 'food-1', user_id: 'u', type: 'food', source: 'manual', local_date: '2026-11-02',
  payload: { food_name: 'Yoghurt', quantity_g: 100, est_macros: { calories: 80 }, meal_type: 'breakfast' },
  created_at: '2026-11-02T08:00:00Z', updated_at: '2026-11-02T08:00:00Z',
}

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }))
vi.mock('@/hooks/use-cached-query', () => ({
  useCachedQuery: () => ({ data: { logs: [log], mealPlan: null, profile: null }, loading: false, error: null, refetch: mocks.refetch }),
}))
vi.mock('@/hooks/use-sync-refetch', () => ({ useSyncRefetch: () => {} }))
vi.mock('@/hooks/useUserTimezone', () => ({ useUserTimezone: () => 'UTC' }))
vi.mock('@/contexts/geo-screen-context', () => ({ useSetGeoScreen: () => {} }))
vi.mock('@/lib/platform/app', () => ({ haptic: vi.fn() }))
vi.mock('@/components/layout/tab-bar', () => ({ LOG_SHEET: 'log-sheet' }))
vi.mock('@/stores/ui.store', () => ({ useUIStore: { getState: () => ({ openSheet: vi.fn() }) } }))
vi.mock('@/components/shared/offline-band', () => ({ OfflineBand: () => null }))
vi.mock('@/components/layout/screen-header', () => ({ LargeTitleHeader: ({ children }: { children: React.ReactNode }) => <>{children}</> }))
vi.mock('@/components/diary/day-hero', () => ({ DayHero: () => null, DaySkeleton: () => null, FadeText: () => null }))
vi.mock('@/components/diary/meal-group', () => ({
  MealGroup: ({ items, onOpenLog }: { items: Log[]; onOpenLog: (entry: Log) => void }) => items[0]
    ? <button type="button" onClick={() => onOpenLog(items[0])}>Open Yoghurt</button>
    : null,
}))
vi.mock('@/components/diary/food-search-sheet', () => ({
  FoodSearchSheet: ({ isOpen, mode }: { isOpen: boolean; mode: string }) => isOpen && mode === 'edit' ? <button type="button">Save</button> : null,
}))
vi.mock('@/components/diary/row-actions-sheet', () => ({ RowActionsSheet: ({ open }: { open: boolean }) => open ? <div>Intermediate actions</div> : null }))
vi.mock('@/components/diary/month-view-sheet', () => ({ MonthViewSheet: () => null }))
vi.mock('@/components/shared/name-favourite-dialog', () => ({ NameFavouriteDialog: () => null }))
vi.mock('@/components/diary/copy-meal-dialog', () => ({ CopyMealDialog: () => null }))
vi.mock('@/components/diary/plan-parts', () => ({ PlanLink: () => null }))
vi.mock('@/components/shared/confirm-dialog', () => ({ ConfirmDialog: () => null }))
vi.mock('@/components/ui/fiqr/primary-button', () => ({ PrimaryButton: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button> }))
vi.mock('@/components/ui/fiqr/round-button', () => ({ RoundButton: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button> }))
vi.mock('@/lib/api/logs.api', () => ({ createLog: vi.fn(), createLogWithStatus: vi.fn(), deleteLog: vi.fn(), getLogs: vi.fn(), updateLog: vi.fn() }))
vi.mock('@/lib/api/meals.api', () => ({ copyMeal: vi.fn() }))
vi.mock('@/lib/api/favourites.api', () => ({ createFavourite: vi.fn() }))
vi.mock('@/lib/api/plans.api', () => ({ getPlans: vi.fn() }))
vi.mock('@/lib/api/profile.api', () => ({ getProfile: vi.fn() }))

import DiaryPage from '../page'

describe('Diary row editing', () => {
  it('opens the editor directly without the row actions sheet', () => {
    render(<DiaryPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Open Yoghurt' }))
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(screen.queryByText('Intermediate actions')).not.toBeInTheDocument()
  })
})
