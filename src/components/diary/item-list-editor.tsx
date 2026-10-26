'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Pencil } from 'lucide-react'
import { formatMacroGrams, formatMacroKcal } from '@/lib/macros'
import type { FoodLogItem } from '@/types/logs.types'

/**
 * The components of an itemised (photo) log inside the edit sheet (journey-food "Edit a logged item", itemised):
 * one row per item with its kcal and a pencil that opens four number fields in place. Edits stay local until Save.
 */
export function ItemListEditor({ items, onChange }: { items: FoodLogItem[]; onChange: (items: FoodLogItem[]) => void }) {
  const [editing, setEditing] = useState<number | null>(null)
  return (
    <section aria-label="Items">
      <p className="mb-2 px-1 text-label text-ink-65">{items.length} item{items.length === 1 ? '' : 's'} from your photo</p>
      <ul className="overflow-hidden rounded-card bg-card shadow-[var(--shadow-card)]">
        {items.map((item, idx) => (
          <li key={idx} className="border-b border-ink-06 py-2 pl-4 pr-1 last:border-b-0">
            {editing === idx ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }} className="py-1 pr-3">
                <ItemEditForm
                  item={item}
                  onCancel={() => setEditing(null)}
                  onSave={(updated) => { onChange(items.map((current, i) => (i === idx ? updated : current))); setEditing(null) }}
                />
              </motion.div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-body-sm font-semibold text-ink [overflow-wrap:anywhere]">{item.name}</p>
                  <p className="text-caption text-ink-65 tabular-nums">
                    {item.quantity_label ? `${item.quantity_label} · ` : item.quantity_g ? `${item.quantity_g} g · ` : ''}
                    {formatMacroGrams(item.est_macros.protein ?? 0)} P · {formatMacroGrams(item.est_macros.carbs ?? 0)} C · {formatMacroGrams(item.est_macros.fat ?? 0)} F
                  </p>
                </div>
                <span className="text-body font-bold text-ink tabular-nums">{formatMacroKcal(item.est_macros.calories ?? 0)}</span>
                <button type="button" onClick={() => setEditing(idx)} aria-label={`Edit ${item.name}`} className="grid size-11 shrink-0 place-items-center rounded-full text-ink-65 transition-transform active:scale-[.94]">
                  <Pencil className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

function ItemEditForm({ item, onCancel, onSave }: { item: FoodLogItem; onCancel: () => void; onSave: (updated: FoodLogItem) => void }) {
  const [calories, setCalories] = useState(String(item.est_macros.calories ?? 0))
  const [protein, setProtein] = useState(String(item.est_macros.protein ?? 0))
  const [carbs, setCarbs] = useState(String(item.est_macros.carbs ?? 0))
  const [fat, setFat] = useState(String(item.est_macros.fat ?? 0))
  // Negative or non-numeric input clamps to 0 (the backend rejects negative macros).
  const num = (value: string) => Math.max(0, Number(value) || 0)

  const fields = [
    ['Calories', calories, setCalories],
    ['Protein (g)', protein, setProtein],
    ['Carbs (g)', carbs, setCarbs],
    ['Fat (g)', fat, setFat],
  ] as const

  return (
    <div className="space-y-3">
      <p className="font-semibold text-ink">{item.name}</p>
      <div className="grid grid-cols-2 gap-2">
        {fields.map(([label, value, setter]) => (
          <label key={label} className="space-y-1 text-caption font-semibold text-ink-65">
            <span>{label}</span>
            <input type="number" inputMode="decimal" min={0} value={value} onChange={(event) => setter(event.target.value)} className="h-11 w-full rounded-[14px] border-0 bg-ink-04 text-center text-body font-semibold text-ink tabular-nums outline-none focus-visible:outline-[1.5px] focus-visible:outline-ink" />
          </label>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="h-11 rounded-full px-4 text-body-sm font-semibold text-ink-65 transition-transform active:scale-[.97]">Cancel</button>
        <button
          type="button"
          onClick={() => onSave({ ...item, est_macros: { calories: num(calories), protein: num(protein), carbs: num(carbs), fat: num(fat) } })}
          className="h-11 rounded-full bg-ink px-5 text-body-sm font-semibold text-cream transition-transform active:scale-[.97]"
        >
          Done
        </button>
      </div>
    </div>
  )
}
