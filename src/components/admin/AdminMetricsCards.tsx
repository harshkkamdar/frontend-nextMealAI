/**
 * FB-R6-S2-v2 · AdminMetricsCards — 4 KPI tiles for the admin dashboard.
 *
 * Visual contract extracted 2026-05-21 from src/components/dashboard/
 * (progress-card, next-up-card, quick-stats, weight-chart). Cards:
 * `bg-surface border border-border rounded-2xl p-4`. Uppercase section
 * label: `text-[10px] font-semibold uppercase tracking-[0.08em]
 * text-text-secondary`. KPI number: `text-xl font-semibold tabular-nums
 * text-text-primary` (or `text-accent` for the hero metric). Muted
 * secondary: `text-xs text-text-secondary`. Lucide icons at `w-4 h-4`.
 * Grid gap 12px. Tokens are CSS-var driven (see `globals.css`) — never
 * hardcode hex; use `bg-surface`, `text-accent`, etc.
 */

'use client'

import { Users, Activity, CalendarDays, UserPlus } from 'lucide-react'
import type { AdminMetricsSummary } from '@/types/admin.types'

interface KpiTile {
  label: string
  value: number
  icon: typeof Users
  accent?: boolean
}

export function AdminMetricsCards({ summary }: { summary: AdminMetricsSummary }) {
  const tiles: KpiTile[] = [
    { label: 'Users', value: summary.users_total, icon: Users },
    { label: 'DAU today', value: summary.dau_today, icon: Activity, accent: true },
    { label: 'WAU this week', value: summary.wau_this_week, icon: CalendarDays },
    { label: 'New signups (7d)', value: summary.new_signups_7d, icon: UserPlus },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {tiles.map((t) => (
        <div
          key={t.label}
          data-testid="admin-kpi-tile"
          className="bg-surface border border-border rounded-2xl p-4"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <t.icon className="w-4 h-4 text-text-secondary" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
              {t.label}
            </span>
          </div>
          <p
            className={`text-xl font-semibold tabular-nums ${
              t.accent ? 'text-accent' : 'text-text-primary'
            }`}
          >
            {t.value}
          </p>
        </div>
      ))}
    </div>
  )
}
