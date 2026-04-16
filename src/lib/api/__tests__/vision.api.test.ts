import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/api/client', () => ({
  apiFetch: vi.fn(),
}))

import { apiFetch } from '@/lib/api/client'
import {
  extractWorkoutProgram,
  isLikelyWorkoutProgramPrompt,
} from '@/lib/api/vision.api'

const mockedApiFetch = vi.mocked(apiFetch)

describe('FB-15 extractWorkoutProgram', () => {
  beforeEach(() => {
    mockedApiFetch.mockReset()
  })

  it('POSTs the base64 image to the backend', async () => {
    mockedApiFetch.mockResolvedValueOnce({
      program: { days: [] },
      confidence: 0.9,
    })
    const result = await extractWorkoutProgram('base64data')
    expect(mockedApiFetch).toHaveBeenCalledWith('/v1/vision/workout-program', {
      method: 'POST',
      body: { image: 'base64data' },
    })
    expect(result.confidence).toBe(0.9)
  })

  it('propagates errors from apiFetch', async () => {
    mockedApiFetch.mockRejectedValueOnce(new Error('boom'))
    await expect(extractWorkoutProgram('x')).rejects.toThrow('boom')
  })
})

describe('FB-15 isLikelyWorkoutProgramPrompt', () => {
  it.each([
    ['Here is my workout program', true],
    ['Can you save this routine?', true],
    ['Add this split to my plan', true],
    ['Here is my 4-day workout', true],
    ['Extract the training', true],
    ['Log my lunch', false],
    ['', false],
  ])('isLikelyWorkoutProgramPrompt(%j) → %s', (input, expected) => {
    if (expected) {
      expect(isLikelyWorkoutProgramPrompt(input)).toBe(true)
    } else {
      expect(isLikelyWorkoutProgramPrompt(input)).toBe(false)
    }
  })
})
