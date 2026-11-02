'use client'

import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { formatMacroKcal } from '@/lib/macros'
import { haptic } from '@/lib/platform/app'
import { cn } from '@/lib/utils'
import type { FoodSearchResult } from '@/types/foods.types'
import { portionText, scaleMacros, type Macros, type PlateItem } from './log-math'

export const SOURCE_LABELS: Record<string, string> = {
  personal: 'Yours',
  manual: 'Yours',
  geo_estimate: 'Yours',
  open_food_facts: 'Open Food Facts',
  openfoodfacts: 'Open Food Facts',
  off: 'Open Food Facts',
  usda: 'USDA',
}

const round1 = (n: number) => Math.round(n * 10) / 10
const round2 = (n: number) => Math.round(n * 100) / 100
const fmt = (n: number) => String(round1(n))
const amountText = (n: number) => String(round2(n))

/** "● 46.5 g protein ● 0 g carbs ● 5.4 g fat", each dot in its macro hue. */
export function MacroDots({ macros, className }: { macros: Macros; className?: string }) {
  const parts = [
    { label: 'protein', value: macros.protein, dot: 'bg-ink' },
    { label: 'carbs', value: macros.carbs, dot: 'bg-macro-teal' },
    { label: 'fat', value: macros.fat, dot: 'bg-macro-ochre' },
  ]
  return (
    <p className={`flex flex-wrap gap-x-3 gap-y-1 text-caption text-ink-80 tabular-nums ${className ?? ''}`}>
      {parts.map((part) => (
        <span key={part.label} className="flex items-center gap-1.5">
          <span aria-hidden="true" className={cn('size-1.5 rounded-full', part.dot)} />
          <b className="font-bold text-ink">{fmt(part.value)} g</b> {part.label}
        </span>
      ))}
    </p>
  )
}

let plateSeed = 0
export const plateKey = () => `plate-${++plateSeed}`

/** One food at a chosen portion, as a plate item. */
export function plateItemFor(food: FoodSearchResult, servings: number | null, grams: number, override?: Macros): PlateItem {
  const serving = food.serving_size_g || 100
  return {
    key: plateKey(),
    name: food.name,
    grams,
    portion: portionText(servings, grams),
    macros: override ?? scaleMacros(food.macros_per_serving, serving, grams),
    user_food_id: food.source === 'personal' && food.id ? food.id : undefined,
    servings: servings ?? undefined,
    serving_size_g: servings == null ? undefined : serving,
  }
}

/**
 * The item sheet (journey-log B2): editable servings or grams, the macros for that amount, and
 * "Edit the numbers" for a label that disagrees. Add to meal puts it on the plate; Log now logs the plate with it.
 */
