'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { motion, useReducedMotion } from 'framer-motion'
import { ChevronDown, Pencil } from 'lucide-react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { ChevronRightIcon, PlusIcon } from '@/components/ui/fiqr/icons'
import { reducedFade, spring } from '@/lib/motion'
import { updateLog } from '@/lib/api/logs.api'
import { formatMacroGrams, formatMacroKcal } from '@/lib/macros'
import type { FoodLogItem, FoodPayload, Log } from '@/types/logs.types'

function formatQuantity(payload: FoodPayload): string {
  const servings = typeof payload.servings === 'number' ? payload.servings : undefined
  const label = typeof payload.serving_label === 'string' ? payload.serving_label.trim() : ''
  if (servings !== undefined && label) {
    const plural = servings === 1 || /s$/i.test(label) ? label : `${label}s`
    return `${servings} ${plural}`
  }
  if (servings !== undefined) return `${servings} serving${servings === 1 ? '' : 's'}`
  if (payload.quantity_g) return `${payload.quantity_g}g`
  return '1 serving'
}

interface MealGroupProps {
  mealType: string
  items: Log[]
  onAddFood: () => void
  onEditLog?: (log: Log) => void
  isToday?: boolean
  onCopyToToday?: () => void
  onSaveFavourite?: () => void
  /** First paint of the session: the section rises in with the others (motion-feel 3e). */
  enterDelay?: number
}

const ROW = 'flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition-transform active:scale-[.98]'

/** "Add breakfast", "Add a snack". */
const addLabel = (mealType: string) => (mealType === 'Snack' ? 'Add a snack' : `Add ${mealType.toLowerCase()}`)

