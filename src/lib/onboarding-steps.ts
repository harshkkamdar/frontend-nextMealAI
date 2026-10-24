import type { PrimaryGoal } from '@/types/profile.types'

/** One question per screen (redesign Q5). Modules match the three onboarding endpoints; each posts after its last step. */
export type OnboardingModule = 'personal' | 'fitness' | 'nutrition'

export type StepId =
  | 'name' | 'sex' | 'dob' | 'height'
  | 'goal' | 'activity' | 'frequency' | 'experience' | 'equipment' | 'injuries'
  | 'weight' | 'target' | 'reflection' | 'allergies' | 'diet' | 'dislikes' | 'cuisines' | 'meals'

export const STEPS: { id: StepId; module: OnboardingModule }[] = [
  { id: 'name', module: 'personal' },
  { id: 'sex', module: 'personal' },
  { id: 'dob', module: 'personal' },
  { id: 'height', module: 'personal' },
  { id: 'goal', module: 'fitness' },
  { id: 'activity', module: 'fitness' },
  { id: 'frequency', module: 'fitness' },
  { id: 'experience', module: 'fitness' },
  { id: 'equipment', module: 'fitness' },
  { id: 'injuries', module: 'fitness' },
  { id: 'weight', module: 'nutrition' },
  { id: 'target', module: 'nutrition' },
  { id: 'reflection', module: 'nutrition' },
  { id: 'allergies', module: 'nutrition' },
  { id: 'diet', module: 'nutrition' },
  { id: 'dislikes', module: 'nutrition' },
  { id: 'cuisines', module: 'nutrition' },
  { id: 'meals', module: 'nutrition' },
]

/** Steps that apply to this person: no target weight (and no reflection on it) when maintaining. */
export function visibleSteps(goal: PrimaryGoal | null): typeof STEPS {
  return STEPS.filter((s) => !(goal === 'maintenance' && (s.id === 'target' || s.id === 'reflection')))
}

export function stepsFor(module: OnboardingModule, goal: PrimaryGoal | null) {
  return visibleSteps(goal).filter((s) => s.module === module)
}

/** Progress through the whole flow, 0-1, counting the consent screen as the last step. */
export function progressOf(id: StepId, goal: PrimaryGoal | null): number {
  const steps = visibleSteps(goal)
  const i = steps.findIndex((s) => s.id === id)
  return (Math.max(0, i) + 1) / (steps.length + 1)
}

export function routeOf(id: StepId): string {
  const step = STEPS.find((s) => s.id === id)!
  return `/onboarding/${step.module}?q=${id}`
}

/** Previous step's route, or null on the first step. */
export function previousRoute(id: StepId, goal: PrimaryGoal | null): string | null {
  const steps = visibleSteps(goal)
  const i = steps.findIndex((s) => s.id === id)
  return i > 0 ? routeOf(steps[i - 1].id) : null
}

/** Next step in the same module, or null when the module is finished and should be submitted. */
export function nextInModule(id: StepId, goal: PrimaryGoal | null): StepId | null {
  const steps = visibleSteps(goal)
  const i = steps.findIndex((s) => s.id === id)
  const next = steps[i + 1]
  return next && next.module === steps[i].module ? next.id : null
}

/** Age in whole years on `today` from a YYYY-MM-DD date of birth. */
export function ageOn(dob: string, today: Date): number {
  const [y, m, d] = dob.split('-').map(Number)
  let age = today.getFullYear() - y
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age -= 1
  return age
}
