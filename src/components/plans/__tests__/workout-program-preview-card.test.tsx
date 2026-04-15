import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { WorkoutProgramContent } from '@/types/plans.types'

// Mocks MUST be declared before the component import.
const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/api/plans.api', () => ({
  createPlan: vi.fn(),
  activatePlan: vi.fn(),
}))

import { createPlan, activatePlan } from '@/lib/api/plans.api'
import { WorkoutProgramPreviewCard } from '../workout-program-preview-card'

const mockedCreate = vi.mocked(createPlan)
const mockedActivate = vi.mocked(activatePlan)

const program: WorkoutProgramContent = {
  days: [
    {
      date: '',
      name: 'Day 1 — Push',
      exercises: [
        { name: 'Bench Press', sets: 5, reps: 5, rest_seconds: 180 },
        { name: 'Lateral Raise', sets: 3, reps: 12, rest_seconds: 75 },
      ],
    },
    {
      date: '',
      name: 'Day 2 — Pull',
      exercises: [{ name: 'Barbell Row', sets: 4, reps: 6, rest_seconds: 180 }],
    },
  ],
}

describe('FB-15 WorkoutProgramPreviewCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders day count, exercise count, and confidence', () => {
    render(<WorkoutProgramPreviewCard program={program} confidence={0.9} />)
    expect(screen.getByTestId('program-summary')).toHaveTextContent('2 days')
    expect(screen.getByTestId('program-summary')).toHaveTextContent('3 exercises')
    expect(screen.getByTestId('confidence-badge')).toHaveTextContent('High confidence')
    expect(screen.getByTestId('confidence-badge')).toHaveTextContent('90%')
    const days = screen.getByTestId('day-list')
    expect(days).toHaveTextContent('Day 1 — Push')
    expect(days).toHaveTextContent('Day 2 — Pull')
  })

  it('Accept calls createPlan + activatePlan and routes to plan detail', async () => {
    mockedCreate.mockResolvedValueOnce({ id: 'plan-123' } as any)
    mockedActivate.mockResolvedValueOnce(undefined)
    const onAccept = vi.fn()
    render(
      <WorkoutProgramPreviewCard program={program} confidence={0.9} onAccept={onAccept} />
    )
    fireEvent.click(screen.getByTestId('preview-accept'))
    await waitFor(() => expect(mockedCreate).toHaveBeenCalledTimes(1))
    expect(mockedCreate).toHaveBeenCalledWith({
      type: 'workout',
      content: program,
    })
    await waitFor(() => expect(mockedActivate).toHaveBeenCalledWith('plan-123'))
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/plans/plan-123'))
    expect(onAccept).toHaveBeenCalledWith('plan-123')
  })

  it('Edit routes to the manual builder with a prefill query param', () => {
    render(<WorkoutProgramPreviewCard program={program} confidence={0.7} />)
    fireEvent.click(screen.getByTestId('preview-edit'))
    expect(pushMock).toHaveBeenCalledTimes(1)
    const url = pushMock.mock.calls[0][0] as string
    expect(url.startsWith('/plans/new/workout?prefill=')).toBe(true)
    // The prefill query must decode back to the original program
    const encoded = decodeURIComponent(url.split('prefill=')[1])
    const decoded = JSON.parse(
      typeof window !== 'undefined'
        ? decodeURIComponent(escape(atob(encoded)))
        : Buffer.from(encoded, 'base64').toString('utf8')
    )
    expect(decoded.days).toHaveLength(2)
  })

  it('Discard dismisses the card', () => {
    const onDiscard = vi.fn()
    render(
      <WorkoutProgramPreviewCard program={program} confidence={0.5} onDiscard={onDiscard} />
    )
    expect(screen.getByTestId('workout-program-preview-card')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('preview-discard'))
    expect(screen.queryByTestId('workout-program-preview-card')).not.toBeInTheDocument()
    expect(onDiscard).toHaveBeenCalledTimes(1)
  })
})
