'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronUp, Plus, Minus, RefreshCw, ArrowRight } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'

interface PlanVersion {
  id: string
  version: number
  created_at: string
}

interface DiffChange {
  type: string
  field: string
  description: string
  old_value?: unknown
  new_value?: unknown
}

interface DiffResult {
  current: PlanVersion
  previous: PlanVersion | null
  changes: DiffChange[]
}

interface VersionsResponse {
  versions: Array<{
    id: string
    version: number
    status: string
    created_at: string
  }>
}

type IconComponent = typeof Plus

const CHANGE_ICONS: Record<string, IconComponent> = {
  exercise_added: Plus,
  exercise_removed: Minus,
  exercise_modified: RefreshCw,
  day_added: Plus,
  day_removed: Minus,
  target_change: ArrowRight,
  status_change: ArrowRight,
  structure: RefreshCw,
  created: Plus,
  no_change: RefreshCw,
}

const CHANGE_COLORS: Record<string, string> = {
  exercise_added: 'text-[#34C759] bg-[#34C759]/10',
  exercise_removed: 'text-[#FF3B30] bg-[#FF3B30]/10',
  exercise_modified: 'text-[#3B82F6] bg-[#3B82F6]/10',
  day_added: 'text-[#34C759] bg-[#34C759]/10',
  day_removed: 'text-[#FF3B30] bg-[#FF3B30]/10',
  target_change: 'text-[#FF9500] bg-[#FF9500]/10',
  status_change: 'text-text-secondary bg-surface',
  structure: 'text-[#3B82F6] bg-[#3B82F6]/10',
  created: 'text-[#34C759] bg-[#34C759]/10',
  no_change: 'text-text-tertiary bg-surface',
}

export function PlanChangelog({ planId }: { planId: string }) {
  const [versions, setVersions] = useState<VersionsResponse['versions']>([])
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null)
  const [diffs, setDiffs] = useState<Record<string, DiffResult>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    apiFetch<VersionsResponse>(`/v1/plans/${planId}/versions`)
      .then(res => {
        if (!cancelled) setVersions(res.versions ?? [])
      })
      .catch(() => {
        if (!cancelled) setVersions([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [planId])

  const loadDiff = useCallback(async (versionId: string) => {
    if (diffs[versionId]) {
      setExpandedVersion(prev => prev === versionId ? null : versionId)
      return
    }

    try {
      const diff = await apiFetch<DiffResult>(`/v1/plans/${versionId}/diff`)
      setDiffs(prev => ({ ...prev, [versionId]: diff }))
      setExpandedVersion(versionId)
    } catch {
      // silently fail
    }
  }, [diffs])

  if (loading) {
    return <div className="py-4 text-center text-xs text-text-tertiary">Loading history...</div>
  }

  if (versions.length <= 1) return null

  return (
    <div className="mt-4">
      <h3 className="text-xs font-medium uppercase tracking-wide text-text-tertiary mb-2">
        Version History
      </h3>
      <div className="space-y-2">
        {versions.map((version, idx) => {
          const isExpanded = expandedVersion === version.id
          const diff = diffs[version.id]
          const date = new Date(version.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })

          return (
            <div key={version.id} className="bg-surface border border-border rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => loadDiff(version.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-surface-hover transition-colors"
              >
                <div>
                  <span className="text-sm font-medium text-text-primary">
                    Version {version.version}
                  </span>
                  <span className="text-xs text-text-tertiary ml-2">{date}</span>
                  {idx === 0 && (
                    <span className="ml-2 text-[10px] bg-[#34C759]/10 text-[#34C759] px-1.5 py-0.5 rounded-full">
                      Current
                    </span>
                  )}
                  {version.status === 'superseded' && (
                    <span className="ml-2 text-[10px] bg-surface text-text-tertiary px-1.5 py-0.5 rounded-full">
                      Superseded
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-text-tertiary" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-text-tertiary" />
                )}
              </button>

              {isExpanded && diff && (
                <div className="border-t border-border px-4 py-3 space-y-2">
                  {diff.changes.map((change, i) => {
                    const Icon = CHANGE_ICONS[change.type] ?? RefreshCw
                    const colorClass = CHANGE_COLORS[change.type] ?? 'text-text-secondary bg-surface'

                    return (
                      <div key={i} className="flex items-start gap-2">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${colorClass}`}
                        >
                          <Icon className="w-3 h-3" />
                        </div>
                        <p className="text-xs text-text-secondary">{change.description}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
