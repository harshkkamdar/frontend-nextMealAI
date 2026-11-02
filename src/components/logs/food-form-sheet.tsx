'use client'

import { useState, type FormEvent, type InputHTMLAttributes } from 'react'
import { toast } from 'sonner'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { saveFood, updateFood } from '@/lib/api/foods.api'
import { haptic } from '@/lib/platform/app'
import type { UserFood } from '@/types/foods.types'
import { FIELD } from './log-ui'
import { FieldLabel } from './manual-log-shell'

/** Add a food, or edit one (name and macros; the API takes no serving or brand change). */
export function FoodFormSheet({ open, food, initialName = '', onClose, onSaved }: {
  open: boolean
  food: UserFood | null
  initialName?: string
  onClose: () => void
  onSaved: (food: UserFood) => void
}) {
  const m = food?.macros_per_serving
  const [name, setName] = useState(food?.name ?? initialName)
  const [brand, setBrand] = useState('')
  const [servingSize, setServingSize] = useState('100')
  const [calories, setCalories] = useState(m?.calories != null ? String(m.calories) : '')
  const [protein, setProtein] = useState(m?.protein != null ? String(m.protein) : '')
  const [carbs, setCarbs] = useState(m?.carbs != null ? String(m.carbs) : '')
  const [fat, setFat] = useState(m?.fat != null ? String(m.fat) : '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) {
      toast.error('Give the food a name')
      return
    }
    const macros = { calories: parseInt(calories) || 0, protein: parseFloat(protein) || 0, carbs: parseFloat(carbs) || 0, fat: parseFloat(fat) || 0 }
    setSaving(true)
    try {
      const saved = food
        ? await updateFood(food.id, { name: name.trim(), macros_per_serving: macros })
        : await saveFood({ name: name.trim(), brand: brand.trim() || undefined, serving_size_g: parseFloat(servingSize) || 100, macros_per_serving: macros, source: 'manual', is_favorite: false })
      onSaved(food ? { ...food, ...saved, name: name.trim(), macros_per_serving: macros } : saved)
      void haptic('success')
      toast.success(food ? 'Food updated' : 'Food saved')
    } catch {
      toast.error("Couldn't save that food. Try again.")
    } finally {
      setSaving(false)
    }
  }

  const field = (id: string, label: string, value: string, set: (v: string) => void, props: InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="min-w-0">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input id={id} value={value} onChange={(event) => set(event.target.value)} className={`${FIELD} h-14`} {...props} />
    </div>
  )

  return (
    <BottomSheet open={open} onClose={onClose} ariaLabel={food ? 'Edit food' : 'Add a food'}>
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-2 pt-2">
          <h2 className="text-headline text-ink">{food ? 'Edit food' : 'Add a food'}</h2>
          {field('food-name', 'Name', name, setName, { type: 'text', placeholder: 'Overnight oats', autoFocus: !food })}
          {food ? null : field('food-brand', 'Brand, optional', brand, setBrand, { type: 'text' })}
          <div className="grid grid-cols-2 gap-3">
            {food ? null : field('food-serving', 'Serving, g', servingSize, setServingSize, { type: 'number', inputMode: 'decimal' })}
            {field('food-kcal', 'Calories', calories, setCalories, { type: 'number', inputMode: 'numeric' })}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {field('food-protein', 'Protein, g', protein, setProtein, { type: 'number', inputMode: 'decimal' })}
            {field('food-carbs', 'Carbs, g', carbs, setCarbs, { type: 'number', inputMode: 'decimal' })}
            {field('food-fat', 'Fat, g', fat, setFat, { type: 'number', inputMode: 'decimal' })}
          </div>
        </div>
        <div className="px-4 pb-4 pt-3">
          <PrimaryButton type="submit" disabled={saving} aria-busy={saving}>
            {saving ? 'Saving…' : food ? 'Save changes' : 'Save food'}
          </PrimaryButton>
        </div>
      </form>
    </BottomSheet>
  )
}