export function MealGroup({ mealType, items, onAddFood, onEditLog, isToday = true, onCopyToToday, onSaveFavourite, enterDelay }: MealGroupProps) {
  const reduce = useReducedMotion()
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const [editingChild, setEditingChild] = useState<{ logId: string; idx: number } | null>(null)
  const [actionsOpen, setActionsOpen] = useState(false)

  const calories = items.reduce(
    (total, item) => total + ((item.payload as FoodPayload).est_macros?.calories ?? 0),
    0,
  )

  const toggleExpand = (logId: string) => {
    setExpandedLogs((previous) => {
      const next = new Set(previous)
      if (next.has(logId)) next.delete(logId)
      else next.add(logId)
      return next
    })
  }

  const runAction = (action?: () => void) => {
    setActionsOpen(false)
    action?.()
  }

  const glide = reduce ? reducedFade : spring.glide

  return (
    <motion.section
      layout="position"
      initial={enterDelay === undefined ? false : reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...glide, delay: enterDelay ?? 0, layout: glide }}
      aria-label={mealType}
    >
      {/* The whole header opens the meal's actions. */}
      <h2 className="mb-1">
        <button
          type="button"
          onClick={() => setActionsOpen(true)}
          aria-label={`${mealType} actions${calories > 0 ? `, ${formatMacroKcal(calories)} kcal` : ''}`}
          aria-haspopup="dialog"
          className="flex min-h-11 w-full items-center gap-2 pl-1 text-left transition-transform active:scale-[.98]"
        >
          <span className="min-w-0 flex-1 text-[17px] font-semibold text-ink">{mealType}</span>
          {calories > 0 ? <span className="text-[14px] font-medium text-ink-65 tabular-nums">{formatMacroKcal(calories)} kcal</span> : null}
          <ChevronDown className="size-4 shrink-0 text-ink-35" strokeWidth={2} aria-hidden="true" />
        </button>
      </h2>

      {items.length === 0 ? (
        <button
          type="button"
          onClick={onAddFood}
          className="flex min-h-16 w-full items-center gap-3 rounded-[22px] border-[1.5px] border-dashed border-ink-20 px-4 text-left text-[15px] font-semibold text-ink-65 transition-transform active:scale-[.98]"
        >
          <span className="grid size-8 place-items-center rounded-full bg-ink-06 text-ink"><PlusIcon className="size-4" /></span>
          {addLabel(mealType)}
        </button>
      ) : (
        <div className="overflow-hidden rounded-[22px] bg-card shadow-[var(--shadow-card)]">
          {items.map((item) => {
            const payload = item.payload as FoodPayload
            const children = payload.items ?? []
            const hasChildren = children.length > 0
            const isExpanded = expandedLogs.has(item.id)
            const childrenListId = `diary-items-${item.id}`

            return (
              <motion.div key={item.id} layout="position" transition={glide} className="border-b border-ink-06">
                {hasChildren ? (
                  <button type="button" onClick={() => toggleExpand(item.id)} aria-expanded={isExpanded} aria-controls={childrenListId} aria-label="Expand items" className={ROW}>
                    <FoodRowCopy payload={payload} />
                    <ChevronDown aria-hidden="true" strokeWidth={1.75} className={`size-5 shrink-0 text-ink-65 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                ) : (
                  <button type="button" onClick={() => onEditLog?.(item)} aria-label={`Edit ${payload.food_name}`} className={ROW}>
                    <FoodRowCopy payload={payload} />
                  </button>
                )}

                {hasChildren && isExpanded ? (
                  <motion.ul
                    id={childrenListId}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={reduce ? reducedFade : { opacity: { duration: 0.18 }, y: spring.glide }}
                    className="mx-4 mb-3 overflow-hidden rounded-[16px] bg-ink-04"
                  >
                    {children.map((child, idx) => {
                      const key = `${item.id}:${idx}`
                      const isEditing = editingChild?.logId === item.id && editingChild.idx === idx
                      return (
                        <li key={key} className="border-b border-ink-06 py-2 pl-4 pr-1 text-[14px] last:border-b-0">
                          {isEditing ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }} className="py-1 pr-3">
                              <ChildEditForm
                                child={child}
                                onCancel={() => setEditingChild(null)}
                                onSave={async (updated) => {
                                  const nextItems = children.map((current, childIndex) => childIndex === idx ? updated : current)
                                  try {
                                    await updateLog(item.id, { items: nextItems })
                                    toast.success('Updated')
                                    setEditingChild(null)
                                  } catch {
                                    toast.error("Couldn't save that. Try again.")
                                  }
                                }}
                              />
                            </motion.div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-2 break-words font-semibold text-ink">
                                  {child.name}
                                  {child.quantity_label ? <span className="font-normal text-ink-65"> · {child.quantity_label}</span> : child.quantity_g ? <span className="font-normal text-ink-65"> · {child.quantity_g}g</span> : null}
                                </p>
                                <p className="text-[13px] text-ink-65 tabular-nums">{formatMacroKcal(child.est_macros.calories ?? 0)} kcal · {formatMacroGrams(child.est_macros.carbs ?? 0)} C · {formatMacroGrams(child.est_macros.fat ?? 0)} F</p>
                              </div>
                              <button type="button" onClick={() => setEditingChild({ logId: item.id, idx })} aria-label="Edit item" className="grid size-11 shrink-0 place-items-center rounded-full text-ink-65 transition-transform active:scale-[.94]">
                                <Pencil className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
                              </button>
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </motion.ul>
                ) : null}
              </motion.div>
            )
          })}
          <motion.div layout="position" transition={glide}>
            <button type="button" onClick={onAddFood} aria-label={`Add food to ${mealType}`} className="flex min-h-[52px] w-full items-center gap-2 px-4 text-[15px] font-semibold text-ink-65 transition-transform active:scale-[.98]">
              <PlusIcon className="size-4" />Add food
            </button>
          </motion.div>
        </div>
      )}

      <BottomSheet open={actionsOpen} onClose={() => setActionsOpen(false)} ariaLabel={`${mealType} actions`}>
        <div className="px-4 pb-5 pt-2">
          <h2 className="mb-3 px-1 text-[22px] font-bold tracking-[-0.3px] text-ink">{mealType}</h2>
          <div className="overflow-hidden rounded-[22px] bg-card shadow-[var(--shadow-card)]">
            <ActionRow label={addLabel(mealType)} onClick={() => runAction(onAddFood)} />
            {!isToday && onCopyToToday ? <ActionRow label="Copy to today" onClick={() => runAction(onCopyToToday)} /> : null}
            {onSaveFavourite ? <ActionRow label="Save as meal" onClick={() => runAction(onSaveFavourite)} /> : null}
          </div>
        </div>
      </BottomSheet>
    </motion.section>
  )
}

function FoodRowCopy({ payload }: { payload: FoodPayload }) {
  const macros = payload.est_macros
  return (
    <>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 break-words text-[15.5px] font-semibold leading-snug text-ink">{payload.food_name}</p>
        <p aria-hidden="true" className="mt-0.5 truncate text-[13px] text-ink-65 tabular-nums">
          {formatQuantity(payload)} · {formatMacroGrams(macros?.protein ?? 0)} P · {formatMacroGrams(macros?.carbs ?? 0)} C · {formatMacroGrams(macros?.fat ?? 0)} F
        </p>
      </div>
      <span className="min-w-[72px] shrink-0 text-right text-[15px] font-semibold text-ink tabular-nums">
        {formatMacroKcal(macros?.calories ?? 0)}<span className="text-[13px] font-medium text-ink-65"> kcal</span>
      </span>
    </>
  )
}

function ActionRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-14 w-full items-center justify-between border-b border-ink-06 px-4 py-3 text-left text-[16px] font-semibold text-ink last:border-b-0 active:bg-ink-04">
      {label}
      <ChevronRightIcon className="size-4 text-ink-35" />
    </button>
  )
}

function ChildEditForm({ child, onCancel, onSave }: { child: FoodLogItem; onCancel: () => void; onSave: (updated: FoodLogItem) => void | Promise<void> }) {
  const [calories, setCalories] = useState(String(child.est_macros.calories ?? 0))
  const [protein, setProtein] = useState(String(child.est_macros.protein ?? 0))
  const [carbs, setCarbs] = useState(String(child.est_macros.carbs ?? 0))
  const [fat, setFat] = useState(String(child.est_macros.fat ?? 0))
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ ...child, est_macros: { calories: Number(calories) || 0, protein: Number(protein) || 0, carbs: Number(carbs) || 0, fat: Number(fat) || 0 } })
    } finally {
      setSaving(false)
    }
  }

  const fields = [
    ['Calories', calories, setCalories],
    ['Protein (g)', protein, setProtein],
    ['Carbs (g)', carbs, setCarbs],
    ['Fat (g)', fat, setFat],
  ] as const

  return (
    <div className="space-y-3">
      <p className="font-semibold text-ink">{child.name}</p>
      <div className="grid grid-cols-2 gap-2">
        {fields.map(([label, value, setter]) => (
          <label key={label} className="space-y-1 text-[13px] font-semibold text-ink-65">
            <span>{label}</span>
            <input type="number" inputMode="decimal" value={value} onChange={(event) => setter(event.target.value)} className="h-11 w-full rounded-[14px] border-0 bg-card text-center text-[16px] font-semibold text-ink tabular-nums shadow-[var(--shadow-card)] outline-none focus-visible:outline-[1.5px] focus-visible:outline-ink" />
          </label>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={saving} className="h-11 rounded-full px-4 text-[15px] font-semibold text-ink-65 transition-transform active:scale-[.97]">Cancel</button>
        <button type="button" onClick={handleSave} disabled={saving} className="h-11 rounded-full bg-ink px-5 text-[15px] font-semibold text-cream transition-transform active:scale-[.97] disabled:opacity-60">{saving ? 'Saving' : 'Save'}</button>
      </div>
    </div>
  )
}
