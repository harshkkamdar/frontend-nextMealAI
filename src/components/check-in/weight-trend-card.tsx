import { formatDelta } from './format'

interface WeightTrendCardProps {
  points: { week_end: string; kg: number }[]
  currentKg: number | null
  deltaKg: number | null
  tone: 'accent' | 'muted'
  note?: string
}

function sparklinePoints(points: WeightTrendCardProps['points']): string {
  const values = points.map((point) => point.kg)
  const min = Math.min(...values) - 0.3
  const max = Math.max(...values) + 0.3
  const range = max - min

  return points.map((point, index) => {
    const x = 4 + (index / (points.length - 1)) * 92
    const y = 4 + ((max - point.kg) / range) * 36
    return `${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ')
}

export function WeightTrendCard({ points, currentKg, deltaKg, tone, note }: WeightTrendCardProps) {
  const stroke = tone === 'accent' ? '#E8622A' : 'rgba(17,28,53,.35)'
  const chartPoints = points.length >= 2 ? sparklinePoints(points) : ''
  const endPoint = chartPoints.split(' ').at(-1)?.split(',') ?? ['96', '22']

  return (
    <div className="rounded-[16px] border border-ink-12 bg-card p-[14px]">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[15.5px] font-semibold text-ink">Weight trend</span>
        <span className="whitespace-nowrap text-[13.5px] font-normal text-ink-65">
          <b className="text-[15.5px] font-semibold text-ink">
            {currentKg === null ? '—' : currentKg.toFixed(1)}{currentKg === null ? '' : 'kg'}
          </b>
          {note ? ` · ${note}` : deltaKg === null ? '' : ` · ${formatDelta(deltaKg)} this week`}
        </span>
      </div>

      {points.length < 2 ? (
        <p className="mt-2 text-[13.5px] text-ink-65">Log your weight to see a trend</p>
      ) : (
        <svg
          aria-label="Weight trend chart"
          className="mt-2 h-11 w-full"
          preserveAspectRatio="none"
          viewBox="0 0 100 44"
        >
          <polyline
            fill="none"
            points={chartPoints}
            stroke={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.75"
          />
          <circle cx={endPoint[0]} cy={endPoint[1]} fill={stroke} r="4" />
        </svg>
      )}
    </div>
  )
}
