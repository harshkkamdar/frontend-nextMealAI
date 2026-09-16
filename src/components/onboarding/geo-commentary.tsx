'use client'

import { GeoLine } from '@/components/ui/fiqr/geo-line'

type GeoState = 'default' | 'happy' | 'thinking' | 'suggest' | 'coach'

export function GeoCommentary({
  message,
  state: _state = 'default',
}: {
  message: string
  state?: GeoState
}) {
  return (
    <GeoLine>{message}</GeoLine>
  )
}
