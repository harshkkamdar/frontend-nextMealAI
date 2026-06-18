'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, Star, X, Plus, Minus, MessageCircle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useUIStore } from '@/stores/ui.store'
import { searchFoods, updateFood, saveFood, getRecentFoods } from '@/lib/api/foods.api'
import { createLog, createLogs, updateLog, deleteLog } from '@/lib/api/logs.api'
import type { CreateLogInput } from '@/types/logs.types'
import { formatMacroGrams, formatMacroKcal, quantizeMacros } from '@/lib/macros'
import type { FoodSearchResult } from '@/types/foods.types'
import type { Log, FoodPayload } from '@/types/logs.types'

function FoodRow({ food, onSelect, onToggleFavorite }: {
  food: FoodSearchResult
  onSelect: (food: FoodSearchResult) => void
  onToggleFavorite: (food: FoodSearchResult) => void
}) {
  return (
    <div
      role="option"
      aria-selected={false}
      tabIndex={0}
      onClick={() => onSelect(food)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(food)
        }
      }}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-hover transition-colors text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary truncate">{food.name}</p>
        <p className="text-[11px] text-text-tertiary">
          {formatMacroKcal(food.macros_per_serving.calories)} cal
          {food.serving_size_g ? ` · per ${food.serving_size_g}g` : ''}
          {food.brand ? ` · ${food.brand}` : ''}
          {food.source === 'usda' && ' · USDA'}
        </p>
      </div>

      {food.source === 'personal' && food.id && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(food) }}
          className="p-1 shrink-0"
        >
          <Star
            className={`w-4 h-4 ${food.is_favorite ? 'fill-warning text-warning' : 'text-text-tertiary'}`}
          />
        </button>
      )}

      <div className="w-8 h-8 rounded-full bg-accent-light flex items-center justify-center shrink-0">
        <Plus className="w-4 h-4 text-accent" />
      </div>
    </div>
  )
}

interface FoodSearchSheetProps {
  isOpen: boolean
  onClose: () => void
  mealType: string
  onFoodLogged: () => void
  /** FB-R5-03 — edit an existing log instead of creating one. */
  mode?: 'log' | 'edit'
  existingLog?: Log
  onLogUpdated?: (logId: string, payload: FoodPayload) => void
  onLogDeleted?: (logId: string) => void
}

