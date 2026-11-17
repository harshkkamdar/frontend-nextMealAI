import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ getProfile: vi.fn(), updateProfile: vi.fn(), getPlans: vi.fn() }))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/components/shared/offline-band', () => ({ OfflineBand: () => null }))
vi.mock('@/lib/api/profile.api', () => ({ getProfile: mocks.getProfile, updateProfile: mocks.updateProfile }))
vi.mock('@/lib/api/plans.api', () => ({ getPlans: mocks.getPlans }))

import { ProfileForm } from '../profile-form'

// Mirrors profile.controller.ts getProfile: the profiles row plus daily_targets_missing_fields (the test account's numbers).
const profile = {
  id: 'u1', full_name: 'George', current_weight_kg: 92, target_weight_kg: 85, height_cm: 180, dob: '1990-01-01', sex: 'male',
  activity_level: 'moderate', primary_goal: 'fat_loss', dietary_style: 'omnivore', equipment: [], injuries: [], timezone: 'Australia/Sydney',
  daily_calorie_target: 2000, daily_protein_g: 190, daily_carbs_g: 153, daily_fat_g: 70,
  created_at: '2026-09-01T00:00:00.000Z', updated_at: '2026-11-10T00:00:00.000Z', daily_targets_missing_fields: [],
}
// Mirrors plans.controller.ts getPlans (type=meal, active_only): a plans row whose content pins its own daily_targets.
const activeMealPlan = {
  id: 'p-meal', user_id: 'u1', type: 'meal', status: 'active', version: 2, previous_version_id: 'p-meal-0',
  start_date: '2026-11-01', end_date: '2026-11-30', generated_by: 'ai', approved_at: null, deleted_at: null,
  content: { name: 'Cut', days: [], daily_targets: { calories: 2600, protein: 180, carbs: 280, fat: 80 } },
  created_at: '2026-11-01T00:00:00.000Z', updated_at: '2026-11-01T00:00:00.000Z',
}

// The version it replaced, with the targets it had then.
const supersededMealPlan = { ...activeMealPlan, id: 'p-meal-0', status: 'superseded', version: 1, previous_version_id: null, content: { ...activeMealPlan.content, daily_targets: { calories: 2400, protein: 170, carbs: 250, fat: 75 } } }
// Honours type and active_only like the backend's filter.
const plansApi = (plans: object[]) => ({ type, active_only }: { type?: string; active_only?: boolean } = {}) =>
  Promise.resolve((plans as typeof activeMealPlan[]).filter((plan) => (!type || plan.type === type) && (!active_only || plan.status === 'active')))

const value = (label: string) => (screen.getByLabelText(label) as HTMLInputElement).value

describe('Profile daily targets', () => {
  beforeEach(() => {
    mocks.getProfile.mockReset().mockResolvedValue(profile)
    mocks.getPlans.mockReset().mockImplementation(plansApi([activeMealPlan, supersededMealPlan]))
    mocks.updateProfile.mockReset().mockResolvedValue(profile)
  })

  it("shows the active nutrition plan's targets, the numbers Home and Food show", async () => {
    render(<ProfileForm onBack={() => {}} />)
    await screen.findByLabelText('Calories')
    expect([value('Calories'), value('Protein'), value('Carbs'), value('Fat')]).toEqual(['2600', '180', '280', '80'])
  })

  it("falls back to the profile's targets without a plan", async () => {
    mocks.getPlans.mockImplementation(plansApi([supersededMealPlan]))
    render(<ProfileForm onBack={() => {}} />)
    await screen.findByLabelText('Calories')
    expect([value('Calories'), value('Protein'), value('Carbs'), value('Fat')]).toEqual(['2000', '190', '153', '70'])
  })

  it('saves all four shown targets when one is changed, so the plan keeps the untouched ones', async () => {
    render(<ProfileForm onBack={() => {}} />)
    fireEvent.change(await screen.findByLabelText('Calories'), { target: { value: '2500' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(mocks.updateProfile).toHaveBeenCalled())
    expect(mocks.updateProfile.mock.calls[0][0]).toMatchObject({ daily_calorie_target: 2500, daily_protein_g: 180, daily_carbs_g: 280, daily_fat_g: 80 })
  })

  it('sends no targets when none was touched', async () => {
    render(<ProfileForm onBack={() => {}} />)
    await screen.findByLabelText('Calories')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(mocks.updateProfile).toHaveBeenCalled())
    expect(mocks.updateProfile.mock.calls[0][0]).not.toHaveProperty('daily_calorie_target')
  })
})
