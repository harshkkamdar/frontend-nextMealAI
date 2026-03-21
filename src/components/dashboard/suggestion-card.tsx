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
    <div className="bg-surface border border-border rounded-2xl p-4 border-l-4 border-l-accent">
      <div className="flex gap-3">
        <GeoAvatar state="suggest" size={36} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-primary">{suggestion.title}</p>
          <p className="text-[13px] text-text-secondary mt-0.5">{suggestion.description}</p>
          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction('approve')}
              className="rounded-lg bg-gradient-to-r from-accent to-accent-hover px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              Yes, update
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction('dismiss')}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary disabled:opacity-50"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
