import { apiFetch } from './client'
import type { WorkoutProgramContent } from '@/types/plans.types'

/**
 * FB-15: Extract a structured workout program from an image via the
 * backend Gemini Vision endpoint. The returned program matches
 * WorkoutPlanContentSchema and can be handed straight to createPlan().
 *
 * The backend enforces non-uniform rest via a classifier override, so the
 * returned rest_seconds will be sensible even if the LLM hallucinated a
 * uniform value.
 */
export async function extractWorkoutProgram(
  image: string
): Promise<{ program: WorkoutProgramContent; confidence: number }> {
  return apiFetch<{ program: WorkoutProgramContent; confidence: number }>(
    '/v1/vision/workout-program',
    { method: 'POST', body: { image } }
  )
}

/**
 * FB-15: Heuristic check — does the accompanying user message look like a
 * request to extract a workout program from an image? We keep it simple
 * and case-insensitive. False negatives are acceptable (falls back to
 * Geo's normal flow); false positives are cheap (one Gemini call).
 */
const PROGRAM_KEYWORDS = [
  'program',
  'workout',
  'routine',
  'plan',
  'training',
  'split',
]

export function isLikelyWorkoutProgramPrompt(message: string): boolean {
  if (!message) return false
  const lower = message.toLowerCase()
  return PROGRAM_KEYWORDS.some((kw) => lower.includes(kw))
}
