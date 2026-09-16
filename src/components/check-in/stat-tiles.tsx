import type { ReactNode } from 'react'

import { MetricTile } from '@/components/ui/fiqr/metric-tile'

interface StatTile {
  label: ReactNode
  value: ReactNode
  unit?: ReactNode
  sub?: ReactNode
}

interface StatTilesProps {
  items: StatTile[]
  cols: 2 | 4
}

export function StatTiles({ items, cols }: StatTilesProps) {
  return (
    <div className={`grid gap-2 ${cols === 4 ? 'grid-cols-4' : 'grid-cols-2 gap-[10px]'}`}>
      {items.map((item, index) => (
        <MetricTile
          className={cols === 4 ? 'min-w-0 rounded-[14px] px-[10px] py-[10px]' : undefined}
          key={`${String(item.label)}-${index}`}
          {...item}
        />
      ))}
    </div>
  )
}
