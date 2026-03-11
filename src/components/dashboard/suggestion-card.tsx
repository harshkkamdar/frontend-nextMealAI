'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Check, X, Minus } from 'lucide-react'
import { GeoAvatar } from '@/components/shared/geo-avatar'
import { ConfidenceBadge } from '@/components/shared/confidence-badge'
import { takeSuggestionAction } from '@/lib/api/suggestions.api'
import { queryKeys } from '@/lib/query-keys'
import type { Suggestion, SuggestionAction } from '@/types/suggestions.types'
import { ApiException } from '@/types/api.types'

interface SuggestionCardProps {
  suggestion: Suggestion
}

export function SuggestionCard({ suggestion }: SuggestionCardProps) {
  const queryClient = useQueryClient()
  const [isActing, setIsActing] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  async function handleAction(action: SuggestionAction) {
    setIsActing(true)
    try {
      await takeSuggestionAction(suggestion.id, { action })
      setDismissed(true)
      queryClient.invalidateQueries({ queryKey: queryKeys.suggestions() })
      if (action === 'approve') toast.success('Suggestion approved!')
      else if (action === 'reject') toast.error('Suggestion rejected')
      else toast.info('Suggestion dismissed')
    } catch (err) {
      setIsActing(false)
      if (err instanceof ApiException) {
        toast.error(err.message || 'Action failed')
      } else {
        toast.error('Something went wrong')
      }
    }
  }

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2 }}
          className="bg-bg-secondary rounded-2xl p-5 space-y-3"
        >
          <div className="flex items-start gap-3">
            <GeoAvatar size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-foreground truncate">{suggestion.title}</p>
                {suggestion.confidence !== undefined && (
                  <ConfidenceBadge confidence={suggestion.confidence} />
                )}
              </div>
              <p className="text-sm text-muted-foreground">{suggestion.description}</p>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => handleAction('approve')}
              disabled={isActing}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-success/10 border border-success/30 text-success text-sm font-medium hover:bg-success/20 disabled:opacity-50 transition-colors"
            >
              <Check size={16} />
              Approve
            </button>
            <button
              onClick={() => handleAction('reject')}
              disabled={isActing}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/20 disabled:opacity-50 transition-colors"
            >
              <X size={16} />
              Reject
            </button>
            <button
              onClick={() => handleAction('dismiss')}
              disabled={isActing}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-muted border border-border text-muted-foreground text-sm font-medium hover:bg-muted/80 disabled:opacity-50 transition-colors"
            >
              <Minus size={16} />
              Dismiss
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
