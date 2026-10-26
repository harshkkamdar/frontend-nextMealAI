import type { CheckInStatus } from '@/lib/api/check-in.api'

export interface DayTargets {
  calories: number
  protein: number
  carbs: number
  fat: number
}

/**
 * What Apply writes, mirrored from the backend's applyTargets (services/check-in.service.ts): calories and protein as
 * decided, fat held at 28% of calories, carbs take the rest. The status only sends calories and protein, so the screen
 * derives carbs and fat the same way to show all four numbers Apply changes.
 */
export function appliedTargets(calories: number, protein: number): DayTargets {
  const fat = Math.max(0, Math.round((calories * 0.28) / 9))
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4))
  return { calories, protein, carbs, fat }
}

/** True when the proposal moves calories or protein; a hold (or a proposal equal to today's targets) changes nothing. */
export function proposalChanges(status: Pick<CheckInStatus, 'proposal' | 'targets'>): boolean {
  const { proposal, targets } = status
  if (!proposal || proposal.direction === 'hold') return false
  return proposal.new_calories !== targets.calories || proposal.new_protein_g !== targets.protein_g
}

/** The POST /v1/check-in answer, read loosely: the api module types it as unknown. */
export interface ApplyResult {
  applied?: boolean
  new_calorie_target?: number | null
  new_protein_target_g?: number | null
}

/**
 * The targets Apply really saved. The backend re-decides on POST, so its answer wins over the proposal; an older answer
 * without numbers falls back to the proposal. Null when the backend says nothing was applied.
 */
export function savedTargets(result: unknown, proposal: { new_calories: number; new_protein_g: number }, currentProtein: number | null): DayTargets | null {
  const r = (result && typeof result === 'object' ? result : {}) as ApplyResult
  if (r.applied === false) return null
  const calories = typeof r.new_calorie_target === 'number' ? r.new_calorie_target : proposal.new_calories
  const protein = typeof r.new_protein_target_g === 'number'
    ? r.new_protein_target_g
    : typeof r.new_calorie_target === 'number' ? currentProtein ?? proposal.new_protein_g : proposal.new_protein_g
  return appliedTargets(calories, protein)
}

const LABEL = { calories: 'calories', protein: 'protein', carbs: 'carbs', fat: 'fat' } as const
const list = (words: string[]) => words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

/** "Calories, carbs and fat come down; protein stays. Lean cut updates too." Read from the two sets of numbers. */
export function changeSentence(current: DayTargets, next: DayTargets, planName?: string | null): string {
  const keys = Object.keys(LABEL) as (keyof DayTargets)[]
  const down = keys.filter((key) => next[key] < current[key]).map((key) => LABEL[key])
  const up = keys.filter((key) => next[key] > current[key]).map((key) => LABEL[key])
  const same = keys.filter((key) => next[key] === current[key]).map((key) => LABEL[key])
  const groups: [string[], string][] = [[down, down.length === 1 ? 'comes down' : 'come down'], [up, up.length === 1 ? 'goes up' : 'go up'], [same, same.length === 1 ? 'stays' : 'stay']]
  // The calorie move leads: it is the change people look for.
  const parts = groups.filter(([words]) => words.length).sort(([a], [b]) => Number(b.includes('calories')) - Number(a.includes('calories'))).map(([words, verb]) => `${list(words)} ${verb}`)
  return `${capital(parts.join('; '))}.${planName ? ` ${capital(planName)} updates too.` : ''}`
}
