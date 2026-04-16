import { apiFetch } from './client'
import type { Plan, PlanType, MealPlan, WorkoutPlan } from '@/types/plans.types'

export async function getPlans(params?: { type?: string; active_only?: boolean; bustCache?: boolean }): Promise<Plan[]> {
  const query = new URLSearchParams()
  if (params?.type) query.set('type', params.type)
  if (params?.active_only) query.set('active_only', 'true')
  if (params?.bustCache) query.set('_t', String(Date.now()))
  const qs = query.toString()
  const res = await apiFetch<{ plans: Plan[] } | Plan[]>(`/v1/plans${qs ? `?${qs}` : ''}`)
  return Array.isArray(res) ? res : res.plans ?? []
}

export async function getPlan(id: string): Promise<Plan> {
  return apiFetch<Plan>(`/v1/plans/${id}`)
}

export async function activatePlan(id: string): Promise<void> {
  await apiFetch(`/v1/plans/${id}/activate`, { method: 'POST' })
}

export async function generatePlans(): Promise<{ success: boolean; plans: Plan[] }> {
  return apiFetch('/v1/plans/generate', { method: 'POST' })
}

export type CreateMealPlanInput = {
  type: 'meal'
  content: MealPlan['content']
  start_date?: string
  end_date?: string
  generated_by?: 'ai' | 'manual' | 'template'
}

export type CreateWorkoutPlanInput = {
  type: 'workout'
  content: WorkoutPlan['content']
  start_date?: string
  end_date?: string
  generated_by?: 'ai' | 'manual' | 'template'
}

export type CreatePlanInput = CreateMealPlanInput | CreateWorkoutPlanInput

export async function createPlan(input: CreatePlanInput): Promise<Plan> {
  return apiFetch<Plan>('/v1/plans', {
    method: 'POST',
    body: { generated_by: 'manual', ...input },
  })
}

export type UpdatePlanInput = {
  content?: Plan['content']
  status?: 'draft' | 'active' | 'completed'
}

export async function updatePlan(id: string, input: UpdatePlanInput): Promise<Plan> {
  return apiFetch<Plan>(`/v1/plans/${id}`, {
    method: 'PUT',
    body: input,
  })
}

export async function deletePlan(id: string): Promise<void> {
  await apiFetch(`/v1/plans/${id}`, { method: 'DELETE' })
}

// Convenience: detect whether a plan type is supported by the manual builders.
export function isManualBuilderType(type: string): type is PlanType {
  return type === 'meal' || type === 'workout'
}
