'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { BottomSheet } from '@/components/ui/bottom-sheet'
import { SectionLabel } from '@/components/ui/fiqr/section-label'
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
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`size-6 shrink-0 text-ink-65 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 text-ink-65" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  )
}

export function MealGroup({ mealType, items, onAddFood, onEditLog, isToday = true, onCopyToToday, onSaveFavourite }: MealGroupProps) {
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

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-1">
          <SectionLabel>{mealType}</SectionLabel>
          {calories > 0 ? <span className="text-[11.5px] font-semibold text-ink-65">· {formatMacroKcal(calories)} kcal</span> : null}
        </div>
        <button type="button" onClick={() => setActionsOpen(true)} aria-label={`${mealType} actions`} className="flex size-6 shrink-0 items-center justify-center text-ink-65">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="currentColor">
            <circle cx="5" cy="12" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="19" cy="12" r="1.5" />
          </svg>
        </button>
      </div>

      <div className="overflow-hidden rounded-[16px] border border-ink-12 bg-card divide-y divide-ink-09">
        {items.length === 0 ? (
          <button type="button" onClick={onAddFood} className="flex min-h-14 w-full items-center justify-between gap-3 px-[14px] py-3 text-left">
            <span className="text-[15.5px] text-ink-65">Nothing logged</span>
            <span className="text-[13.5px] font-semibold text-ink">+</span>
          </button>
        ) : items.map((item) => {
          const payload = item.payload as FoodPayload
          const children = payload.items ?? []
          const hasChildren = children.length > 0
          const isExpanded = expandedLogs.has(item.id)
          const childrenListId = `diary-items-${item.id}`

          return (
            <div key={item.id}>
              {hasChildren ? (
                <button type="button" onClick={() => toggleExpand(item.id)} aria-expanded={isExpanded} aria-controls={childrenListId} aria-label="Expand items" className="flex min-h-14 w-full items-center justify-between gap-3 px-[14px] py-3 text-left">
                  <FoodRowCopy payload={payload} />
                  <Chevron expanded={isExpanded} />
                </button>
              ) : (
                <button type="button" onClick={() => onEditLog?.(item)} aria-label={`Edit ${payload.food_name}`} className="flex min-h-14 w-full items-center justify-between gap-3 px-[14px] py-3 text-left">
                  <FoodRowCopy payload={payload} />
                </button>
              )}

              {hasChildren && isExpanded ? (
                <ul id={childrenListId} className="divide-y divide-ink-09 border-t border-ink-09 bg-ink-08">
                  {children.map((child, idx) => {
                    const key = `${item.id}:${idx}`
                    const isEditing = editingChild?.logId === item.id && editingChild.idx === idx
                    return (
                      <li key={key} className="py-3 pl-7 pr-[14px] text-[13.5px]">
                        {isEditing ? (
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
                                toast.error('Failed to update')
                              }
                            }}
                          />
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold text-ink">
                                {child.name}
                                {child.quantity_label ? <span className="font-normal text-ink-65"> · {child.quantity_label}</span> : child.quantity_g ? <span className="font-normal text-ink-65"> · {child.quantity_g}g</span> : null}
                              </p>
                              <p className="text-[13px] text-ink-65">{formatMacroKcal(child.est_macros.calories ?? 0)} kcal · {formatMacroGrams(child.est_macros.carbs ?? 0)} C · {formatMacroGrams(child.est_macros.fat ?? 0)} F</p>
                            </div>
                            <button type="button" onClick={() => setEditingChild({ logId: item.id, idx })} aria-label="Edit item" className="shrink-0">
                              <PencilIcon />
                            </button>
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              ) : null}
            </div>
          )
        })}
      </div>

      <BottomSheet open={actionsOpen} onClose={() => setActionsOpen(false)} ariaLabel={`${mealType} actions`}>
        <div className="px-gutter pb-6 pt-2">
          <h2 className="mb-3 text-[22px] font-semibold tracking-[-0.4px] text-ink">{mealType}</h2>
          <div className="overflow-hidden rounded-[16px] border border-ink-12 bg-card divide-y divide-ink-09">
            <ActionRow label={`Add to ${mealType}`} onClick={() => runAction(onAddFood)} />
            {!isToday && onCopyToToday ? <ActionRow label="Copy to today" onClick={() => runAction(onCopyToToday)} /> : null}
            {onSaveFavourite ? <ActionRow label="Save as meal" onClick={() => runAction(onSaveFavourite)} /> : null}
          </div>
        </div>
      </BottomSheet>
    </section>
  )
}

function FoodRowCopy({ payload }: { payload: FoodPayload }) {
  const macros = payload.est_macros
  return (
    <>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15.5px] font-semibold text-ink">{payload.food_name}</p>
        <p aria-hidden="true" className="text-[13px] text-ink-65">{formatQuantity(payload)} · {formatMacroKcal(macros?.calories ?? 0)} kcal</p>
      </div>
      <span className="shrink-0 text-[13px] font-medium text-ink-65">{formatMacroGrams(macros?.carbs ?? 0)} C · {formatMacroGrams(macros?.fat ?? 0)} F</span>
    </>
  )
}

function ActionRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-14 w-full items-center justify-between px-[14px] py-3 text-left text-[15.5px] font-semibold text-ink">
      {label}
      <span aria-hidden="true" className="text-[13.5px] text-ink-65">+</span>
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
          <label key={label} className="space-y-1 text-[11px] font-semibold text-ink-65">
            <span>{label}</span>
            <input type="number" value={value} onChange={(event) => setter(event.target.value)} className="h-11 w-full rounded-[12px] border-0 bg-ink-08 text-center text-[15.5px] font-semibold text-ink outline-none" />
          </label>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={saving} className="h-9 rounded-full bg-ink-08 px-3 text-[13.5px] font-semibold text-ink">Cancel</button>
        <button type="button" onClick={handleSave} disabled={saving} className="h-9 rounded-full bg-ink px-3 text-[13.5px] font-semibold text-cream">Save</button>
      </div>
    </div>
  )
}
