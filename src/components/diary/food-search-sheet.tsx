'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, Star, X, Plus, Minus, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useUIStore } from '@/stores/ui.store'
import { searchFoods, updateFood, saveFood } from '@/lib/api/foods.api'
import { createLog } from '@/lib/api/logs.api'
import { formatMacroGrams, formatMacroKcal } from '@/lib/macros'
import type { FoodSearchResult } from '@/types/foods.types'

interface FoodSearchSheetProps {
  isOpen: boolean
  onClose: () => void
  mealType: string
  onFoodLogged: () => void
}

export function FoodSearchSheet({ isOpen, onClose, mealType, onFoodLogged }: FoodSearchSheetProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null)
  const [servings, setServings] = useState(1)
  const [inputMode, setInputMode] = useState<'servings' | 'grams'>('servings')
  const [grams, setGrams] = useState<number>(100)
  const [saving, setSaving] = useState(false)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customCalories, setCustomCalories] = useState<number | ''>('')
  const [customProtein, setCustomProtein] = useState<number | ''>('')
  const [customCarbs, setCustomCarbs] = useState<number | ''>('')
  const [customFat, setCustomFat] = useState<number | ''>('')
  const [customServingG, setCustomServingG] = useState<number | ''>(100)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
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
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

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

  const handleConfirmLog = async () => {
    if (!selectedFood) return
    setSaving(true)

    const quantity = inputMode === 'servings'
      ? Math.round((selectedFood.serving_size_g || 100) * servings)
      : Math.round(grams)

    try {
      await createLog({
        type: 'food',
        payload: {
          food_name: selectedFood.name,
          quantity_g: quantity,
          est_macros: calculatedMacros!,
          meal_type: mealType.toLowerCase(),
          user_food_id: selectedFood.id || undefined,
          servings: inputMode === 'servings' ? servings : undefined,
        },
        source: 'manual',
      })
      toast.success(`${selectedFood.name} logged`)
      onFoodLogged()
    } catch {
      toast.error('Failed to log food')
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
      const macros = {
        calories: customCalories || 0,
        protein: customProtein || 0,
        carbs: customCarbs || 0,
        fat: customFat || 0,
      }
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
      : grams / (selectedFood.serving_size_g || 100)
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
                Add to {mealType}
              </h2>
              <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-full hover:bg-surface-hover">
                <X className="w-4 h-4 text-text-secondary" />
              </button>
            </div>

            {selectedFood ? (
              /* Confirmation view */
              <>
              <div className="flex-1 overflow-y-auto px-4 pb-6">
                <button
                  onClick={() => setSelectedFood(null)}
                  className="text-xs text-accent mb-3 hover:underline"
                >
                  &larr; Back to search
                </button>

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
                      <span className="text-xl font-semibold text-text-primary tabular-nums min-w-[48px] text-center">
                        {servings}
                      </span>
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
                        onClick={() => setGrams(Math.max(1, grams - 10))}
                        aria-label="Decrease grams"
                        className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-surface-hover"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={grams}
                          onChange={(e) => setGrams(Math.max(1, Number(e.target.value) || 1))}
                          aria-label="Grams"
                          className="w-20 text-xl font-semibold text-text-primary tabular-nums text-center bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-sm text-text-tertiary">g</span>
                      </div>
                      <button
                        onClick={() => setGrams(grams + 10)}
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
              {/* Sticky log button */}
              <div className="px-4 pb-20 pt-2 border-t border-border">
                <Button
                  onClick={handleConfirmLog}
                  disabled={saving}
                  className="w-full bg-accent hover:bg-accent-hover text-white"
                >
                  {saving ? 'Logging...' : 'Log Food'}
                </Button>
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
                        <div
                          key={food.id ?? `usda-${food.usda_fdc_id ?? i}`}
                          role="option"
                          aria-selected={false}
                          tabIndex={0}
                          onClick={() => handleSelectFood(food)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              handleSelectFood(food)
                            }
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-hover transition-colors text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-text-primary truncate">{food.name}</p>
                            <p className="text-[11px] text-text-tertiary">
                              {formatMacroKcal(food.macros_per_serving.calories)} cal
                              {food.brand ? ` · ${food.brand}` : ''}
                              {food.source === 'usda' && ' · USDA'}
                            </p>
                          </div>

                          {/* Favorite toggle (personal foods only) */}
                          {food.source === 'personal' && food.id && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleFavorite(food) }}
                              className="p-1 shrink-0"
                            >
                              <Star
                                className={`w-4 h-4 ${food.is_favorite ? 'fill-warning text-warning' : 'text-text-tertiary'}`}
                              />
                            </button>
                          )}

                          {/* Quick-add button */}
                          <div className="w-8 h-8 rounded-full bg-accent-light flex items-center justify-center shrink-0">
                            <Plus className="w-4 h-4 text-accent" />
                          </div>
                        </div>
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

                  {!searching && query.length < 2 && (
                    <div className="text-center py-8 space-y-4">
                      <p className="text-sm text-text-tertiary">Type to search foods</p>
                    </div>
                  )}
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
