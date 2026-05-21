/**
 * FB-R6-S2-v2 · DauLineChart — last 30 days of DAU.
 *
 * Recharts LineChart wrapped in the same Card chrome as dashboard cards.
 * `data-point-count` exposes the visible point count for tests (jsdom
 * can't reliably DOM-walk Recharts internals).
 */

'use client'

import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import type { DauPoint } from '@/types/admin.types'

const MAX_POINTS = 30

export function DauLineChart({ data }: { data: DauPoint[] }) {
  const points = data.slice(-MAX_POINTS)

  if (points.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-4">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary block mb-2">
          Daily Active Users
        </span>
        <p className="text-xs text-text-secondary">No DAU data yet</p>
      </div>
    )
  }

  return (
    <div
      data-testid="dau-line-chart"
      data-point-count={points.length}
      className="bg-surface border border-border rounded-2xl p-4"
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary block mb-3">
        Daily Active Users
      </span>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: 'currentColor' }}
              axisLine={false}
              tickLine={false}
              className="text-text-tertiary"
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'currentColor' }}
              axisLine={false}
              tickLine={false}
              className="text-text-tertiary"
              width={28}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="active_users"
              stroke="var(--color-accent)"
              strokeWidth={2}
              dot={{ r: 3, fill: 'var(--color-accent)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
