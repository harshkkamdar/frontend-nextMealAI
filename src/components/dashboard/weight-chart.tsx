'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { TrendingDown } from 'lucide-react'
import type { Log, WeightPayload } from '@/types/logs.types'

interface WeightChartProps {
  startWeight: number
  targetWeight: number
  weightLogs: Log[]
  profileCreatedAt: string
}

export function WeightChart({ startWeight, targetWeight, weightLogs, profileCreatedAt }: WeightChartProps) {
  const data: { date: string; weight: number }[] = []

  // Starting point from profile creation
  const startDate = new Date(profileCreatedAt)
  data.push({
    date: formatShortDate(startDate),
    weight: startWeight,
  })

  // Add each weight log entry
  weightLogs
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .forEach((log) => {
      const payload = log.payload as WeightPayload
      data.push({
        date: formatShortDate(new Date(log.created_at)),
        weight: payload.weight_kg,
      })
    })

  // Compute Y axis bounds with some padding
  const allWeights = data.map((d) => d.weight).concat([targetWeight])
  const minW = Math.floor(Math.min(...allWeights) - 2)
  const maxW = Math.ceil(Math.max(...allWeights) + 2)

  const latestWeight = data[data.length - 1]?.weight ?? startWeight
  const diff = latestWeight - startWeight
  const diffStr = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center gap-1.5 mb-1">
        <TrendingDown className="w-4 h-4 text-accent" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
          Weight
        </span>
      </div>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-[22px] font-semibold tabular-nums text-text-primary">
          {latestWeight} kg
        </span>
        <span className={`text-xs font-medium ${diff <= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {diffStr} kg
        </span>
        <span className="text-[10px] text-text-tertiary">
          Goal: {targetWeight} kg
        </span>
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[minW, maxW]}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              formatter={(value: number) => [`${value} kg`, 'Weight']}
            />
            <ReferenceLine
              y={targetWeight}
              stroke="#22c55e"
              strokeDasharray="4 4"
              label={{ value: 'Target', position: 'right', fontSize: 10, fill: '#22c55e' }}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#E86C3A"
              strokeWidth={2}
              dot={{ r: 4, fill: '#E86C3A', stroke: '#fff', strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {data.length <= 1 && (
        <p className="text-[10px] text-text-tertiary text-center mt-2">
          Log your weight to see progress over time
        </p>
      )}
    </div>
  )
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
