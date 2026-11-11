import { describe, expect, it } from 'vitest'
import { repTarget, repsToRecord } from '@/lib/workout-session'

describe('rep ranges', () => {
  it('reads numbers, ranges and labels', () => {
    expect(repTarget(8)).toEqual([8, 8])
    expect(repTarget('6-8')).toEqual([6, 8])
    expect(repTarget('8–12')).toEqual([8, 12])
    expect(repTarget('12 each side')).toEqual([12, 12])
    expect(repTarget('AMRAP')).toBeNull()
  })

  it('records one number for a ranged set: typed, else last time (in or out of the range), else the bottom', () => {
    expect(repsToRecord({ actual_reps: 9, planned_reps: '6-8', previous_reps: 7 })).toBe(9)
    expect(repsToRecord({ actual_reps: null, planned_reps: '6-8', previous_reps: 7 })).toBe(7)
    expect(repsToRecord({ actual_reps: null, planned_reps: '8-12', previous_reps: 15 })).toBe(15)
    expect(repsToRecord({ actual_reps: null, planned_reps: '6-8', previous_reps: null })).toBe(6)
    expect(repsToRecord({ actual_reps: null, planned_reps: 'AMRAP', previous_reps: 14 })).toBe(14)
  })
})
