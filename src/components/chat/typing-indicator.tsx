'use client'

import { GeoAvatar } from '@/components/shared/geo-avatar'

export function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 max-w-[85%]">
      <GeoAvatar state="thinking" size={28} />
      <div className="bg-surface border border-border rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
