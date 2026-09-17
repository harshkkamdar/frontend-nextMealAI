'use client'

import { GeoAvatar } from '@/components/shared/geo-avatar'

export function TypingIndicator() {
  return (
    <div className="flex max-w-[85%] items-end gap-2">
      <GeoAvatar variant="face" state="thinking" size={24} />
      <div className="rounded-[18px] rounded-bl-[6px] border border-ink-12 bg-card px-4 py-3">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 animate-bounce rounded-full bg-ink-35"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
