import { describe, expect, it } from 'vitest'
import { bestText, compareExercise, deltaText, formatLast, nextOpenSet, receiptLine, stepReps, stepWeight, upNextText } from '../train-data'
import type { SessionExercise, SetData } from '@/types/workout-session.types'

const s = (done: boolean, kg: number | null, reps: number, prev?: [number | null, number]): SetData => ({
  set_number: 1, planned_reps: reps, planned_weight_kg: kg, actual_reps: done ? reps : null, actual_weight_kg: done ? kg : null,
  completed: done, completed_at: null, previous_weight_kg: prev?.[0] ?? null, previous_reps: prev?.[1] ?? null,
})
const ex = (name: string, sets: SetData[]): SessionExercise => ({ name, muscle_group: null, planned_sets: sets.length, planned_reps: 8, rest_seconds: 90, status: 'pending', sets })

describe('live session helpers', () => {
  it('formats the Last column as kg × reps', () => {
    expect(formatLast({ previous_weight_kg: 72.5, previous_reps: 8 })).toBe('72.5 × 8')
    expect(formatLast({ previous_weight_kg: null, previous_reps: 12 })).toBe('BW × 12')
    expect(formatLast({ previous_weight_kg: 60, previous_reps: null })).toBe('—')
  })

  it('steps weight by 2.5 kg and reps by 1 within bounds', () => {
    expect(stepWeight(72.5, 1)).toBe(75)
    expect(stepWeight(1, -1)).toBe(0)
    expect(stepWeight(null, 1)).toBe(2.5)
    expect(stepReps(0, -1)).toBe(0)
    expect(stepReps(200, 1)).toBe(200)
  })

  it('finds the next open set on this exercise, then later, then earlier ones', () => {
    const list = [ex('A', [s(false, 20, 8)]), ex('B', [s(true, 20, 8), s(false, 20, 8)]), ex('C', [s(true, 20, 8)])]
    expect(nextOpenSet(list, 1)).toEqual({ exercise: 1, set: 1 })
    expect(nextOpenSet(list, 2)).toEqual({ exercise: 0, set: 0 })
    expect(nextOpenSet([ex('C', [s(true, 20, 8)])], 0)).toBeNull()
    expect(upNextText(list, 1)).toBe('set 2 · 20 kg × 8')
    expect(upNextText(list, 2)).toBe('A, set 1 · 20 kg × 8')
    expect(upNextText(list, 0)).toBe('A, set 1 · 20 kg × 8')
  })

  it('compares the best set with last time', () => {
    const up = compareExercise(ex('Bench', [s(true, 75, 8, [72.5, 8]), s(true, 72.5, 8, [72.5, 8]), s(false, 72.5, 8, [72.5, 7])]))
    expect(up.best).toEqual({ kg: 75, reps: 8 })
    expect(up.last).toEqual({ kg: 72.5, reps: 8 })
    expect(up.volume).toBe(75 * 8 + 72.5 * 8)
    expect(up.lastVolume).toBe(72.5 * 8 * 2 + 72.5 * 7)
    expect(deltaText(up)).toEqual({ text: '+2.5 kg', up: true })
    expect(bestText(up)).toBe('Best 75 kg × 8 · 2 sets')

    expect(deltaText(compareExercise(ex('Row', [s(true, 50, 10, [50, 8])])))).toEqual({ text: '+2 reps', up: true })
    expect(deltaText(compareExercise(ex('Row', [s(true, 50, 8, [50, 8])])))).toEqual({ text: 'Same as last', up: false })
    expect(deltaText(compareExercise(ex('Row', [s(true, 47.5, 8, [50, 8])])))).toEqual({ text: '−2.5 kg', up: false })
    expect(deltaText(compareExercise(ex('New', [s(true, 20, 8)])))).toEqual({ text: 'First time', up: false })
    expect(deltaText(compareExercise(ex('Skip', [s(false, 20, 8, [20, 8])])))).toEqual({ text: 'Skipped', up: false })
  })

  it('writes Geo’s receipt line from the biggest jump', () => {
    const a = compareExercise(ex('Bench', [s(true, 75, 8, [72.5, 8])]))
    const b = compareExercise(ex('Squat', [s(true, 105, 5, [100, 5])]))
    const same = compareExercise(ex('Row', [s(true, 50, 8, [50, 8])]))
    expect(receiptLine([a, b, same])).toBe('Squat moved up 5 kg on last time. 1 more lift went up too.')
    expect(receiptLine([same])).toMatch(/^Every lift held/)
    expect(receiptLine([compareExercise(ex('New', [s(true, 20, 8)]))])).toMatch(/^First time/)
  })
})
