'use client'

import { GeoAvatar } from '@/components/shared/geo-avatar'

type GeoState = 'default' | 'happy' | 'thinking' | 'suggest' | 'coach'

export function GeoCommentary({
  message,
  state = 'default',
}: {
  message: string
  state?: GeoState
}) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <GeoAvatar state={state} size={36} />
      <div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary">
        {message}
      </div>
    </div>
  )
}
