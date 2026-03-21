import { apiFetch } from './client'
import type { Plan } from '@/types/plans.types'

export async function getPlans(params?: { type?: string; active_only?: boolean }): Promise<Plan[]> {
  const query = new URLSearchParams()
  if (params?.type) query.set('type', params.type)
  if (params?.active_only) query.set('active_only', 'true')
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
