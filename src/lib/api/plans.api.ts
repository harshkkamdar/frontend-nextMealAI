import { apiFetch } from './client'
import type { Plan } from '@/types/plans.types'

export async function getPlans(params?: { active_only?: boolean; type?: string }): Promise<Plan[]> {
  const query = params ? '?' + new URLSearchParams(
    Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
  ).toString() : ''
  return apiFetch<Plan[]>(`/v1/plans${query}`)
}

export async function getPlan(id: string): Promise<Plan> {
  return apiFetch<Plan>(`/v1/plans/${id}`)
}
