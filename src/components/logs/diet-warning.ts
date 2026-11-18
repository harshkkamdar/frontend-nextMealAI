import { toast, type ExternalToast } from 'sonner'
import type { DietWarning } from '@/types/logs.types'

/** "Salmon is on your allergy list." */
export function dietWarningText(warning: DietWarning): string {
  const food = warning.food_name.charAt(0).toUpperCase() + warning.food_name.slice(1)
  if (warning.source === 'allergy') return `${food} is on your allergy list.`
  if (warning.source === 'dietary_style') return `${food} doesn't fit your ${warning.restriction} diet.`
  return `${food} has ${warning.restriction}, which you avoid.`
}

/** The warnings as sentences, each once; '' when there are none. */
export function dietNotes(warnings: Array<DietWarning | undefined>): string {
  return [...new Set(warnings.flatMap((warning) => (warning ? [dietWarningText(warning)] : [])))].join(' ')
}

/** A flow's "logged" toast. A food that clashes with the profile's diet still logs, so the same toast (Undo and all) says so. */
export function toastLogged(message: string, warnings: Array<DietWarning | undefined>, options?: ExternalToast) {
  const notes = dietNotes(warnings)
  if (!notes) return toast.success(message, options)
  return toast.warning(`${message}. ${notes}`, options)
}
