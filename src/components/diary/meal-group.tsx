'use client'

import { useState } from 'react'
import { ChevronDown, Pencil, Plus, CopyPlus, Star } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { updateLog } from '@/lib/api/logs.api'
import { formatMacroGrams, formatMacroKcal } from '@/lib/macros'
import type { FoodLogItem, FoodPayload, Log } from '@/types/logs.types'

/**
 * Render the quantity label for a food row. Prefers a NATURAL serving unit
 * ("3 eggs", "2 slices") when the log carries a serving_label + servings —
 * George, 2026-07-10: countable single-serve foods (egg, bread, cheese slice)
 * should read as servings, not grams. Falls back to "N serving(s)", then grams,
 * then "1 serving".
 */
function formatQuantity(payload: FoodPayload): string {
  const servings = typeof payload.servings === 'number' ? payload.servings : undefined
  const label = typeof payload.serving_label === 'string' ? payload.serving_label.trim() : ''
  if (servings !== undefined && label) {
    const plural = servings === 1 || /s$/i.test(label) ? label : `${label}s`
    return `${servings} ${plural}`
  }
  if (servings !== undefined) {
    return `${servings} serving${servings === 1 ? '' : 's'}`
  }
  if (payload.quantity_g) return `${payload.quantity_g}g`
  return '1 serving'
}

interface MealGroupProps {
  mealType: string
  items: Log[]
  onAddFood: () => void
  /** FB-R5-03: open the log-style sheet in edit mode for this row. */
  onEditLog?: (log: Log) => void
  /** True when the diary is showing today (hides "Copy to today"). */
  isToday?: boolean
  /** Copy this meal's items onto today. */
  onCopyToToday?: () => void
  /** Save this meal as a reusable favourite. */
  onSaveFavourite?: () => void
}

