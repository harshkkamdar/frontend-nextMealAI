import { describe, expect, it } from 'vitest'

import { appliedTargets, changeSentence, proposalChanges, savedTargets } from '../apply-targets'

describe('appliedTargets', () => {
  it('holds fat at 28% of calories and gives carbs the rest, like the backend', () => {
    // 2125 kcal: fat round(595 / 9) = 66; carbs round((2125 - 660 - 594) / 4) = 218
    expect(appliedTargets(2125, 165)).toEqual({ calories: 2125, protein: 165, carbs: 218, fat: 66 })
  })

  it('never returns negative carbs when protein alone passes the calories', () => {
    expect(appliedTargets(1000, 300).carbs).toBe(0)
  })
})

describe('proposalChanges', () => {
  const targets = { calories: 1950, protein_g: 140 }
  it('is false on a hold or no proposal', () => {
    expect(proposalChanges({ targets, proposal: null })).toBe(false)
    expect(proposalChanges({ targets, proposal: { new_calories: 1950, new_protein_g: 140, calorie_change_pct: 0, direction: 'hold' } })).toBe(false)
  })
  it('is true when calories or protein move', () => {
    expect(proposalChanges({ targets, proposal: { new_calories: 2050, new_protein_g: 140, calorie_change_pct: 5, direction: 'up' } })).toBe(true)
    expect(proposalChanges({ targets, proposal: { new_calories: 1950, new_protein_g: 150, calorie_change_pct: 0, direction: 'up' } })).toBe(true)
  })
  it('is false when an up or down proposal equals the current targets', () => {
    expect(proposalChanges({ targets, proposal: { new_calories: 1950, new_protein_g: 140, calorie_change_pct: 0, direction: 'up' } })).toBe(false)
  })
})

describe('savedTargets', () => {
  const proposal = { new_calories: 2050, new_protein_g: 150 }
  it('uses the numbers the backend answered with', () => {
    expect(savedTargets({ applied: true, new_calorie_target: 2000, new_protein_target_g: 145 }, proposal, 140)?.calories).toBe(2000)
  })
  it('falls back to the proposal when the answer has no numbers', () => {
    expect(savedTargets({ applied: true }, proposal, 140)).toEqual(appliedTargets(2050, 150))
    expect(savedTargets(undefined, proposal, 140)).toEqual(appliedTargets(2050, 150))
  })
  it('keeps the current protein when the backend changes calories only', () => {
    expect(savedTargets({ applied: true, new_calorie_target: 2000, new_protein_target_g: null }, proposal, 140)?.protein).toBe(140)
  })
  it('is null when the backend applied nothing', () => {
    expect(savedTargets({ applied: false, new_calorie_target: null }, proposal, 140)).toBeNull()
  })
})

describe('changeSentence', () => {
  const current = { calories: 2300, protein: 165, carbs: 248, fat: 72 }
  it('names what comes down, what goes up and what stays, then the plan', () => {
    expect(changeSentence(current, { calories: 2125, protein: 165, carbs: 218, fat: 66 }, 'Lean cut')).toBe('Calories, carbs and fat come down; protein stays. Lean cut updates too.')
    expect(changeSentence(current, { calories: 2400, protein: 170, carbs: 248, fat: 75 })).toBe('Calories, protein and fat go up; carbs stays.')
    expect(changeSentence(current, { calories: 2400, protein: 170, carbs: 260, fat: 70 }, 'your nutrition plan')).toBe('Calories, protein and carbs go up; fat comes down. Your nutrition plan updates too.')
  })
})