export function FoodItemSheet({ food, onClose, onAdd, onLogNow }: {
  food: FoodSearchResult | null
  onClose: () => void
  onAdd: (item: PlateItem) => void
  onLogNow: (item: PlateItem) => void
}) {
  const [shown, setShown] = useState(food)
  const [servings, setServings] = useState(1)
  const [servingsInput, setServingsInput] = useState('1')
  const [grams, setGrams] = useState(food?.serving_size_g || 100)
  const [gramsInput, setGramsInput] = useState(String(food?.serving_size_g || 100))
  const [editing, setEditing] = useState(false)
  const [override, setOverride] = useState<Macros | null>(null)

  // A new food resets the sheet (state adjusted during render); the last one stays rendered while the sheet slides away.
  if (food && food !== shown) {
    setShown(food)
    setServings(1)
    setServingsInput('1')
    setGrams(food.serving_size_g || 100)
    setGramsInput(String(food.serving_size_g || 100))
    setEditing(false)
    setOverride(null)
  }

  if (!shown) return <BottomSheet open={false} onClose={onClose} ariaLabel="Food">{null}</BottomSheet>
  const serving = shown.serving_size_g || 100
  const macros = override ?? scaleMacros(shown.macros_per_serving, serving, grams)
  const source = SOURCE_LABELS[shown.source] ?? 'Database'
  const setAmount = (nextServings: number, nextGrams: number, nextServingsInput = amountText(nextServings), nextGramsInput = amountText(nextGrams)) => {
    setOverride((current) => current && grams > 0 ? {
      calories: Math.round(current.calories * nextGrams / grams),
      protein: round1(current.protein * nextGrams / grams),
      carbs: round1(current.carbs * nextGrams / grams),
      fat: round1(current.fat * nextGrams / grams),
    } : current)
    setServings(nextServings)
    setServingsInput(nextServingsInput)
    setGrams(nextGrams)
    setGramsInput(nextGramsInput)
  }
  const stepServings = (direction: 1 | -1) => {
    void haptic('selection')
    const next = Math.max(0.5, round2(servings + direction * 0.5))
    setAmount(next, round2(next * serving))
  }
  const item = () => plateItemFor(shown, servings, grams, override ?? undefined)
  const amountLabel = portionText(servings, grams)

  return (
    <BottomSheet open={!!food} onClose={onClose} ariaLabel={shown.name}>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-2" data-testid="food-item-sheet">
        <h2 className="line-clamp-2 text-headline text-ink">{shown.name}</h2>
        <p className="mt-0.5 truncate text-caption text-ink-65">{source} · 1 serving is {serving} g{shown.brand ? ` · ${shown.brand}` : ''}</p>
        <div className="mt-3 flex items-baseline justify-between gap-3">
          <p className="text-ink tabular-nums"><b className="text-hero" data-testid="item-kcal">{formatMacroKcal(macros.calories)}</b> <span className="text-caption text-ink-65">kcal</span></p>
          <p className="text-caption text-ink-65 tabular-nums">{amountLabel}</p>
        </div>
        <MacroDots macros={macros} className="mt-1" />

        <div className="mt-4 flex items-center justify-center gap-1">
          <button type="button" aria-label="Fewer servings" disabled={servings <= 0.5} onClick={() => stepServings(-1)} className="grid size-11 shrink-0 place-items-center rounded-full bg-ink-06 text-ink transition-transform active:scale-[.92] disabled:opacity-40">
            <Minus aria-hidden="true" className="size-4" />
          </button>
          <label className="flex min-w-0 flex-1 items-baseline justify-center gap-1 text-body-sm font-bold text-ink tabular-nums">
            <input
              type="number"
              inputMode="decimal"
              step="any"
              aria-label="Servings"
              value={servingsInput}
              onChange={(event) => {
                const value = event.target.value
                setServingsInput(value)
                const next = Number(value)
                if (next > 0) setAmount(next, round2(next * serving), value)
              }}
              onBlur={() => setServingsInput(amountText(servings))}
              className="w-[4ch] bg-transparent text-right text-body-sm font-bold text-ink outline-none tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-caption font-semibold text-ink-65">servings · {amountText(grams)} g</span>
          </label>
          <button type="button" aria-label="More servings" onClick={() => stepServings(1)} className="grid size-11 shrink-0 place-items-center rounded-full bg-ink-06 text-ink transition-transform active:scale-[.92]">
            <Plus aria-hidden="true" className="size-4" />
          </button>
        </div>
        <label className={cn('mt-2 flex h-11 w-full items-center gap-1 rounded-full bg-[var(--surface-card)] pl-3 pr-4 shadow-[0_0_0_1px_rgba(17,28,53,.1)] focus-within:shadow-[0_0_0_1.5px_var(--color-ink)]')}>
          <input
            type="number"
            inputMode="decimal"
            step="any"
            aria-label="Grams"
            value={gramsInput}
            onChange={(event) => {
              const value = event.target.value
              setGramsInput(value)
              const next = Number(value)
              if (next > 0) setAmount(round2(next / serving), next, amountText(round2(next / serving)), value)
            }}
            className="h-full min-w-0 flex-1 bg-transparent text-right text-body-sm font-bold text-ink outline-none tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-caption font-semibold text-ink-65">g</span>
        </label>

        {editing ? (
          <div className="mt-4 grid grid-cols-4 gap-2">
            {(['calories', 'protein', 'carbs', 'fat'] as const).map((key) => (
              <label key={key} className="rounded-[14px] bg-ink-04 px-2 pb-0.5 pt-2 text-center focus-within:outline focus-within:outline-[1.5px] focus-within:outline-ink">
                <span className="block text-label text-ink-65">{key === 'calories' ? 'kcal' : `${key.charAt(0).toUpperCase()}${key.slice(1)}, g`}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  aria-label={key === 'calories' ? 'Calories' : key.charAt(0).toUpperCase() + key.slice(1)}
                  value={macros[key]}
                  onChange={(event) => setOverride({ ...macros, [key]: Number(event.target.value) || 0 })}
                  className="h-11 w-full bg-transparent text-center text-body font-bold text-ink outline-none tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
              </label>
            ))}
          </div>
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="-ml-1 mt-2 min-h-11 px-1 text-body-sm font-semibold text-ink-80 underline decoration-ink-35 underline-offset-4">
            Edit the numbers
          </button>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" disabled={!(Number(gramsInput) > 0)} onClick={() => { void haptic('selection'); onAdd(item()) }} className="flex h-btn items-center justify-center gap-1.5 rounded-[15px] bg-ink-06 text-body font-bold text-ink transition-transform active:scale-[.97] disabled:opacity-40">
            <Plus aria-hidden="true" className="size-4" />Add to meal
          </button>
          <PrimaryButton type="button" disabled={!(Number(gramsInput) > 0)} onClick={() => onLogNow(item())}>Log now</PrimaryButton>
        </div>
      </div>
    </BottomSheet>
  )
}
