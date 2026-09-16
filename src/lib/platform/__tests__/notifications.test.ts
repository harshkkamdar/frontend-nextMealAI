import { describe, expect, it } from 'vitest'

import { buildReminderPlan } from '@/lib/platform/notifications'

describe('buildReminderPlan', () => {
  it('returns null when notifications are disabled', () => {
    expect(
      buildReminderPlan({
        notificationsEnabled: false,
        notificationTime: '18:30',
        nextWorkoutIsToday: true,
        checkInIsToday: true,
      })
    ).toBeNull()
  })

  it('maps enabled notification settings to a reminder plan', () => {
    expect(
      buildReminderPlan({
        notificationsEnabled: true,
        notificationTime: '18:30',
        nextWorkoutIsToday: true,
        checkInIsToday: false,
      })
    ).toEqual({
      mealReminderTime: '18:30',
      workoutToday: true,
      checkInToday: false,
    })
  })

  it('omits the meal reminder when no notification time is set', () => {
    expect(
      buildReminderPlan({
        notificationsEnabled: true,
        notificationTime: null,
        nextWorkoutIsToday: false,
        checkInIsToday: true,
      })
    ).toEqual({
      workoutToday: false,
      checkInToday: true,
    })
  })
})
