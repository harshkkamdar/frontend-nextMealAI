'use client'

import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { computeMacroContributions, formatMacroGrams, formatMacroKcal, type MacroKey } from '@/lib/macros'
import type { Log } from '@/types/logs.types'

interface MacroBreakdownSheetProps {
  open: boolean
  onClose: () => void
  macro: MacroKey
  foodLogs: readonly Log[]
}

const TITLES: Record<MacroKey, string> = {
  calories: 'Calories breakdown',
  protein: 'Protein breakdown',
  carbs: 'Carbs breakdown',
  fat: 'Fat breakdown',
}

/**
 * FB-06 — drill-in sheet showing per-food contributions for a single macro,
 * sorted descending. Pure props: renders whatever `foodLogs` it's given,
 * so it works on the dashboard (today) and the diary (selected date) without
 * knowing the difference.
 */
export function MacroBreakdownSheet({ open, onClose, macro, foodLogs }: MacroBreakdownSheetProps) {
  const rows = useMemo(() => computeMacroContributions(foodLogs, macro), [foodLogs, macro])
  const formatValue = macro === 'calories' ? formatMacroKcal : formatMacroGrams
  const unit = macro === 'calories' ? ' cal' : ''
  const title = TITLES[macro]
  const titleId = `breakdown-title-${macro}`

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            data-testid="breakdown-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
          />

          <motion.div
            key="sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl px-6 pt-3 pb-8 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            <h2 id={titleId} className="text-base font-semibold text-text-primary mb-4">
              {title}
            </h2>

            {rows.length === 0 ? (
              <div className="py-8 text-center text-sm text-text-tertiary">
                No food logged yet
              </div>
            ) : (
              <ul className="space-y-2">
                {rows.map((row) => (
                  <li
                    key={row.id}
                    data-testid="breakdown-row"
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-surface border border-border"
                  >
                    <span className="text-sm text-text-primary truncate">{row.name}</span>
                    <span className="text-xs tabular-nums text-text-secondary shrink-0">
                      {formatValue(row.value)}
                      {unit}
                      {' · '}
                      {row.pct}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
