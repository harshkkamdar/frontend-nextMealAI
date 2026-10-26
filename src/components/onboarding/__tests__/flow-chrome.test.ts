import { describe, expect, it } from 'vitest'
import { segmentsOf } from '../onboarding-flow'
import { questionScene, SCENES } from '../aurora'

describe('segmentsOf', () => {
  it('fills the section bars: earlier sections full, the current one up to this step, later ones empty', () => {
    expect(segmentsOf('name', null)).toEqual([0.25, 0, 0])
    expect(segmentsOf('height', null)).toEqual([1, 0, 0])
    expect(segmentsOf('goal', null)).toEqual([1, 1 / 6, 0])
    expect(segmentsOf('meals', 'fat_loss')).toEqual([1, 1, 1])
  })

  it('counts only the steps this person sees: no target or reflection when maintaining', () => {
    expect(segmentsOf('weight', 'maintenance')).toEqual([1, 1, 1 / 6])
    expect(segmentsOf('weight', 'fat_loss')).toEqual([1, 1, 1 / 8])
  })
})

describe('questionScene', () => {
  it('moves the Aurora on every step and only names real scenes', () => {
    for (let i = 0; i < 18; i++) {
      expect(SCENES[questionScene(i)]).toBeDefined()
      expect(questionScene(i)).not.toBe(questionScene(i + 1))
    }
  })
})