export function MealGroup({ mealType, items, onAddFood, onEditLog, isToday = true, onCopyToToday, onSaveFavourite }: MealGroupProps) {
  // FB-10: expand state + per-child edit draft (keyed by `${logId}:${childIdx}`)
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const [editingChild, setEditingChild] = useState<{ logId: string; idx: number } | null>(null)

  const subtotals = items.reduce((acc, item) => {
    const payload = item.payload as FoodPayload
    return {
      calories: acc.calories + (payload.est_macros?.calories ?? 0),
      protein: acc.protein + (payload.est_macros?.protein ?? 0),
      carbs: acc.carbs + (payload.est_macros?.carbs ?? 0),
      fat: acc.fat + (payload.est_macros?.fat ?? 0),
    }
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const toggleExpand = (logId: string) => {
    setExpandedLogs(prev => {
      const next = new Set(prev)
      if (next.has(logId)) next.delete(logId)
      else next.add(logId)
      return next
    })
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <span className="text-sm font-semibold text-text-primary">{mealType}</span>
        {items.length > 0 && (
          <span className="text-xs text-text-secondary tabular-nums">
            {formatMacroKcal(subtotals.calories)} cal &middot; {formatMacroGrams(subtotals.protein)} P &middot; {formatMacroGrams(subtotals.carbs)} C &middot; {formatMacroGrams(subtotals.fat)} F
          </span>
        )}
      </div>

      {/* Items */}
      <AnimatePresence>
        {items.map((item) => {
          const payload = item.payload as FoodPayload
          const cals = payload.est_macros?.calories ?? 0
          const protein = payload.est_macros?.protein ?? 0
          const carbsVal = payload.est_macros?.carbs ?? 0
          const fatVal = payload.est_macros?.fat ?? 0
          const children = payload.items ?? []
          const hasChildren = children.length > 0
          const isExpanded = expandedLogs.has(item.id)
          const childrenListId = `diary-items-${item.id}`

          return (
            <motion.div
              key={item.id}
              layout
              exit={{ opacity: 0, height: 0 }}
              className="border-b border-border/50 last:border-b-0"
            >
              {hasChildren ? (
                /* FB-10 compound rows: chevron expand + child list (unchanged) */
                <div className="flex items-center gap-3 px-4 py-2.5">
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.id)}
                    aria-expanded={isExpanded}
                    aria-controls={childrenListId}
                    aria-label="Expand items"
                    className="p-1 -ml-1 rounded text-text-tertiary hover:text-text-primary transition-colors shrink-0"
                  >
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{payload.food_name}</p>
                    <p className="text-[11px] text-text-tertiary tabular-nums">
                      {formatQuantity(payload)}
                      {cals > 0 && ` · ${formatMacroKcal(cals)} cal`}
                      {protein > 0 && <> · <span className="text-info">{formatMacroGrams(protein)} P</span></>}
                      {carbsVal > 0 && <> · <span className="text-warning">{formatMacroGrams(carbsVal)} C</span></>}
                      {fatVal > 0 && <> · <span className="text-purple-400">{formatMacroGrams(fatVal)} F</span></>}
                    </p>
                  </div>
                </div>
              ) : (
                /* FB-R5-03: simple rows are fully tappable — opens sheet in edit mode */
                <button
                  type="button"
                  onClick={() => onEditLog?.(item)}
                  aria-label={`Edit ${payload.food_name}`}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-hover transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{payload.food_name}</p>
                    <p aria-hidden="true" className="text-[11px] text-text-tertiary tabular-nums">
                      {/* FB-R5-03: render the unit the user logged in */}
                      {formatQuantity(payload)}
                      {cals > 0 && ` · ${formatMacroKcal(cals)} cal`}
                      {protein > 0 && <> · <span className="text-info">{formatMacroGrams(protein)} P</span></>}
                      {carbsVal > 0 && <> · <span className="text-warning">{formatMacroGrams(carbsVal)} C</span></>}
                      {fatVal > 0 && <> · <span className="text-purple-400">{formatMacroGrams(fatVal)} F</span></>}
                    </p>
                  </div>
                </button>
              )}

              {hasChildren && isExpanded ? (
                <ul
                  id={childrenListId}
                  className="border-t border-border/40 bg-background/40"
                >
                  {children.map((child, idx) => {
                    const key = `${item.id}:${idx}`
                    const isEditing = editingChild?.logId === item.id && editingChild.idx === idx
                    return (
                      <li
                        key={key}
                        className="px-6 py-2 border-b border-border/30 last:border-b-0"
                      >
                        {isEditing ? (
                          <ChildEditForm
                            child={child}
                            onCancel={() => setEditingChild(null)}
                            onSave={async (updated) => {
                              const nextItems: FoodLogItem[] = children.map((c, i) =>
                                i === idx ? updated : c
                              )
                              try {
                                await updateLog(item.id, { items: nextItems })
                                toast.success('Updated')
                                setEditingChild(null)
                              } catch {
                                toast.error('Failed to update')
                              }
                            }}
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-text-primary truncate">
                                {child.name}
                                {child.quantity_label ? (
                                  <span className="text-text-tertiary"> — {child.quantity_label}</span>
                                ) : child.quantity_g ? (
                                  <span className="text-text-tertiary"> — {child.quantity_g}g</span>
                                ) : null}
                              </p>
                              <p className="text-[10px] text-text-tertiary tabular-nums">
                                {formatMacroKcal(child.est_macros.calories ?? 0)} cal
                                {' · '}{formatMacroGrams(child.est_macros.protein ?? 0)} P
                                {' · '}{formatMacroGrams(child.est_macros.carbs ?? 0)} C
                                {' · '}{formatMacroGrams(child.est_macros.fat ?? 0)} F
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditingChild({ logId: item.id, idx })}
                              aria-label="Edit item"
                              className="p-1 rounded text-text-tertiary hover:text-accent transition-colors shrink-0"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              ) : null}
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Empty state or add button */}
      {items.length === 0 ? (
        <button
          onClick={onAddFood}
          className="flex items-center justify-center gap-1.5 w-full py-4 text-xs text-text-tertiary hover:text-accent transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          No {mealType.toLowerCase()} logged — tap to add
        </button>
      ) : (
        <div className="flex items-center justify-between px-4 py-2.5">
          <button
            onClick={onAddFood}
            className="flex items-center gap-1.5 text-xs text-accent hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            Add to {mealType}
          </button>
          <div className="flex items-center gap-1">
            {!isToday && onCopyToToday && (
              <button
                onClick={onCopyToToday}
                className="flex items-center gap-1 text-[11px] text-text-secondary hover:text-accent px-2 py-1 rounded-md hover:bg-surface-hover transition-colors"
                aria-label={`Copy ${mealType} to today`}
              >
                <CopyPlus className="w-3.5 h-3.5" />
                Copy to today
              </button>
            )}
            {onSaveFavourite && (
              <button
                onClick={onSaveFavourite}
                className="flex items-center gap-1 text-[11px] text-text-secondary hover:text-accent px-2 py-1 rounded-md hover:bg-surface-hover transition-colors"
                aria-label={`Save ${mealType} as a meal`}
                title="Save this meal to reuse later"
              >
                <Star className="w-3.5 h-3.5" />
                Save as meal
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * FB-10 — minimal inline form to edit a single child item's macros.
 * Saves are propagated upward via onSave(updated).
 */
function ChildEditForm({
  child,
  onCancel,
  onSave,
}: {
  child: FoodLogItem
  onCancel: () => void
  onSave: (updated: FoodLogItem) => void | Promise<void>
}) {
  const [calories, setCalories] = useState(String(child.est_macros.calories ?? 0))
  const [protein, setProtein] = useState(String(child.est_macros.protein ?? 0))
  const [carbs, setCarbs] = useState(String(child.est_macros.carbs ?? 0))
  const [fat, setFat] = useState(String(child.est_macros.fat ?? 0))
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        ...child,
        est_macros: {
          calories: Number(calories) || 0,
          protein: Number(protein) || 0,
          carbs: Number(carbs) || 0,
          fat: Number(fat) || 0,
        },
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium text-text-primary">{child.name}</p>
      <div className="grid grid-cols-4 gap-1.5 text-[10px]">
        <label className="flex flex-col">
          <span className="text-text-tertiary">Calories</span>
          <input
            type="number"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            className="px-1.5 py-1 rounded bg-background border border-border text-text-primary"
          />
        </label>
        <label className="flex flex-col">
          <span className="text-text-tertiary">Protein (g)</span>
          <input
            type="number"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            className="px-1.5 py-1 rounded bg-background border border-border text-text-primary"
          />
        </label>
        <label className="flex flex-col">
          <span className="text-text-tertiary">Carbs (g)</span>
          <input
            type="number"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            className="px-1.5 py-1 rounded bg-background border border-border text-text-primary"
          />
        </label>
        <label className="flex flex-col">
          <span className="text-text-tertiary">Fat (g)</span>
          <input
            type="number"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            className="px-1.5 py-1 rounded bg-background border border-border text-text-primary"
          />
        </label>
      </div>
      <div className="flex items-center justify-end gap-1.5 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-2 py-1 text-[10px] rounded text-text-tertiary hover:text-text-primary"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-2 py-1 text-[10px] rounded bg-accent text-background font-medium"
        >
          Save
        </button>
      </div>
    </div>
  )
}
