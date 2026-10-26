import { describe, expect, it } from 'vitest'
import { clockHMS, completedSessions, formatExDetail, plannedDates, sessionVolumeKg, weekVolume } from '../train-data'
import type { WorkoutPlanDay } from '@/types/plans.types'
import { weekDays } from '@/components/ui/fiqr/week-strip'
import { leadIndex } from '../digit-tiles'
import { muscleCaption, musclesFor } from '../muscle-map'
import type { SessionExercise, WorkoutSession } from '@/types/workout-session.types'

const set = (completed: boolean, kg: number | null, reps: number | null) => ({ set_number: 1, planned_reps: 10, planned_weight_kg: null, actual_reps: reps, actual_weight_kg: kg, completed, completed_at: null })
const session = (id: string, completedAt: string | null, kg: number, status: WorkoutSession['status'] = 'completed') => ({ id, completed_at: completedAt, total_volume_kg: kg, status } as WorkoutSession)

describe('train data helpers', () => {
  it('plannedDates walks the cycle from the next workout and skips rest days', () => {
    const cycle = [{ name: 'A' }, { name: 'B' }, { name: 'Rest', is_rest_day: true }, { name: 'C' }] as WorkoutPlanDay[]
    // Next is C (index 3) today: tomorrow A, then B, then rest.
    expect([...plannedDates(cycle, 3, '2026-10-29', false, 4)]).toEqual(['2026-10-30', '2026-10-31', '2026-11-02'])
    // Today already done: C moves to tomorrow.
    expect([...plannedDates(cycle, 3, '2026-10-29', true, 2)]).toEqual(['2026-10-30', '2026-10-31'])
    expect(plannedDates([], 0, '2026-10-29', false).size).toBe(0)
  })

  it('weekVolume buckets completed sessions by local day and ignores other weeks', () => {
    const days = weekDays('2026-10-28', 1)
    // 19:00 UTC on Monday is Tuesday in Sydney.
    const sessions = [session('a', '2026-10-26T19:00:00Z', 4000), session('b', '2026-10-27T01:00:00Z', 1000), session('c', '2026-10-20T01:00:00Z', 9000)]
    expect(weekVolume(sessions, days, 'Australia/Sydney')).toEqual([0, 5000, 0, 0, 0, 0, 0])
  })

  it('completedSessions keeps finished sessions, newest first', () => {
    const list = completedSessions([session('old', '2026-10-01T00:00:00Z', 1), session('live', null, 0, 'in_progress'), session('new', '2026-10-20T00:00:00Z', 1)])
    expect(list.map((s) => s.id)).toEqual(['new', 'old'])
  })

  it('sessionVolumeKg counts only ticked sets', () => {
    const exercises = [{ sets: [set(true, 60, 10), set(false, 60, 10), set(true, null, 12)] }] as unknown as SessionExercise[]
    expect(sessionVolumeKg(exercises)).toBe(600)
  })

  it('clockHMS pads and caps hours', () => {
    expect(clockHMS(532)).toBe('00:08:52')
    expect(clockHMS(3725)).toBe('01:02:05')
    expect(clockHMS(-5)).toBe('00:00:00')
    expect(clockHMS(400000)).toBe('99:06:40')
  })

  it('formatExDetail reads sets, reps and rest', () => {
    expect(formatExDetail({ sets: 3, reps: 10, rest_seconds: 90 })).toBe('3 × 10 · 1m 30s rest')
    expect(formatExDetail({ sets: 4 })).toBe('4 sets')
    expect(formatExDetail({})).toBe('')
  })

  it('leadIndex dims leading zeros but never the last digit', () => {
    expect(leadIndex('00:08:52')).toBe(4)
    expect(leadIndex('00:00:00')).toBe(7)
    expect(leadIndex('01:30')).toBe(1)
  })
})

describe('muscle map mapping', () => {
  it('uses the API muscle group first', () => {
    expect(musclesFor('Chest', 'Anything')).toEqual(['chest'])
    expect(musclesFor('lats, biceps')).toEqual(['upper-back', 'biceps'])
  })

  it('falls back to the lift name, most specific first', () => {
    expect(musclesFor(null, 'Romanian deadlift')).toContain('hamstring')
    expect(musclesFor(null, 'Barbell back squat')).toEqual(['quadriceps', 'gluteal'])
    expect(musclesFor(null, 'Incline dumbbell bench press')).toContain('chest')
    expect(musclesFor(null, 'Lat pulldown')).toContain('upper-back')
    expect(musclesFor(null, 'Zercher carry to the moon')).toEqual([])
  })

  it('writes a readable caption', () => {
    expect(muscleCaption('chest')).toBe('Chest')
    expect(muscleCaption(null, 'Overhead press')).toBe('Shoulders · Triceps')
    expect(muscleCaption(null, 'Mystery')).toBe('')
  })
})
