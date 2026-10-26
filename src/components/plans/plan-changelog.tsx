'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronRightIcon } from '@/components/ui/fiqr/icons'
import { CARD, SectionHeading } from '@/components/plans/spatial-parts'
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

/** History: one row per version (check-ins and edits each write one); a row opens to what changed in it. */
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
  return (
    <section>
      <SectionHeading>History</SectionHeading>
      <div className={cn(CARD, 'overflow-hidden')}>
        {versions.map((version) => {
          const isExpanded = expandedVersion === version.id
          const diff = diffs[version.id]
          const date = new Date(version.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
          return (
            <div key={version.id} className="border-b border-ink-06 last:border-b-0">
              <button type="button" aria-expanded={isExpanded} aria-label={`Version ${version.version}, ${date}`} onClick={() => loadDiff(version.id)} className="flex min-h-[60px] w-full items-center gap-3 px-4 py-2.5 text-left active:bg-ink-04">
                <span className="min-w-0 flex-1">
                  <span className="block text-body font-bold text-ink">Version {version.version}</span>
                  <span className="block text-caption text-ink-65">{date}</span>
                </span>
                {version.status === 'active' ? <span className="rounded-full bg-ink-06 px-2.5 py-1 text-label text-ink">Current</span> : null}
                <ChevronRightIcon aria-hidden="true" className={cn('size-4 shrink-0 text-ink-35 transition-transform duration-200', isExpanded && 'rotate-90')} />
              </button>
              {isExpanded && diff ? (
                <div className="page-in space-y-1.5 px-4 pb-3.5">
                  {diff.changes.length
                    ? diff.changes.map((change, index) => <p key={`${change.field}-${index}`} className="text-body-sm leading-[1.45] text-ink-65"><span className="mr-2 font-semibold text-ink">{changePrefix(change.type)}</span>{change.description}</p>)
                    : <p className="text-body-sm text-ink-65">No changes recorded for this version.</p>}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