export function FoodSearchSheet({ isOpen, onClose, mealType, onFoodLogged, mode, existingLog, onLogUpdated, onLogDeleted }: FoodSearchSheetProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null)
  const [servings, setServings] = useState(1)
  const [inputMode, setInputMode] = useState<'servings' | 'grams'>('servings')
  const [grams, setGrams] = useState<number | ''>(100)
  const [saving, setSaving] = useState(false)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customCalories, setCustomCalories] = useState<number | ''>('')
  const [customProtein, setCustomProtein] = useState<number | ''>('')
  const [customCarbs, setCustomCarbs] = useState<number | ''>('')
  const [customFat, setCustomFat] = useState<number | ''>('')
  const [customServingG, setCustomServingG] = useState<number | ''>(100)
  const [recentFoods, setRecentFoods] = useState<FoodSearchResult[]>([])
  // FE-RCA F3 — multi-select pending tray. Each entry carries enough state
  // to reconstruct a CreateLogInput at commit time. The atom of work the
  // user expresses ("log breakfast") commits as N rows via createLogs().
  const [pending, setPending] = useState<Array<{
    food: FoodSearchResult
    inputMode: 'servings' | 'grams'
    servings: number
    grams: number
    quantity_g: number
    est_macros: { calories: number; protein: number; carbs: number; fat: number }
  }>>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on open / prefill state in edit mode
  useEffect(() => {
    if (!isOpen) return
    if (mode === 'edit' && existingLog) {
      const payload = existingLog.payload as FoodPayload
      const servingSize = payload.servings && payload.quantity_g
        ? Math.round(payload.quantity_g / payload.servings)
        : null
      setSelectedFood({
        id: payload.user_food_id ?? null,
        usda_fdc_id: undefined,
        name: payload.food_name,
        brand: undefined,
        serving_size_g: servingSize ?? payload.quantity_g ?? 100,
        macros_per_serving: payload.est_macros ?? { calories: 0, protein: 0, carbs: 0, fat: 0 },
        source: 'personal',
        is_favorite: false,
        use_count: 0,
      })
      if (typeof payload.servings === 'number' && payload.servings > 0) {
        setInputMode('servings')
        setServings(payload.servings)
        setGrams(servingSize ?? payload.quantity_g ?? 100)
      } else {
        setInputMode('grams')
        setGrams(payload.quantity_g ?? 0)
        setServings(1)
      }
      setQuery('')
      setResults([])
      setShowCustomForm(false)
      setCustomName('')
      setCustomCalories('')
      setCustomProtein('')
      setCustomCarbs('')
      setCustomFat('')
      setCustomServingG(100)
      return
    }
    // existing reset path for mode === 'log'
    setQuery('')
    setResults([])
    setSelectedFood(null)
    setServings(1)
    setInputMode('servings')
    setGrams(100)
    setShowCustomForm(false)
    setCustomName('')
    setCustomCalories('')
    setCustomProtein('')
    setCustomCarbs('')
    setCustomFat('')
    setCustomServingG(100)
    setPending([])  // FE-RCA F3 — clear pending tray on each fresh open
    setTimeout(() => inputRef.current?.focus(), 300)
    getRecentFoods(8).then((foods) =>
      setRecentFoods(foods.map((f) => ({
        id: f.id,
        usda_fdc_id: f.usda_fdc_id,
        name: f.name,
        brand: f.brand,
        serving_size_g: f.serving_size_g,
        macros_per_serving: f.macros_per_serving,
        source: 'personal' as const,
        is_favorite: f.is_favorite,
        use_count: f.use_count,
      })))
    ).catch(() => {})
  }, [isOpen, mode, existingLog])

  // Clean up debounce on unmount
  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  // Debounced search
  const handleSearch = useCallback((q: string) => {
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (q.trim().length < 2) {
      setResults([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const data = await searchFoods(q.trim())
        setResults(data)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
  }, [])

  const handleToggleFavorite = async (food: FoodSearchResult) => {
    if (!food.id || food.source === 'usda') return
    try {
      await updateFood(food.id, { is_favorite: !food.is_favorite })
      setResults((prev) =>
        prev.map((f) => f.id === food.id ? { ...f, is_favorite: !f.is_favorite } : f)
      )
    } catch {}
  }

  const handleSelectFood = (food: FoodSearchResult) => {
    setSelectedFood(food)
    setServings(1)
    setGrams(food.serving_size_g || 100)
    setInputMode('servings')
  }

  // Shared payload builder used by handleConfirmLog, handleAddToMeal, and
  // handleCommitMeal so the three paths cannot diverge.
  const buildFoodPayload = (): FoodPayload | null => {
    if (!selectedFood || !calculatedMacros) return null
    const quantity = inputMode === 'servings'
      ? Math.round((selectedFood.serving_size_g || 100) * servings)
      : Math.round(grams || 0)
    return {
      food_name: selectedFood.name,
      quantity_g: quantity,
      // FE-RCA F4 — quantize at the persistence boundary, not just at render.
      est_macros: quantizeMacros(calculatedMacros),
      meal_type: mealType.toLowerCase(),
      user_food_id: selectedFood.id || undefined,
      servings: inputMode === 'servings' ? servings : undefined,
    }
  }

  const handleConfirmLog = async () => {
    // FE-RCA F3 — if there's a non-empty pending tray, the user wants the
    // multi-item meal commit. Otherwise (or if they just searched + tapped
    // one food), commit the single selection.
    if (pending.length > 0) {
      return handleCommitMeal()
    }
    if (!selectedFood) return
    const payload = buildFoodPayload()
    if (!payload) return

    setSaving(true)
    try {
      await createLog({ type: 'food', payload, source: 'manual' })
      toast.success(`${selectedFood.name} logged`)
      onFoodLogged()
    } catch {
      toast.error('Failed to log food')
    } finally {
      setSaving(false)
    }
  }

  // FE-RCA F3 — adds the current confirmation view's food to the pending tray
  // and returns to the search view so the user can keep adding. Does NOT
  // commit to the BE.
  const handleAddToMeal = () => {
    if (!selectedFood || !calculatedMacros) return
    const quantity = inputMode === 'servings'
      ? Math.round((selectedFood.serving_size_g || 100) * servings)
      : Math.round(grams || 0)
    setPending((prev) => [
      ...prev,
      {
        food: selectedFood,
        inputMode,
        servings,
        grams: typeof grams === 'number' ? grams : selectedFood.serving_size_g || 100,
        quantity_g: quantity,
        est_macros: quantizeMacros(calculatedMacros),
      },
    ])
    // Return to search for the next item.
    setSelectedFood(null)
    setQuery('')
    setResults([])
    setServings(1)
    setInputMode('servings')
    setGrams(100)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleRemovePendingItem = (idx: number) => {
    setPending((prev) => prev.filter((_, i) => i !== idx))
  }

  // FE-RCA F3 — commits all pending tray items plus the currently-selected
  // food (if any) as one batch via createLogs(). Uses the API client's batch
  // surface, which today fans out to N parallel createLog calls but will
  // switch to BE Phase 6a `/v1/logs/batch` once the plural endpoint ships
  // without changing any caller.
  const handleCommitMeal = async () => {
    const items: CreateLogInput[] = pending.map((p) => ({
      type: 'food',
      payload: {
        food_name: p.food.name,
        quantity_g: p.quantity_g,
        est_macros: p.est_macros,
        meal_type: mealType.toLowerCase(),
        user_food_id: p.food.id || undefined,
        servings: p.inputMode === 'servings' ? p.servings : undefined,
      },
      source: 'manual',
    }))
    // Include the currently-selected (un-added) food if present.
    const selectedPayload = buildFoodPayload()
    if (selectedPayload) {
      items.push({ type: 'food', payload: selectedPayload, source: 'manual' })
    }
    if (items.length === 0) return

    setSaving(true)
    try {
      const { created, failures } = await createLogs(items)
      if (failures.length === 0) {
        toast.success(
          items.length === 1
            ? `${(items[0].payload as FoodPayload).food_name} logged`
            : `Logged ${created.length} items`,
        )
      } else if (created.length > 0) {
        toast.error(`Logged ${created.length} of ${items.length} items — some failed`)
      } else {
        toast.error('Failed to log meal')
      }
      onFoodLogged()
    } catch {
      toast.error('Failed to log meal')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!existingLog || !selectedFood) return
    setSaving(true)
    const quantity = inputMode === 'servings'
      ? Math.round((selectedFood.serving_size_g || 100) * servings)
      : Math.round((typeof grams === 'number' ? grams : 0))
    // FE-RCA F4 — quantize at the persistence boundary. Previously a no-op edit
    // wrote `calculatedMacros` directly (unrounded floats), so a 1.0-serving
    // re-save round-tripped `118` as `117.99999999999999` in the DB while the
    // render layer rounded it back to 118. Dashboards aggregating the noisy
    // float diverged from the display.
    const macros = quantizeMacros(
      calculatedMacros ?? (existingLog.payload as FoodPayload).est_macros ?? null
    )
    const updated: Partial<FoodPayload> = {
      quantity_g: quantity,
      servings: inputMode === 'servings' ? servings : undefined,
      est_macros: macros,
    }
    try {
      await updateLog(existingLog.id, updated)
      onLogUpdated?.(existingLog.id, { ...(existingLog.payload as FoodPayload), ...updated })
      toast.success('Updated')
      onClose()
    } catch {
      toast.error('Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEdit = async () => {
    if (!existingLog) return
    setSaving(true)
    try {
      await deleteLog(existingLog.id)
      onLogDeleted?.(existingLog.id)
      toast.success('Removed')
      onClose()
    } catch {
      toast.error('Failed to remove')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCustomFood = async () => {
    if (!customName.trim()) { toast.error('Food name is required'); return }
    if (customCalories === '' && customProtein === '' && customCarbs === '' && customFat === '') {
      toast.error('Add at least one macro value')
      return
    }
    setSaving(true)
    try {
      // FE-RCA F4 — quantize custom-food macros too so direct user input
      // (e.g. 24.5g protein) round-trips cleanly.
      const macros = quantizeMacros({
        calories: typeof customCalories === 'number' ? customCalories : 0,
        protein: typeof customProtein === 'number' ? customProtein : 0,
        carbs: typeof customCarbs === 'number' ? customCarbs : 0,
        fat: typeof customFat === 'number' ? customFat : 0,
      })
      // Save to personal food database
      await saveFood({
        name: customName.trim(),
        serving_size_g: customServingG || 100,
        macros_per_serving: macros,
        source: 'manual',
      })
      // Also log it immediately
      await createLog({
        type: 'food',
        payload: {
          food_name: customName.trim(),
          quantity_g: customServingG || 100,
          est_macros: macros,
          meal_type: mealType.toLowerCase(),
        },
        source: 'manual',
      })
      toast.success(`${customName.trim()} saved & logged`)
      onFoodLogged()
    } catch {
      toast.error('Failed to save food')
    } finally {
      setSaving(false)
    }
  }

  const handleAskGeo = () => {
    onClose()
    useUIStore.getState().openSheet('geo-companion')
  }

  const effectiveMultiplier = selectedFood
    ? inputMode === 'servings'
      ? servings
      : (grams || 0) / (selectedFood.serving_size_g || 100)
    : 1

  // Raw (unrounded) values — rounding happens at render via formatMacroGrams / formatMacroKcal
  // (single source of truth, matches backend roundMacros rules).
  const calculatedMacros = selectedFood ? {
    calories: (selectedFood.macros_per_serving.calories ?? 0) * effectiveMultiplier,
    protein: (selectedFood.macros_per_serving.protein ?? 0) * effectiveMultiplier,
    carbs: (selectedFood.macros_per_serving.carbs ?? 0) * effectiveMultiplier,
    fat: (selectedFood.macros_per_serving.fat ?? 0) * effectiveMultiplier,
  } : null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="food-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
          />

          <motion.div
            key="food-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="food-sheet-title"
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl flex flex-col"
            style={{ maxHeight: '85vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3">
              <h2 id="food-sheet-title" className="text-base font-semibold text-text-primary">
                {mode === 'edit'
                  ? `Edit ${(existingLog?.payload as FoodPayload | undefined)?.food_name ?? 'food'}`
                  : pending.length > 0
                    ? `Add to ${mealType} · ${pending.length} in meal`
                    : `Add to ${mealType}`}
              </h2>
              <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-full hover:bg-surface-hover">
                <X className="w-4 h-4 text-text-secondary" />
              </button>
            </div>

            {selectedFood ? (
              /* Confirmation view */
              <>
              <div className="flex-1 overflow-y-auto px-4 pb-6">
                {mode !== 'edit' && (
                  <button
                    onClick={() => setSelectedFood(null)}
                    className="text-xs text-accent mb-3 hover:underline"
                  >
                    &larr; Back to search
                  </button>
                )}

                <div className="bg-surface border border-border rounded-xl p-4 mb-4">
                  <p className="text-base font-semibold text-text-primary">{selectedFood.name}</p>
                  {selectedFood.brand && (
                    <p className="text-xs text-text-secondary">{selectedFood.brand}</p>
                  )}
                  <p className="text-[11px] text-text-tertiary mt-1">
                    Per serving ({selectedFood.serving_size_g}g)
                  </p>
                </div>

                {/* Input mode toggle */}
                <div className="mb-4">
                  <div className="flex rounded-lg bg-surface border border-border p-0.5 mb-3">
                    <button
                      onClick={() => setInputMode('servings')}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        inputMode === 'servings'
                          ? 'bg-accent text-white'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      Servings
                    </button>
                    <button
                      onClick={() => {
                        setInputMode('grams')
                        setGrams(Math.round((selectedFood?.serving_size_g || 100) * servings))
                      }}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        inputMode === 'grams'
                          ? 'bg-accent text-white'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      Grams
                    </button>
                  </div>

                  {inputMode === 'servings' ? (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setServings(Math.max(0.25, servings - 0.25))}
                        aria-label="Decrease servings"
                        className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-surface-hover"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        value={servings}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === '') return
                          const num = Number(val)
                          if (!isNaN(num) && num > 0) setServings(Math.round(num * 4) / 4)
                        }}
                        onBlur={() => { if (!servings || servings < 0.25) setServings(0.25) }}
                        aria-label="Servings"
                        className="w-20 text-xl font-semibold text-text-primary tabular-nums text-center bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        onClick={() => setServings(servings + 0.25)}
                        aria-label="Increase servings"
                        className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-surface-hover"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setGrams(Math.max(1, (grams || 0) - 10))}
                        aria-label="Decrease grams"
                        className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-surface-hover"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={grams}
                          onChange={(e) => {
                            const val = e.target.value
                            if (val === '') { setGrams(''); return }
                            const num = Number(val)
                            if (!isNaN(num)) setGrams(Math.max(0, Math.round(num)))
                          }}
                          onBlur={() => { if (grams === '' || grams === 0) setGrams(1) }}
                          aria-label="Grams"
                          className="w-20 text-xl font-semibold text-text-primary tabular-nums text-center bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-sm text-text-tertiary">g</span>
                      </div>
                      <button
                        onClick={() => setGrams((grams || 0) + 10)}
                        aria-label="Increase grams"
                        className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-surface-hover"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Macro preview */}
                {calculatedMacros && (
                  <div className="grid grid-cols-4 gap-2 mb-6">
                    <div className="bg-surface border border-border rounded-lg p-2.5 text-center">
                      <p className="text-sm font-semibold text-text-primary">{formatMacroKcal(calculatedMacros.calories)}</p>
                      <p className="text-[9px] text-text-tertiary">kcal</p>
                    </div>
                    <div className="bg-surface border border-border rounded-lg p-2.5 text-center">
                      <p className="text-sm font-semibold text-info">{formatMacroGrams(calculatedMacros.protein)}</p>
                      <p className="text-[9px] text-text-tertiary">protein</p>
                    </div>
                    <div className="bg-surface border border-border rounded-lg p-2.5 text-center">
                      <p className="text-sm font-semibold text-warning">{formatMacroGrams(calculatedMacros.carbs)}</p>
                      <p className="text-[9px] text-text-tertiary">carbs</p>
                    </div>
                    <div className="bg-surface border border-border rounded-lg p-2.5 text-center">
                      <p className="text-sm font-semibold text-purple">{formatMacroGrams(calculatedMacros.fat)}</p>
                      <p className="text-[9px] text-text-tertiary">fat</p>
                    </div>
                  </div>
                )}

              </div>
              {/* Sticky footer button(s) */}
              <div className="px-4 pb-20 pt-2 border-t border-border">
                {mode === 'edit' ? (
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={handleDeleteEdit} disabled={saving} className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10">
                      Delete
                    </Button>
                    <Button onClick={handleSaveEdit} disabled={saving || !selectedFood} className="flex-1 bg-accent hover:bg-accent-hover text-white">
                      Save
                    </Button>
                  </div>
                ) : (
                  /* FE-RCA F3 — multi-select footer.
                     "+ Add to meal" stages the current selection in the pending tray
                     and returns to search so the user can add another item without
                     re-opening the sheet. "Log meal (N)" / "Log Food" commits via
                     the batch createLogs() surface. */
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleAddToMeal}
                      disabled={saving || (inputMode === 'grams' && !grams)}
                      className="flex-1"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add to meal
                    </Button>
                    <Button
                      onClick={handleConfirmLog}
                      disabled={saving || (inputMode === 'grams' && !grams)}
                      className="flex-1 bg-accent hover:bg-accent-hover text-white"
                    >
                      {saving
                        ? 'Logging...'
                        : pending.length > 0
                          ? `Log meal (${pending.length + 1})`
                          : 'Log Food'}
                    </Button>
                  </div>
                )}
              </div>
              </>
            ) : (
              /* Search view */
              <>
                {/* Search input */}
                <div className="px-4 pb-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <Input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Search foods..."
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* FE-RCA F3 — pending tray summary. Only visible in log mode
                    and only when at least one item has been staged. Lets the
                    user review/remove items before committing the meal. */}
                {mode !== 'edit' && pending.length > 0 && (
                  <div className="px-4 pb-3">
                    <div className="bg-surface border border-border rounded-xl p-3 space-y-2">
                      <p className="text-[11px] font-medium text-text-tertiary uppercase tracking-wide">
                        In this meal · {pending.length}
                      </p>
                      <ul className="space-y-1.5">
                        {pending.map((item, idx) => (
                          <li
                            key={`pending-${idx}-${item.food.id ?? item.food.name}`}
                            className="flex items-center justify-between gap-2 text-sm"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-text-primary truncate">{item.food.name}</p>
                              <p className="text-[11px] text-text-tertiary tabular-nums">
                                {item.inputMode === 'servings'
                                  ? `${item.servings} × ${item.food.serving_size_g ?? 100}g`
                                  : `${item.quantity_g}g`}
                                {' · '}
                                {formatMacroKcal(item.est_macros.calories)} cal
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemovePendingItem(idx)}
                              aria-label={`Remove ${item.food.name}`}
                              className="p-1 text-text-tertiary hover:text-destructive shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                      <Button
                        onClick={handleCommitMeal}
                        disabled={saving}
                        className="w-full bg-accent hover:bg-accent-hover text-white"
                      >
                        {saving ? 'Logging...' : `Log meal (${pending.length})`}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Results */}
                <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
                  {searching && (
                    <div className="flex justify-center py-6">
                      <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}

                  {!searching && results.length > 0 && (
                    <div className="space-y-1" role="listbox" aria-label="Food search results">
                      {results.map((food, i) => (
                        <FoodRow
                          key={food.id ?? `usda-${food.usda_fdc_id ?? i}`}
                          food={food}
                          onSelect={handleSelectFood}
                          onToggleFavorite={handleToggleFavorite}
                        />
                      ))}
                    </div>
                  )}

                  {!searching && query.length >= 2 && results.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-sm text-text-secondary mb-3">No results found</p>
                      <button
                        onClick={() => { setShowCustomForm(true); setCustomName(query) }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full bg-accent hover:bg-accent-hover text-white"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add &ldquo;{query}&rdquo; as custom food
                      </button>
                    </div>
                  )}

                  {!searching && query.length < 2 && recentFoods.length > 0 ? (
                    <div>
                      <p className="text-[11px] font-medium text-text-tertiary uppercase tracking-wide mb-2">Recent</p>
                      <div className="space-y-1" role="listbox" aria-label="Recent foods">
                        {recentFoods.map((food, i) => (
                          <FoodRow
                            key={food.id ?? `recent-${i}`}
                            food={food}
                            onSelect={handleSelectFood}
                            onToggleFavorite={handleToggleFavorite}
                          />
                        ))}
                      </div>
                    </div>
                  ) : !searching && query.length < 2 ? (
                    <div className="text-center py-8 space-y-4">
                      <p className="text-sm text-text-tertiary">Type to search foods</p>
                    </div>
                  ) : null}
                </div>

                {/* Bottom actions */}
                <div className="px-4 pb-4 border-t border-border pt-3 flex items-center justify-between">
                  <button
                    onClick={handleAskGeo}
                    className="flex items-center gap-1.5 text-xs text-accent hover:underline"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Ask Geo to estimate
                  </button>
                  <button
                    onClick={() => setShowCustomForm(true)}
                    className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add custom food
                  </button>
                </div>
              </>
            )}

            {/* Custom food form overlay */}
            {showCustomForm && !selectedFood && (
              <div className="flex-1 overflow-y-auto px-4 pb-6">
                <button
                  onClick={() => setShowCustomForm(false)}
                  className="text-xs text-accent mb-3 hover:underline"
                >
                  &larr; Back to search
                </button>

                <h3 className="text-sm font-semibold text-text-primary mb-4">Create Custom Food</h3>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-text-secondary">Food Name</Label>
                    <Input
                      type="text"
                      placeholder="e.g. Mom's Dal Rice"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-text-secondary">Serving Size (g)</Label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={customServingG}
                      onChange={(e) => setCustomServingG(e.target.value ? Number(e.target.value) : '')}
                    />
                  </div>

                  <p className="text-[10px] font-medium uppercase tracking-wide text-text-tertiary mt-2">Macros per serving</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-text-secondary">Calories</Label>
                      <Input type="number" placeholder="kcal" value={customCalories} onChange={(e) => setCustomCalories(e.target.value ? Number(e.target.value) : '')} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-text-secondary">Protein (g)</Label>
                      <Input type="number" placeholder="g" value={customProtein} onChange={(e) => setCustomProtein(e.target.value ? Number(e.target.value) : '')} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-text-secondary">Carbs (g)</Label>
                      <Input type="number" placeholder="g" value={customCarbs} onChange={(e) => setCustomCarbs(e.target.value ? Number(e.target.value) : '')} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-text-secondary">Fat (g)</Label>
                      <Input type="number" placeholder="g" value={customFat} onChange={(e) => setCustomFat(e.target.value ? Number(e.target.value) : '')} />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSaveCustomFood}
                  disabled={saving || !customName.trim()}
                  className="w-full bg-accent hover:bg-accent-hover text-white mt-4"
                >
                  {saving ? 'Saving...' : 'Save & Log'}
                </Button>

                <p className="text-[10px] text-text-tertiary text-center mt-2">
                  This food will be saved to your personal database for quick access later
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
