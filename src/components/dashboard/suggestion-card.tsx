'use client'

import { useState } from 'react'
import { GeoAvatar } from '@/components/shared/geo-avatar'
import { takeSuggestionAction } from '@/lib/api/suggestions.api'
import type { Suggestion } from '@/types/suggestions.types'

export function SuggestionCard({
  suggestion,
  onAction,
}: {
  suggestion: Suggestion
  onAction: () => void
}) {
  const [loading, setLoading] = useState(false)

  async function handleAction(action: 'approve' | 'dismiss') {
    setLoading(true)
    try {
      await takeSuggestionAction(suggestion.id, { action })
      onAction()
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-[24px] card-glass p-5">
      <div className="flex gap-[11px]">
        <GeoAvatar variant="face" state="suggest" size={24} />
        <div className="min-w-0 flex-1">
          <p className="text-[15.5px] font-semibold text-ink">{suggestion.title}</p>
          <p className="mt-0.5 text-[13.5px] font-normal text-ink-65">{suggestion.description}</p>
          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction('approve')}
              className="h-11 rounded-full bg-ink px-4 text-[14px] font-semibold text-cream transition-transform active:scale-[.97] disabled:opacity-50"
            >
              Yes, update
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction('dismiss')}
              className="h-11 rounded-full bg-ink-06 px-4 text-[14px] font-semibold text-ink transition-transform active:scale-[.97] disabled:opacity-50"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
