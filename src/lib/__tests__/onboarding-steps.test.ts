import { describe, expect, it } from 'vitest'
import { ageOn, nextInModule, previousRoute, progressOf, stepsFor, visibleSteps } from '../onboarding-steps'

describe('onboarding steps', () => {
  it('skips target weight and its reflection when the goal is maintenance', () => {
    const ids = visibleSteps('maintenance').map((s) => s.id)
    expect(ids).not.toContain('target')
    expect(ids).not.toContain('reflection')
    expect(visibleSteps('fat_loss').map((s) => s.id)).toContain('target')
  })

  it('ends a module so it can be submitted', () => {
    expect(nextInModule('name', null)).toBe('sex')
    expect(nextInModule('height', null)).toBeNull()
    expect(nextInModule('injuries', 'fat_loss')).toBeNull()
    expect(nextInModule('meals', 'fat_loss')).toBeNull()
  })

  it('goes back across module boundaries and not before the first step', () => {
    expect(previousRoute('name', null)).toBeNull()
    expect(previousRoute('goal', null)).toBe('/onboarding/personal?q=height')
    expect(previousRoute('allergies', 'maintenance')).toBe('/onboarding/nutrition?q=weight')
  })

  it('reports honest progress that never reaches 1 before consent', () => {
    expect(progressOf('name', null)).toBeGreaterThan(0)
    expect(progressOf('meals', null)).toBeLessThan(1)
    expect(progressOf('meals', 'maintenance')).toBeLessThan(1)
    expect(stepsFor('personal', null)).toHaveLength(4)
  })

  it('computes age from a date of birth', () => {
    expect(ageOn('1990-10-25', new Date(2026, 9, 24))).toBe(35)
    expect(ageOn('1990-10-24', new Date(2026, 9, 24))).toBe(36)
  })
})
