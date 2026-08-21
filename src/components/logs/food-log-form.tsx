'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { X, MessageCircle, Camera, Loader2, Sparkles, Search, Plus, Trash2, Star, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createLog, createLogs } from '@/lib/api/logs.api'
import {
  estimateFoodFromPhoto,
  logFromEstimate,
  searchFoods,
  getPersonalFoods,
  type FoodEstimate,
} from '@/lib/api/foods.api'
import { buildFoodLogItems, type FoodDraft } from '@/lib/food-log'
import { formatMacroKcal } from '@/lib/macros'
import type { FoodSearchResult, UserFood } from '@/types/foods.types'

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

function capitalizeMeal(v: string | null): string {
  if (!v) return ''
  const c = v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()
  return MEAL_TYPES.includes(c) ? c : ''
}

export function FoodLogForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // R6-12 — the diary opens this page as its "Add food" flow, passing the meal
  // slot + the viewed date so the log lands on the right meal AND the right day
  // (not always "today"). Other entry points omit them → sensible defaults.
  const logDate = searchParams.get('date') || undefined
  const [saving, setSaving] = useState(false)
  const [foodName, setFoodName] = useState('')
  const [quantityG, setQuantityG] = useState<number | ''>('')
  const [mealType, setMealType] = useState(() => capitalizeMeal(searchParams.get('meal')))
  const [calories, setCalories] = useState<number | ''>('')
  const [protein, setProtein] = useState<number | ''>('')
  const [carbs, setCarbs] = useState<number | ''>('')
  const [fat, setFat] = useState<number | ''>('')

  // BUG-009 — database search + multi-add. The dedicated Log Food page now
  // searches the food DB (so users don't have to type macros by hand) and lets
  // them stage SEVERAL items before committing them as one meal via createLogs.
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [pending, setPending] = useState<FoodDraft[]>([])
  // Personal-food id of the currently-selected search result, so a DB-sourced
  // food stays linked (enables recents/favorites/dedup) instead of being logged
  // as free text. Cleared when the user manually edits the name (decouples).
  const [userFoodId, setUserFoodId] = useState<string | null>(null)
  // Per-gram macros of the selected search result, so changing the quantity
  // rescales the macros instead of leaving stale per-serving numbers (#8). Any
  // manual macro edit clears it — the user has taken control of the values.
  const [macroBasisPerG, setMacroBasisPerG] = useState<
    { calories: number; protein: number; carbs: number; fat: number } | null
  >(null)
  // R7-07 — servings selector (so "4 servings" is a tap, not gram math). When a
  // food with a known serving size is selected we default to Servings mode.
  const [servingSizeG, setServingSizeG] = useState<number | null>(null)
  const [inputMode, setInputMode] = useState<'servings' | 'grams'>('grams')
  const [servings, setServings] = useState<number>(1)
  // R7-02 — scroll the edit form into view when a food is tapped (it used to sit
  // at the bottom of the page, "cumbersome" to reach).
  const formRef = useRef<HTMLDivElement | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // FB-R6-13 — Photo estimate flow. When estimateId is set, Save calls
  // log-from-estimate (with edits) instead of the regular createLog path.
  const [estimating, setEstimating] = useState(false)
  const [estimateId, setEstimateId] = useState<string | null>(null)
  const [estimateConfidence, setEstimateConfidence] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // R6-12 — the user's own foods, shown FIRST (before searching) so logging a
  // usual food is one tap. `last_used_at`/`use_count` are populated server-side
  // now (R6-11), so recents/favourites are meaningful.
  const [personalFoods, setPersonalFoods] = useState<UserFood[]>([])

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  useEffect(() => {
    let alive = true
    getPersonalFoods()
      .then((foods) => { if (alive) setPersonalFoods(foods) })
      .catch(() => { /* non-fatal — search still works */ })
    return () => { alive = false }
  }, [])

  const favourites = useMemo(
    () => personalFoods.filter((f) => f.is_favorite).slice(0, 12),
    [personalFoods],
  )
  const recents = useMemo(() => {
    const favIds = new Set(favourites.map((f) => f.id))
    return personalFoods
      .filter((f) => f.last_used_at && !favIds.has(f.id))
      .sort((a, b) => new Date(b.last_used_at!).getTime() - new Date(a.last_used_at!).getTime())
      .slice(0, 8)
  }, [personalFoods, favourites])

  // Adapt a saved UserFood to the same selection path as a search result so a
  // tapped personal food prefills the form (and stays linked via user_food_id).
  const handleSelectPersonalFood = (f: UserFood) => {
    handleSelectResult({
      id: f.id,
      name: f.name,
      brand: f.brand,
      serving_size_g: f.serving_size_g,
      macros_per_serving: f.macros_per_serving,
      source: 'personal',
      is_favorite: f.is_favorite,
      use_count: f.use_count,
    })
  }

  const handleSearch = useCallback((q: string) => {
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.trim().length < 2) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        setResults(await searchFoods(q.trim()))
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
  }, [])

  const clearForm = () => {
    setFoodName('')
    setQuantityG('')
    setCalories('')
    setProtein('')
    setCarbs('')
    setFat('')
    setUserFoodId(null)
    setMacroBasisPerG(null)
    setServingSizeG(null)
    setInputMode('grams')
    setServings(1)
    clearEstimate()
  }

  // Rescale macros from the per-gram basis (when a DB food is the source).
  const rescaleMacros = (grams: number) => {
    if (macroBasisPerG && grams > 0) {
      setCalories(Math.round(macroBasisPerG.calories * grams))
      setProtein(Math.round(macroBasisPerG.protein * grams * 10) / 10)
      setCarbs(Math.round(macroBasisPerG.carbs * grams * 10) / 10)
      setFat(Math.round(macroBasisPerG.fat * grams * 10) / 10)
    }
  }

  // Set quantity (grams) and rescale macros so they never disagree with it.
  const handleQuantityChange = (val: number | '') => {
    setQuantityG(val)
    if (typeof val === 'number') rescaleMacros(val)
  }

  // R7-07 — servings changed → derive grams from serving_size_g and rescale.
  const handleServingsChange = (val: number) => {
    const s = Number.isFinite(val) && val > 0 ? val : 0
    setServings(s)
    if (servingSizeG && s > 0) {
      const grams = Math.round(s * servingSizeG)
      setQuantityG(grams)
      rescaleMacros(grams)
    }
  }

  // Tap a search result → prefill the form with its per-serving values so the
  // user can adjust quantity/macros or log immediately. Macros correspond to
  // serving_size_g (absolute for that quantity), matching the createLog shape.
  const handleSelectResult = (food: FoodSearchResult) => {
    const m = food.macros_per_serving
    setFoodName(food.name)
    setQuantityG(food.serving_size_g || 100)
    setCalories(m.calories ? Math.round(m.calories) : '')
    setProtein(m.protein ? Math.round(m.protein) : '')
    setCarbs(m.carbs ? Math.round(m.carbs) : '')
    setFat(m.fat ? Math.round(m.fat) : '')
    // Per-gram basis so editing the quantity rescales the macros (#8).
    const serving = food.serving_size_g || 100
    setMacroBasisPerG({
      calories: (m.calories ?? 0) / serving,
      protein: (m.protein ?? 0) / serving,
      carbs: (m.carbs ?? 0) / serving,
      fat: (m.fat ?? 0) / serving,
    })
    // R7-07 — enable Servings mode when the food has a known serving size.
    if (food.serving_size_g && food.serving_size_g > 0) {
      setServingSizeG(food.serving_size_g)
      setServings(1)
      setInputMode('servings')
    } else {
      setServingSizeG(null)
      setInputMode('grams')
    }
    // R7-02 — bring the editable form into view instead of leaving it at the bottom.
    requestAnimationFrame(() => {
      if (typeof formRef.current?.scrollIntoView === 'function') {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    })
    // Link to the personal food DB when this is a saved food (USDA results
    // have no personal id → stays null and logs as free text, as before).
    setUserFoodId(food.source === 'personal' ? food.id ?? null : null)
    clearEstimate()
    setQuery('')
    setResults([])
  }

  const currentDraft = (): FoodDraft => ({
    food_name: foodName.trim(),
    quantity_g: typeof quantityG === 'number' ? quantityG : undefined,
    est_macros: {
      calories: typeof calories === 'number' ? calories : undefined,
      protein: typeof protein === 'number' ? protein : undefined,
      carbs: typeof carbs === 'number' ? carbs : undefined,
      fat: typeof fat === 'number' ? fat : undefined,
    },
    meal_type: mealType || undefined,
    user_food_id: userFoodId || undefined,
  })

  // Stage the current form as one item and reset for the next (keep meal type).
  const handleAddAnother = () => {
    if (!foodName.trim()) { toast.error('Add a food first'); return }
    setPending((p) => [...p, currentDraft()])
    clearForm()
    setQuery('')
    setResults([])
  }

  const handleRemovePending = (idx: number) => {
    setPending((p) => p.filter((_, i) => i !== idx))
  }

  const populateFromEstimate = (est: FoodEstimate) => {
    if (est.error === 'no_food_identified' || est.items.length === 0) {
      toast.error("Couldn't identify food in that photo. Try a different angle.")
      return
    }
    // Aggregate macros from totals; foodName joins item names.
    const names = est.items.map((i) => i.name).join(', ')
    setFoodName(names)
    const totalQty = est.items.reduce((sum, i) => sum + (i.quantity_g ?? 0), 0)
    if (totalQty > 0) setQuantityG(Math.round(totalQty))
    setCalories(Math.round(est.totals.calories))
    setProtein(Math.round(est.totals.protein))
    setCarbs(Math.round(est.totals.carbs))
    setFat(Math.round(est.totals.fat))
    setEstimateId(est.estimate_id)
    setEstimateConfidence(est.confidence)
  }

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setEstimating(true)
    try {
      const est = await estimateFoodFromPhoto(file)
      populateFromEstimate(est)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Photo estimate failed')
    } finally {
      setEstimating(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const clearEstimate = () => {
    setEstimateId(null)
    setEstimateConfidence(null)
  }

  const handleSave = async () => {
    // BUG-009 — multi-add commit. When items are staged (and we're not in the
    // photo-estimate path), log the whole meal in one batch.
    if (!estimateId && pending.length > 0) {
      const items = buildFoodLogItems(pending, foodName.trim() ? currentDraft() : null, logDate)
      if (items.length === 0) { toast.error('Nothing to log'); return }
      setSaving(true)
      try {
        const { created, failures } = await createLogs(items)
        if (failures.length === 0) {
          toast.success(items.length === 1 ? 'Food logged' : `Logged ${created.length} items`)
        } else if (created.length > 0) {
          toast.error(`Logged ${created.length} of ${items.length} items — some failed`)
        } else {
          toast.error('Failed to log meal')
          return
        }
        router.back()
      } catch {
        toast.error('Failed to log food')
      } finally {
        setSaving(false)
      }
      return
    }

    if (!foodName.trim()) {
      toast.error('Food name is required')
      return
    }

    setSaving(true)
    try {
      if (estimateId) {
        // FB-R6-13 — Path A: convert estimate → log. Pass the (potentially
        // edited) name + macros as edits so BE merges them over the saved
        // estimate before creating the log row.
        const numCalories = typeof calories === 'number' ? calories : 0
        const numProtein = typeof protein === 'number' ? protein : 0
        const numCarbs = typeof carbs === 'number' ? carbs : 0
        const numFat = typeof fat === 'number' ? fat : 0
        await logFromEstimate(estimateId, {
          items: [
            {
              name: foodName.trim(),
              quantity_g: typeof quantityG === 'number' ? quantityG : undefined,
              calories: numCalories,
              protein: numProtein,
              carbs: numCarbs,
              fat: numFat,
              confidence: estimateConfidence ?? 0,
            },
          ],
          totals: {
            calories: numCalories,
            protein: numProtein,
            carbs: numCarbs,
            fat: numFat,
          },
        })
        toast.success('Logged from photo')
      } else {
        // Path B: regular manual log.
        await createLog({
          type: 'food',
          payload: {
            food_name: foodName.trim(),
            quantity_g: quantityG || undefined,
            est_macros: {
              calories: calories || undefined,
              protein: protein || undefined,
              carbs: carbs || undefined,
              fat: fat || undefined,
            },
            meal_type: mealType || undefined,
            user_food_id: userFoodId || undefined,
          },
          source: 'manual',
          // R6-12 — bucket onto the viewed diary date when opened from a past day.
          ...(logDate ? { local_date: logDate } : {}),
        })
        toast.success('Food logged')
      }
      router.back()
    } catch {
      toast.error('Failed to log food')
    } finally {
      setSaving(false)
    }
  }

  const hasCurrent = foodName.trim().length > 0
  const totalCount = pending.length + (hasCurrent ? 1 : 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="p-1">
          <X className="w-5 h-5 text-text-secondary" />
        </button>
        <h2 className="text-[17px] font-semibold text-text-primary">Log Food</h2>
        <div className="w-5" />
      </div>

      {/* FB-R6-13 — Photo estimate button (above meal-type chips, prominent) */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={estimating}
        data-testid="photo-estimate-button"
        className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-accent/40 bg-accent-light text-accent text-sm font-medium hover:bg-accent/10 transition-colors disabled:opacity-60"
      >
        {estimating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing photo…
          </>
        ) : (
          <>
            <Camera className="w-4 h-4" />
            Photo estimate
          </>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoSelect}
        className="hidden"
      />

      {/* Photo-estimate chip when an estimate is loaded */}
      {estimateId && (
        <div
          data-testid="estimate-chip"
          className="mb-4 flex items-center justify-between gap-2 rounded-xl bg-surface border border-border px-3 py-2"
        >
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs text-text-primary">
              From photo estimate
              {estimateConfidence != null && (
                <span className="text-text-tertiary">
                  {' '}· confidence {Math.round(estimateConfidence * 100)}%
                </span>
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={clearEstimate}
            aria-label="Clear photo estimate"
            className="text-text-tertiary hover:text-text-primary"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* BUG-009 — food database search. Tap a result to prefill the form. */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <Input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search foods…"
            className="pl-9"
            data-testid="food-search-input"
          />
        </div>
        {(searching || results.length > 0) && (
          <div className="mt-2 rounded-xl border border-border bg-surface overflow-hidden">
            {searching && (
              <div className="flex justify-center py-4">
                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!searching && results.map((food, i) => (
              <button
                key={food.id ?? `usda-${food.usda_fdc_id ?? i}`}
                type="button"
                onClick={() => handleSelectResult(food)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-hover transition-colors border-b border-border last:border-b-0"
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
                <div className="w-7 h-7 rounded-full bg-accent-light flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4 text-accent" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* R6-12 — Your foods (favourites + recents), shown FIRST before searching
          so logging a usual food is one tap. Hidden once the user starts typing
          a search or loads a photo estimate. */}
      {query.trim().length < 2 && !estimateId && (favourites.length > 0 || recents.length > 0) && (
        <div className="mb-4 space-y-3" data-testid="your-foods">
          {favourites.length > 0 && (
            <div>
              <p className="mb-1.5 flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
                <Star className="h-3 w-3" /> Favourites
              </p>
              <div className="rounded-xl border border-border bg-surface overflow-hidden">
                {favourites.map((f) => (
                  <PersonalFoodRow key={`fav-${f.id}`} food={f} onSelect={handleSelectPersonalFood} />
                ))}
              </div>
            </div>
          )}
          {recents.length > 0 && (
            <div>
              <p className="mb-1.5 flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
                <Clock className="h-3 w-3" /> Recent
              </p>
              <div className="rounded-xl border border-border bg-surface overflow-hidden">
                {recents.map((f) => (
                  <PersonalFoodRow key={`recent-${f.id}`} food={f} onSelect={handleSelectPersonalFood} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Meal type chips */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {MEAL_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setMealType(mealType === type ? '' : type)}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              mealType === type
                ? 'bg-accent border border-accent text-white'
                : 'bg-surface border border-border text-text-primary hover:bg-surface-hover'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Form fields */}
      <div className="space-y-4" ref={formRef}>
        <div className="space-y-1">
          <Label className="text-xs text-text-secondary">Food Name</Label>
          <Input
            type="text"
            placeholder="e.g. Grilled chicken breast"
            value={foodName}
            onChange={(e) => { setFoodName(e.target.value); setUserFoodId(null); setMacroBasisPerG(null) }}
          />
        </div>

        {/* R7-07 — Servings/Grams: pick "4 servings" without doing gram math.
            Only offered when a food with a known serving size is selected. */}
        {servingSizeG && servingSizeG > 0 ? (
          <div className="space-y-1.5">
            <div className="flex rounded-full bg-surface-hover p-0.5" data-testid="serving-mode-toggle">
              <button
                type="button"
                onClick={() => {
                  // switching to servings → seed from current grams
                  if (typeof quantityG === 'number' && quantityG > 0) setServings(Math.round((quantityG / servingSizeG) * 100) / 100)
                  setInputMode('servings')
                }}
                className={`flex-1 rounded-full py-1.5 text-sm transition-colors ${inputMode === 'servings' ? 'bg-accent text-white' : 'text-text-secondary'}`}
              >
                Servings
              </button>
              <button
                type="button"
                onClick={() => {
                  // switching to grams → seed grams from servings
                  setQuantityG(Math.round(servings * servingSizeG))
                  setInputMode('grams')
                }}
                className={`flex-1 rounded-full py-1.5 text-sm transition-colors ${inputMode === 'grams' ? 'bg-accent text-white' : 'text-text-secondary'}`}
              >
                Grams
              </button>
            </div>
            {inputMode === 'servings' ? (
              <div className="flex items-center gap-3">
                <button type="button" aria-label="Fewer servings" onClick={() => handleServingsChange(Math.max(0.25, Math.round((servings - 0.25) * 100) / 100))} className="w-9 h-9 rounded-full border border-border text-lg text-text-secondary">−</button>
                <div className="flex-1 text-center">
                  <span className="text-lg font-semibold tabular-nums" data-testid="servings-value">{servings}</span>
                  <span className="text-sm text-text-tertiary"> serving{servings === 1 ? '' : 's'}</span>
                  <p className="text-[11px] text-text-tertiary">{Math.round(servings * servingSizeG)}g</p>
                </div>
                <button type="button" aria-label="More servings" onClick={() => handleServingsChange(Math.round((servings + 0.25) * 100) / 100)} className="w-9 h-9 rounded-full border border-border text-lg text-text-secondary">+</button>
              </div>
            ) : (
              <Input
                type="number"
                placeholder="grams"
                value={quantityG}
                onChange={(e) => handleQuantityChange(e.target.value ? Number(e.target.value) : '')}
              />
            )}
          </div>
        ) : (
          <div className="space-y-1">
            <Label className="text-xs text-text-secondary">Quantity (g)</Label>
            <Input
              type="number"
              placeholder="Optional"
              value={quantityG}
              onChange={(e) => handleQuantityChange(e.target.value ? Number(e.target.value) : '')}
            />
          </div>
        )}

        {/* Macros 2x2 grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-text-secondary">Calories</Label>
            <Input
              type="number"
              placeholder="kcal"
              value={calories}
              onChange={(e) => { setCalories(e.target.value ? Number(e.target.value) : ''); setMacroBasisPerG(null) }}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-text-secondary">Protein</Label>
            <Input
              type="number"
              placeholder="g"
              value={protein}
              onChange={(e) => { setProtein(e.target.value ? Number(e.target.value) : ''); setMacroBasisPerG(null) }}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-text-secondary">Carbs</Label>
            <Input
              type="number"
              placeholder="g"
              value={carbs}
              onChange={(e) => { setCarbs(e.target.value ? Number(e.target.value) : ''); setMacroBasisPerG(null) }}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-text-secondary">Fat</Label>
            <Input
              type="number"
              placeholder="g"
              value={fat}
              onChange={(e) => { setFat(e.target.value ? Number(e.target.value) : ''); setMacroBasisPerG(null) }}
            />
          </div>
        </div>

        {/* Geo estimate link */}
        <button
          onClick={() => router.push('/chat')}
          className="flex items-center gap-1.5 text-accent text-[13px]"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Don&apos;t know macros? Ask Geo to estimate
        </button>
      </div>

      {/* BUG-009 — staged meal tray (multi-select). Review/remove before logging. */}
      {pending.length > 0 && (
        <div className="mt-5 bg-surface border border-border rounded-xl p-3 space-y-2" data-testid="food-meal-tray">
          <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
            In this meal · {pending.length}
          </p>
          <ul className="space-y-1.5">
            {pending.map((item, idx) => (
              <li key={`pending-${idx}-${item.food_name}`} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="text-text-primary truncate">{item.food_name}</p>
                  <p className="text-[11px] text-text-tertiary tabular-nums">
                    {item.quantity_g ? `${item.quantity_g}g` : 'qty —'}
                    {item.est_macros.calories ? ` · ${formatMacroKcal(item.est_macros.calories)} cal` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemovePending(idx)}
                  aria-label={`Remove ${item.food_name}`}
                  className="p-1 text-text-tertiary hover:text-destructive shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions — "Add another" stages the current item; Save logs everything.
          Add another is hidden in the photo-estimate path (single compound log). */}
      <div className="flex gap-2 mt-6">
        {!estimateId && (
          <Button
            variant="outline"
            onClick={handleAddAnother}
            disabled={saving || !hasCurrent}
            className="flex-1"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add another
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={saving || (totalCount === 0)}
          className="flex-1 bg-accent hover:bg-accent-hover text-white"
        >
          {saving
            ? 'Saving...'
            : pending.length > 0
              ? `Log meal (${totalCount})`
              : 'Save'}
        </Button>
      </div>
    </div>
  )
}

/** A tappable row for one of the user's saved foods (favourite or recent). */
function PersonalFoodRow({ food, onSelect }: { food: UserFood; onSelect: (f: UserFood) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(food)}
      data-testid="personal-food-row"
      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-hover transition-colors border-b border-border last:border-b-0"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary truncate">{food.name}</p>
        <p className="text-[11px] text-text-tertiary">
          {formatMacroKcal(food.macros_per_serving.calories)} cal
          {food.serving_size_g ? ` · per ${food.serving_size_g}g` : ''}
          {food.brand ? ` · ${food.brand}` : ''}
        </p>
      </div>
      <div className="w-7 h-7 rounded-full bg-accent-light flex items-center justify-center shrink-0">
        <Plus className="w-4 h-4 text-accent" />
      </div>
    </button>
  )
}
