import { apiFetch } from './client'
import type { Plan } from '@/types/plans.types'

interface PlansResponse {
  plans: Plan[]
  pagination: { total: number; limit: number; offset: number; hasMore: boolean }
}

export async function getPlans(params?: { active_only?: boolean; type?: string }): Promise<Plan[]> {
  const query = params ? '?' + new URLSearchParams(
    Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
  ).toString() : ''
  const result = await apiFetch<PlansResponse>(`/v1/plans${query}`)
  return result.plans ?? []
}

export async function getPlan(id: string): Promise<Plan> {
  return apiFetch<Plan>(`/v1/plans/${id}`)
}
