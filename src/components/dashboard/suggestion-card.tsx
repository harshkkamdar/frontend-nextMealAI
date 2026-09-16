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
    <div className="bg-card border border-ink-12 rounded-[16px] p-[14px]">
      <div className="flex gap-[11px]">
        <GeoAvatar state="suggest" size={24} />
        <div className="min-w-0 flex-1">
          <p className="text-[15.5px] font-semibold text-ink">{suggestion.title}</p>
          <p className="mt-0.5 text-[13.5px] font-normal text-ink-62">{suggestion.description}</p>
          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction('approve')}
              className="rounded-full bg-ink px-3 h-9 text-[13.5px] font-semibold text-cream disabled:opacity-50"
            >
              Yes, update
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction('dismiss')}
              className="rounded-full bg-ink-08 px-3 h-9 text-[13.5px] font-semibold text-ink disabled:opacity-50"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
