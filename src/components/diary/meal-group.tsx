'use client'

import { useState } from 'react'
import { ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { deleteLog, updateLog } from '@/lib/api/logs.api'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { formatMacroGrams, formatMacroKcal } from '@/lib/macros'
import type { FoodLogItem, FoodPayload, Log } from '@/types/logs.types'

interface MealGroupProps {
  mealType: string
  items: Log[]
  onAddFood: () => void
  onDeleteLog: (id: string) => void
}

export function MealGroup({ mealType, items, onAddFood, onDeleteLog }: MealGroupProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteLog, setConfirmDeleteLog] = useState<Log | null>(null)
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

  const handleDelete = async (logId: string) => {
    setDeletingId(logId)
    try {
      await deleteLog(logId)
      onDeleteLog(logId)
      toast.success('Removed')
    } catch {
      toast.error('Failed to remove')
    } finally {
      setDeletingId(null)
      setConfirmDeleteLog(null)
    }
  }

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
              <div className="flex items-center gap-3 px-4 py-2.5">
                {hasChildren ? (
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
                ) : null}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{payload.food_name}</p>
                  <p className="text-[11px] text-text-tertiary tabular-nums">
                    {payload.quantity_g ? `${payload.quantity_g}g` : '1 serving'}
                    {cals > 0 && ` · ${formatMacroKcal(cals)} cal`}
                    {protein > 0 && <> · <span className="text-info">{formatMacroGrams(protein)} P</span></>}
                    {carbsVal > 0 && <> · <span className="text-warning">{formatMacroGrams(carbsVal)} C</span></>}
                    {fatVal > 0 && <> · <span className="text-purple-400">{formatMacroGrams(fatVal)} F</span></>}
                  </p>
                </div>
                <button
                  onClick={() => setConfirmDeleteLog(item)}
                  disabled={deletingId === item.id}
                  className="p-1.5 rounded-full text-text-tertiary hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  aria-label="Remove food"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

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
        <button
          onClick={onAddFood}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs text-accent hover:underline"
        >
          <Plus className="w-3.5 h-3.5" />
          Add to {mealType}
        </button>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={confirmDeleteLog !== null}
        onClose={() => setConfirmDeleteLog(null)}
        onConfirm={() => {
          if (confirmDeleteLog) {
            return handleDelete(confirmDeleteLog.id)
          }
        }}
        title="Delete food log?"
        description={`This will remove ${
          confirmDeleteLog
            ? (confirmDeleteLog.payload as FoodPayload).food_name
            : 'this item'
        } from your diary.`}
        confirmLabel="Delete"
        variant="danger"
      />
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
