import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitForElementToBeRemoved } from '@testing-library/react'
import type { Log } from '@/types/logs.types'

// Mock the logs API — must be hoisted before the component import
vi.mock('@/lib/api/logs.api', () => ({
  getLogs: vi.fn(),
  bulkDeleteLogs: vi.fn(),
}))

// Mock sonner to avoid pulling in actual toaster
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { getLogs } from '@/lib/api/logs.api'
import { LogList } from '../log-list'

const mockedGetLogs = vi.mocked(getLogs)

function makeLog(overrides: Partial<Log>): Log {
  return {
    id: overrides.id ?? 'id-1',
    user_id: 'user-1',
    type: overrides.type ?? 'food',
    payload: overrides.payload ?? ({ food_name: 'Apple' } as Log['payload']),
    source: 'manual',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

async function renderWithLogs(logs: Log[]) {
  mockedGetLogs.mockResolvedValueOnce(logs)
  render(<LogList filterType="all" />)
  // Wait for the initial loading skeleton to go away
  const skeletons = document.querySelectorAll('[aria-busy="true"], .animate-pulse')
  if (skeletons.length > 0) {
    await waitForElementToBeRemoved(() => document.querySelector('.animate-pulse'))
  }
}

describe('LogList — FB-09 icons + workout title', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // AC01.1 — typed icons render per type
  it('AC01.1 — renders a Utensils icon for food rows', async () => {
    await renderWithLogs([makeLog({ id: 'f1', type: 'food', payload: { food_name: 'Apple' } })])
    expect(await screen.findByText('Apple')).toBeInTheDocument()
    // a11y label identifies the activity type
    expect(screen.getByText('Food activity')).toBeInTheDocument()
  })

  it('AC01.1 — renders a Dumbbell icon for workout rows', async () => {
    await renderWithLogs([makeLog({ id: 'w1', type: 'workout', payload: { exercise: 'Bench Press' } })])
    expect(await screen.findByText('Bench Press')).toBeInTheDocument()
    expect(screen.getByText('Workout activity')).toBeInTheDocument()
  })

  it('AC01.1 — renders typed icons for water / weight / mood / sleep / energy', async () => {
    await renderWithLogs([
      makeLog({ id: 'wa', type: 'water', payload: { glasses: 2 } }),
      makeLog({ id: 'we', type: 'weight', payload: { weight_kg: 70 } }),
      makeLog({ id: 'mo', type: 'mood', payload: { rating: 8 } }),
      makeLog({ id: 'sl', type: 'sleep', payload: { hours: 7, quality_rating: 8 } }),
      makeLog({ id: 'en', type: 'energy', payload: { rating: 6 } }),
    ])
    // "2 glasses" appears twice (description + metric column) — use findAllByText
    const glasses = await screen.findAllByText('2 glasses')
    expect(glasses.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Water activity')).toBeInTheDocument()
    expect(screen.getByText('Weight activity')).toBeInTheDocument()
    expect(screen.getByText('Mood activity')).toBeInTheDocument()
    expect(screen.getByText('Sleep activity')).toBeInTheDocument()
    expect(screen.getByText('Energy activity')).toBeInTheDocument()
  })

  // AC02 — workout title fallback
  it('AC02.1 — workout row with exercise shows the exercise name', async () => {
    await renderWithLogs([makeLog({ id: 'w1', type: 'workout', payload: { exercise: 'Bench Press' } })])
    expect(await screen.findByText('Bench Press')).toBeInTheDocument()
  })

  it('AC02.2 — workout session-completion row shows "{day_name} completed"', async () => {
    await renderWithLogs([
      makeLog({
        id: 'w2',
        type: 'workout',
        // session-completion payload shape from backend /v1/workout-sessions/:id/complete
        payload: {
          session_id: 'sess-1',
          day_name: 'Day 1: Chest',
          exercises_completed: 4,
          total_exercises: 5,
          duration_min: 42,
        } as Log['payload'],
      }),
    ])
    expect(await screen.findByText('Day 1: Chest completed')).toBeInTheDocument()
  })

  it('AC02.3 — workout row with no exercise or day_name falls back to "Workout completed"', async () => {
    await renderWithLogs([
      makeLog({
        id: 'w3',
        type: 'workout',
        payload: { duration_min: 10 } as Log['payload'],
      }),
    ])
    expect(await screen.findByText('Workout completed')).toBeInTheDocument()
  })

  it('AC02.4 — workout row never renders an empty title', async () => {
    await renderWithLogs([
      makeLog({ id: 'w4', type: 'workout', payload: {} as Log['payload'] }),
    ])
    // Wait for load, then inspect every workout row's title paragraph
    await screen.findByText('Workout completed')
    const titles = document.querySelectorAll('p.text-sm.font-medium.truncate')
    titles.forEach((el) => {
      expect(el.textContent?.trim()).not.toBe('')
    })
  })

  // AC04.1 — food regression check: name + kcal
  it('AC04.1 — food rows still render name and kcal metric', async () => {
    await renderWithLogs([
      makeLog({
        id: 'f2',
        type: 'food',
        payload: { food_name: 'Oatmeal', est_macros: { calories: 320 } },
      }),
    ])
    expect(await screen.findByText('Oatmeal')).toBeInTheDocument()
    expect(screen.getByText('320 kcal')).toBeInTheDocument()
  })
})
