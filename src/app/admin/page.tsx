/**
 * FB-R6-S2-v2 · /admin page
 *
 * Composes the 6 admin components against the AdminMetricsResponse
 * returned by GET /v1/admin/metrics. Auth-gated by the same JWT as the
 * rest of the app; the BE 403s non-admins.
 *
 * On 403 → inline "Access denied" surface (clearer than a silent redirect).
 * On other errors → retry surface.
 */

'use client'

import { useEffect, useState } from 'react'
import { ShieldOff, AlertCircle, RefreshCw, Beaker } from 'lucide-react'
import { ApiException } from '@/types/api.types'
import { AdminMetricsCards } from '@/components/admin/AdminMetricsCards'
import { DauLineChart } from '@/components/admin/DauLineChart'
import { SignupsBarChart } from '@/components/admin/SignupsBarChart'
import { TopToolsChart } from '@/components/admin/TopToolsChart'
import { ActiveUsersTable } from '@/components/admin/ActiveUsersTable'
import { CsvExportButton } from '@/components/admin/CsvExportButton'
import { getAdminMetrics } from '@/lib/api/admin.api'
import type { AdminMetricsResponse } from '@/types/admin.types'

type State =
  | { kind: 'loading' }
  | { kind: 'ok'; data: AdminMetricsResponse }
  | { kind: 'denied' }
  | { kind: 'error'; message: string }

export default function AdminPage() {
  const [state, setState] = useState<State>({ kind: 'loading' })

  async function load() {
    setState({ kind: 'loading' })
    try {
      const data = await getAdminMetrics()
      setState({ kind: 'ok', data })
    } catch (err) {
      if (err instanceof ApiException && err.statusCode === 403) {
        setState({ kind: 'denied' })
      } else {
        setState({
          kind: 'error',
          message: err instanceof Error ? err.message : "Couldn't load admin metrics",
        })
      }
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (state.kind === 'loading') {
    return (
      <main className="max-w-6xl mx-auto p-4">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-text-primary mb-4">
          Admin
        </h1>
        <div className="bg-surface border border-border rounded-2xl p-8 text-center">
          <p className="text-sm text-text-secondary">Loading admin metrics…</p>
        </div>
      </main>
    )
  }

  if (state.kind === 'denied') {
    return (
      <main className="max-w-6xl mx-auto p-4">
        <div className="bg-surface border border-border rounded-2xl p-8 text-center">
          <ShieldOff className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
          <h1 className="text-base font-semibold text-text-primary mb-1">Access denied</h1>
          <p className="text-sm text-text-secondary">
            Your account isn&apos;t on the admin allow-list. If you think this is wrong, ask Ved.
          </p>
        </div>
      </main>
    )
  }

  if (state.kind === 'error') {
    return (
      <main className="max-w-6xl mx-auto p-4">
        <div className="bg-surface border border-border rounded-2xl p-8 text-center">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <h1 className="text-base font-semibold text-text-primary mb-1">
            Couldn&apos;t load admin metrics
          </h1>
          <p className="text-sm text-text-secondary mb-4">{state.message}</p>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-surface border border-border text-text-primary hover:bg-surface-hover transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      </main>
    )
  }

  const { data } = state
  const generated = new Date(data.generated_at).toLocaleString()

  return (
    <main className="max-w-6xl mx-auto p-4 space-y-4">
      <div className="flex items-baseline justify-between mb-2">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-text-primary">Admin</h1>
        <span className="text-[10px] text-text-tertiary tabular-nums">
          Generated {generated}
        </span>
      </div>

      {data.is_stub && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4"
        >
          <Beaker className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-text-primary mb-0.5">Stub data</p>
            <p className="text-text-secondary">
              These numbers (47 / 12 / 28 / 5, three test users) are deterministic
              fixtures, not real usage. Set{' '}
              <code className="px-1 py-0.5 rounded bg-surface text-text-primary font-mono text-xs">
                ADMIN_DASHBOARD_STUB=false
              </code>{' '}
              in the backend <code className="px-1 py-0.5 rounded bg-surface text-text-primary font-mono text-xs">.env</code> and restart to query real data.
            </p>
          </div>
        </div>
      )}

      <AdminMetricsCards summary={data.summary} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DauLineChart data={data.dau} />
        <SignupsBarChart data={data.signups} />
      </div>

      <TopToolsChart data={data.tool_calls_7d} />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
            Active users export
          </span>
          <CsvExportButton />
        </div>
        <ActiveUsersTable users={data.active_users_30d} />
      </div>
    </main>
  )
}
