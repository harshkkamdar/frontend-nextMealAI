'use client'

import { useMemo } from 'react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
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
    <BottomSheet open={open} onClose={onClose} ariaLabel="Macro breakdown">
      <h2 id={titleId} className="text-base font-semibold text-text-primary mb-4 px-6">
        {title}
      </h2>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-8">
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
      </div>
    </BottomSheet>
  )
}
