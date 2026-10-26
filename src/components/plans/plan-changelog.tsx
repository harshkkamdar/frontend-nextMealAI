'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronRightIcon } from '@/components/ui/fiqr/icons'
import { cn } from '@/lib/utils'
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
  if (loading) return <div aria-hidden="true" className="min-h-0" />
  if (versions.length <= 1) return null
  return <section><h2 className="mb-2 px-1 text-[13px] font-semibold text-ink-65">History</h2><div className="overflow-hidden rounded-[24px] bg-card shadow-[var(--shadow-card)]">{versions.map((version) => {
    const isExpanded = expandedVersion === version.id
    const diff = diffs[version.id]
    const date = new Date(version.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    return <div key={version.id} className="border-b border-ink-06 last:border-b-0"><button type="button" aria-expanded={isExpanded} onClick={() => loadDiff(version.id)} className="flex min-h-14 w-full items-center justify-between gap-3 px-5 py-3 text-left active:bg-ink-04"><span className="text-[15.5px] font-semibold text-ink">v{version.version} · {date}{version.status === 'active' ? <span className="ml-2 inline-flex h-6 items-center rounded-full bg-ink-08 px-2.5 text-[12px] font-semibold text-ink">Current</span> : null}</span><ChevronRightIcon aria-hidden="true" className={cn('size-4 text-ink-35 transition-transform duration-200', isExpanded && 'rotate-90')} /></button>{isExpanded && diff ? <div className="page-in space-y-2 px-5 pb-4">{diff.changes.length ? diff.changes.map((change, index) => <p key={`${change.field}-${index}`} className="text-[14px] leading-[1.45] text-ink-65"><span className="mr-2 font-semibold text-ink">{changePrefix(change.type)}</span>{change.description}</p>) : <p className="text-[14px] text-ink-65">No changes recorded for this version.</p>}</div> : null}</div>
  })}</div></section>
}
