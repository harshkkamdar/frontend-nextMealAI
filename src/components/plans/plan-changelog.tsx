'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { SectionLabel } from '@/components/ui/fiqr/section-label'
import { apiFetch } from '@/lib/api/client'

interface PlanVersion { id: string; version: number; created_at: string }
interface DiffChange { type: string; field: string; description: string; old_value?: unknown; new_value?: unknown }
interface DiffResult { current: PlanVersion; previous: PlanVersion | null; changes: DiffChange[] }
interface VersionsResponse { versions: Array<{ id: string; version: number; status: 'draft' | 'active' | 'completed' | 'superseded'; created_at: string }> }

function changePrefix(type: string): string {
  if (type.includes('added') || type === 'created') return '+'
  if (type.includes('removed')) return '−'
  return '~'
}

export function PlanChangelog({ planId }: { planId: string }) {
  const [versions, setVersions] = useState<VersionsResponse['versions']>([])
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null)
  const [diffs, setDiffs] = useState<Record<string, DiffResult>>({})
  const [loading, setLoading] = useState(true)
  useEffect(() => { let cancelled = false; apiFetch<VersionsResponse>(`/v1/plans/${planId}/versions`).then((res) => { if (!cancelled) setVersions(res.versions ?? []) }).catch(() => { if (!cancelled) setVersions([]) }).finally(() => { if (!cancelled) setLoading(false) }); return () => { cancelled = true } }, [planId])
  const loadDiff = useCallback(async (versionId: string) => {
    if (diffs[versionId]) { setExpandedVersion((previous) => previous === versionId ? null : versionId); return }
    try { const diff = await apiFetch<DiffResult>(`/v1/plans/${versionId}/diff`); setDiffs((previous) => ({ ...previous, [versionId]: diff })); setExpandedVersion(versionId) } catch { /* history is non-critical */ }
  }, [diffs])
  if (loading) return <div className="py-4 text-center text-[13.5px] text-ink-65">Loading history…</div>
  if (versions.length <= 1) return null
  return <section className="space-y-2.5"><SectionLabel>History</SectionLabel><div className="overflow-hidden rounded-[16px] border border-ink-12 bg-card divide-y divide-ink-09">{versions.map((version) => {
    const isExpanded = expandedVersion === version.id
    const diff = diffs[version.id]
    const date = new Date(version.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    return <div key={version.id}><button type="button" onClick={() => loadDiff(version.id)} className="flex min-h-14 w-full items-center justify-between px-[14px] py-3 text-left"><span className="text-[15.5px] font-semibold text-ink">v{version.version} · {date}{version.status === 'active' ? <span className="ml-2 inline-flex h-6 items-center rounded-full bg-ink-08 px-2 text-[11px] font-semibold uppercase tracking-[1.4px] text-ink">Current</span> : null}</span>{isExpanded ? <ChevronUp className="h-5 w-5 text-ink-65" /> : <ChevronDown className="h-5 w-5 text-ink-65" />}</button>{isExpanded && diff ? <div className="space-y-2 border-t border-ink-09 px-[14px] py-3">{diff.changes.map((change, index) => <p key={`${change.field}-${index}`} className="text-[13.5px] text-ink-65"><span className="mr-2 font-semibold text-ink">{changePrefix(change.type)}</span>{change.description}</p>)}</div> : null}</div>
  })}</div></section>
}
