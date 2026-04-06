import { apiFetch } from './client'
import type { Plan } from '@/types/plans.types'

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
