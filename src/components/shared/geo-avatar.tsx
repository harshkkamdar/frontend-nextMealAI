import { cn } from '@/lib/utils'

type GeoState = 'default' | 'happy' | 'thinking' | 'suggest' | 'coach'

export function GeoAvatar({ size = 36, className }: {
  state?: GeoState
  size?: number
  className?: string
}) {
  return (
    <div
      className={cn('rounded-full bg-ink text-accent font-bold flex items-center justify-center shrink-0', className)}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      G
    </div>
  )
}
