/**
 * FB-R6-S2-v2 · TopToolsChart — horizontal bar chart of tool_calls_7d.
 *
 * BE returns ORDER BY call_count DESC, capped at 20 by us. The test
 * harness reads `data-testid="top-tool-row-N"` for the Nth entry's
 * name + count to assert ordering without DOM-walking Recharts.
 */

'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { ToolCallEntry } from '@/types/admin.types'

const MAX_ROWS = 20

export function TopToolsChart({ data }: { data: ToolCallEntry[] }) {
  const rows = data.slice(0, MAX_ROWS)

  if (rows.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-4">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary block mb-2">
          Top Tools (7d)
        </span>
        <p className="text-xs text-text-secondary">No tool calls in the last 7 days</p>
      </div>
    )
  }

  return (
    <div
      data-testid="top-tools-chart"
      data-point-count={rows.length}
      className="bg-surface border border-border rounded-2xl p-4"
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary block mb-3">
        Top Tools (7d)
      </span>

      {/* sr-only ordered list mirrors the chart so tests + screen readers can read ordering */}
      <ol className="sr-only">
        {rows.map((r, i) => (
          <li key={r.tool_name} data-testid={`top-tool-row-${i}`}>
            {r.tool_name}: {r.call_count}
          </li>
        ))}
      </ol>

      <div style={{ height: Math.max(160, rows.length * 24) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 4, right: 8, bottom: 4, left: 8 }}
          >
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: 'currentColor' }}
              axisLine={false}
              tickLine={false}
              className="text-text-tertiary"
            />
            <YAxis
              type="category"
              dataKey="tool_name"
              tick={{ fontSize: 11, fill: 'currentColor' }}
              axisLine={false}
              tickLine={false}
              className="text-text-primary"
              width={120}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="call_count" fill="var(--color-accent)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
