/**
 * FB-R6-S2-v2 · SignupsBarChart — last 30 days of signups.
 */

'use client'

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import type { SignupPoint } from '@/types/admin.types'

const MAX_POINTS = 30

export function SignupsBarChart({ data }: { data: SignupPoint[] }) {
  const points = data.slice(-MAX_POINTS)

  if (points.length === 0) {
    return (
      <div className="bg-card rounded-[24px] shadow-[var(--shadow-card)] p-4">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-65 block mb-2">
          New Signups
        </span>
        <p className="text-xs text-ink-65">No signups in the last 30 days</p>
      </div>
    )
  }

  return (
    <div
      data-testid="signups-bar-chart"
      data-point-count={points.length}
      className="bg-card rounded-[24px] shadow-[var(--shadow-card)] p-4"
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-65 block mb-3">
        New Signups
      </span>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: 'currentColor' }}
              axisLine={false}
              tickLine={false}
              className="text-ink-65"
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'currentColor' }}
              axisLine={false}
              tickLine={false}
              className="text-ink-65"
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
            <Bar dataKey="signups" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
