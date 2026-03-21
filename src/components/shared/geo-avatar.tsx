'use client'

import { cn } from '@/lib/utils'

type GeoState = 'default' | 'happy' | 'thinking' | 'suggest' | 'coach'

const SEEDS: Record<GeoState, string> = {
  default: 'Sadie',
  happy: 'Vivian',
  thinking: 'Jack',
  suggest: 'Robert',
  coach: 'Caleb',
}

function avatarUrl(state: GeoState): string {
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?backgroundColor=f4511e&eyes=frame2&seed=${SEEDS[state]}`
}

export function GeoAvatar({ state = 'default', size = 36, className }: {
  state?: GeoState
  size?: number
  className?: string
}) {
  return (
    <div
      className={cn('rounded-full overflow-hidden shrink-0 bg-accent-light', className)}
      style={{ width: size, height: size }}
    >
      <img src={avatarUrl(state)} alt="Geo" className="w-full h-full" />
    </div>
  )
}
