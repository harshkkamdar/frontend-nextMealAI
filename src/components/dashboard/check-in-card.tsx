/**
 * FB-R6-10 — Dashboard Check-In Card
 *
 * Renders the BE-composed daily narrative + 4 structured metrics so a
 * data-loaded user sees "this is how you're tracking" instead of empty-state
 * nags ("no meal logged today"). Visual contract matches the rest of
 * src/components/dashboard/ — `bg-surface border border-border rounded-2xl`,
 * 10px uppercase section label, tabular-nums metric numbers.
 *
 * Tap → opens Geo chat with a prefill asking for a deeper trends discussion.
 * That's the v2 drill-down. Future: dedicated /trends page.
 */

'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Sparkles, TrendingDown, TrendingUp, Activity as ActivityIcon, Calendar } from 'lucide-react'
import type { DashboardCheckIn } from '@/lib/api/dashboard.api'

const PREFILL = encodeURIComponent(
  'Walk me through my trends from this week — what should I focus on?'
)

function fmtPct(v: number | null): string {
  if (v == null) return '—'
  return `${Math.round(v)}%`
}

function fmtKg(v: number | null): string {
  if (v == null) return '—'
  const sign = v > 0 ? '+' : ''
  return `${sign}${v.toFixed(1)} kg`
}

function fmtCount(v: number | null): string {
  if (v == null) return '—'
  return String(v)
}

export function CheckInCard({ checkIn }: { checkIn: DashboardCheckIn }) {
  const { narrative, metrics } = checkIn
  const weightTrendIcon =
    metrics.weight_delta_kg != null && metrics.weight_delta_kg < 0
      ? TrendingDown
      : TrendingUp

  // /cso P1 — generate the drilldown session UUID once per mount. Previously
  // this lived inline in the JSX `href` and ran on every render, leaking
  // orphan session IDs to the chat-sessions table and breaking prefetching.
  const drilldownHref = useMemo(
    () => `/chat/${crypto.randomUUID()}?prefill=${PREFILL}`,
    []
  )

  return (
    <div
      className="bg-surface border border-border rounded-2xl p-4"
      data-testid="check-in-card"
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="w-4 h-4 text-accent" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
          Check-in
        </span>
      </div>

      <p className="text-sm text-text-primary leading-relaxed mb-4">{narrative}</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        <Metric
          icon={ActivityIcon}
          label="Macros"
          value={fmtPct(metrics.macro_adherence_pct)}
        />
        <Metric
          icon={weightTrendIcon}
          label="Weight Δ"
          value={fmtKg(metrics.weight_delta_kg)}
        />
        <Metric
          icon={ActivityIcon}
          label="Workouts"
          value={fmtCount(metrics.workout_count_7d)}
          suffix="/ 7d"
        />
        <Metric
          icon={Calendar}
          label="Logged"
          value={fmtCount(metrics.data_days)}
          suffix="days"
        />
      </div>

      <Link
        href={drilldownHref}
        className="text-xs font-medium text-accent hover:underline"
        data-testid="check-in-drilldown-link"
      >
        Ask Geo for the deeper view &rarr;
      </Link>
    </div>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  suffix,
}: {
  icon: typeof Sparkles
  label: string
  value: string
  suffix?: string
}) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 mb-1">
        <Icon className="w-3 h-3 text-text-tertiary" />
        <p className="text-[10px] uppercase tracking-[0.04em] text-text-tertiary">{label}</p>
      </div>
      <p className="text-base font-semibold tabular-nums text-text-primary">{value}</p>
      {suffix && <p className="text-[10px] text-text-tertiary">{suffix}</p>}
    </div>
  )
}
