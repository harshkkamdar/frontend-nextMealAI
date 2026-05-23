/**
 * FB-R6-S2-v2.5 · UserDetailSheet
 *
 * Tests the slide-out drilldown: closed-vs-open, loading state, error state,
 * all 8 sections rendering with seeded data, ESC-to-close, backdrop click.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  getSummary: vi.fn(),
}))

vi.mock('@/lib/api/admin.api', () => ({
  getAdminUserSummary: (...args: unknown[]) => mocks.getSummary(...args),
}))

import { UserDetailSheet } from '@/components/admin/UserDetailSheet'
import type { AdminUserSummary } from '@/types/admin.types'

const SUMMARY: AdminUserSummary = {
  user: {
    id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    email: 'alice@example.com',
    display_name: 'Alice Test',
    created_at: '2026-04-01T00:00:00.000Z',
    last_active: '2026-05-21',
    timezone: 'America/Los_Angeles',
  },
  profile: {
    dob: '1990-06-15',
    sex: 'female',
    height_cm: 168,
    current_weight_kg: 65,
    target_weight_kg: 60,
    primary_goal: 'fat_loss',
    activity_level: 'moderate',
    experience_level: 'intermediate',
    equipment: ['Dumbbells', 'Bench'],
    injuries: ['Lower back'],
    dietary_style: 'omnivore',
    allergies: ['Peanuts'],
    meals_per_day: 3,
    workout_frequency: 4,
    body_fat_pct: 24,
  },
  onboarding: { personal: true, fitness: true, nutrition: true },
  targets: { calories: 1800, protein_g: 130, carbs_g: 200, fat_g: 60 },
  active_meal_plan: {
    id: 'plan-meal-1',
    name: 'Cut phase',
    daily_targets: { calories: 1800, protein_g: 130, carbs_g: 200, fat_g: 60 },
    days_count: 7,
    start_date: '2026-05-15',
  },
  active_workout_plan: {
    id: 'plan-workout-1',
    name: 'PPL 6-day',
    days_count: 6,
    current_position: 2,
    start_date: '2026-05-15',
  },
  in_progress_workout: {
    id: 'sess-1',
    plan_day_index: 2,
    day_name: 'Pull Day',
    started_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    total_volume_kg: 2400,
    exercises_completed: 3,
    exercises_total: 5,
  },
  recent_logs_7d: [
    {
      id: 'log-1',
      type: 'food',
      local_date: '2026-05-21',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      payload: { meal_type: 'lunch', macros: { total_kcal: 540 } },
    },
    {
      id: 'log-2',
      type: 'weight',
      local_date: '2026-05-21',
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      payload: { weight_kg: 64.8 },
    },
  ],
  recent_workout_sessions_7d: [
    {
      id: 'sess-prev',
      plan_day_index: 1,
      day_name: 'Push Day',
      status: 'completed',
      started_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
      duration_minutes: 65,
      total_volume_kg: 3100,
      exercises_completed: 6,
      exercises_total: 6,
    },
  ],
  recent_chat_7d: [
    {
      id: 'msg-1',
      session_id: 'sess-aaaa-bbbb',
      role: 'user',
      content: 'What should I eat for breakfast?',
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      tool_names: [],
      tokens_used: null,
    },
    {
      id: 'msg-2',
      session_id: 'sess-aaaa-bbbb',
      role: 'assistant',
      content: 'How about oats with berries?',
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000 + 5000).toISOString(),
      tool_names: ['get_today_summary'],
      tokens_used: 120,
    },
  ],
  recent_attachments_7d: [
    {
      id: 'att-1',
      signed_url: 'https://example.test/photo.jpg',
      mime_type: 'image/jpeg',
      width: 800,
      height: 600,
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
  ],
}

describe('UserDetailSheet — FB-R6-S2-v2.5', () => {
  beforeEach(() => {
    mocks.getSummary.mockReset()
  })

  it('renders nothing when userId is null', () => {
    render(<UserDetailSheet userId={null} onClose={() => {}} />)
    expect(screen.queryByTestId('user-detail-sheet')).not.toBeInTheDocument()
  })

  it('shows a loading state while the request is in flight', () => {
    mocks.getSummary.mockReturnValueOnce(new Promise(() => {})) // never resolves
    render(<UserDetailSheet userId="aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" onClose={() => {}} />)
    expect(screen.getByTestId('user-detail-sheet')).toBeInTheDocument()
    expect(screen.getByText(/loading user summary/i)).toBeInTheDocument()
  })

  it('renders all 8 sections when the request succeeds', async () => {
    mocks.getSummary.mockResolvedValueOnce(SUMMARY)
    render(<UserDetailSheet userId="aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" onClose={() => {}} />)

    await waitFor(() => expect(screen.getByTestId('section-identity')).toBeInTheDocument())
    expect(screen.getByTestId('section-profile')).toBeInTheDocument()
    expect(screen.getByTestId('section-targets')).toBeInTheDocument()
    expect(screen.getByTestId('section-plans')).toBeInTheDocument()
    expect(screen.getByTestId('section-in-progress')).toBeInTheDocument()
    expect(screen.getByTestId('section-activity')).toBeInTheDocument()
    expect(screen.getByTestId('section-chat')).toBeInTheDocument()
    expect(screen.getByTestId('section-photos')).toBeInTheDocument()
  })

  it('header shows the email of the loaded user', async () => {
    mocks.getSummary.mockResolvedValueOnce(SUMMARY)
    render(<UserDetailSheet userId="aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" onClose={() => {}} />)
    await waitFor(() =>
      expect(screen.getByTestId('user-sheet-title')).toHaveTextContent('alice@example.com')
    )
  })

  it('renders the chat content (Ved-approved policy)', async () => {
    mocks.getSummary.mockResolvedValueOnce(SUMMARY)
    render(<UserDetailSheet userId="aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" onClose={() => {}} />)
    // Most-recent session is auto-expanded
    await waitFor(() =>
      expect(screen.getByText('What should I eat for breakfast?')).toBeInTheDocument()
    )
    expect(screen.getByText('How about oats with berries?')).toBeInTheDocument()
  })

  it('renders the error surface when the request fails', async () => {
    mocks.getSummary.mockRejectedValueOnce(new Error('500 server error'))
    render(<UserDetailSheet userId="aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" onClose={() => {}} />)
    await waitFor(() => expect(screen.getByText(/couldn't load user/i)).toBeInTheDocument())
    expect(screen.getByText(/500 server error/i)).toBeInTheDocument()
  })

  it('ESC key invokes onClose', async () => {
    mocks.getSummary.mockResolvedValueOnce(SUMMARY)
    const onClose = vi.fn()
    render(<UserDetailSheet userId="aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" onClose={onClose} />)
    await waitFor(() => expect(screen.getByTestId('user-detail-sheet')).toBeInTheDocument())
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('backdrop click invokes onClose', async () => {
    mocks.getSummary.mockResolvedValueOnce(SUMMARY)
    const onClose = vi.fn()
    render(<UserDetailSheet userId="aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" onClose={onClose} />)
    await waitFor(() => expect(screen.getByTestId('user-detail-backdrop')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('user-detail-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('refetches when userId changes', async () => {
    mocks.getSummary.mockResolvedValueOnce(SUMMARY)
    const { rerender } = render(
      <UserDetailSheet userId="aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" onClose={() => {}} />
    )
    await waitFor(() => expect(mocks.getSummary).toHaveBeenCalledTimes(1))

    mocks.getSummary.mockResolvedValueOnce({
      ...SUMMARY,
      user: { ...SUMMARY.user, id: 'newid', email: 'bob@example.com' },
    })
    rerender(<UserDetailSheet userId="cccccccc-dddd-eeee-ffff-000000000000" onClose={() => {}} />)
    await waitFor(() => expect(mocks.getSummary).toHaveBeenCalledTimes(2))
  })

  it('passes the userId to getAdminUserSummary', async () => {
    mocks.getSummary.mockResolvedValueOnce(SUMMARY)
    render(<UserDetailSheet userId="aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" onClose={() => {}} />)
    await waitFor(() =>
      expect(mocks.getSummary).toHaveBeenCalledWith('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')
    )
  })
})
