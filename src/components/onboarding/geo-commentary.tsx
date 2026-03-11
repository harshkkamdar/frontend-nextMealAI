import { GeoAvatar } from '@/components/shared/geo-avatar'

interface GeoCommentaryProps {
  message: string
}

export function GeoCommentary({ message }: GeoCommentaryProps) {
  return (
    <div className="flex gap-3 items-start p-4 bg-bg-secondary rounded-xl mx-4 mb-4">
      <GeoAvatar size="sm" />
      <div className="flex-1">
        <p className="text-xs font-semibold text-brand mb-1">Geo</p>
        <p className="text-sm text-foreground">{message}</p>
      </div>
    </div>
  )
}
