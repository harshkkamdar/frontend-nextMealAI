'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Camera, ChevronLeft, FileText, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { FeatureCard } from '@/components/ui/fiqr/feature-card'
import { PrimaryButton as TrayButton } from '@/components/ui/fiqr/primary-button'
import { SecondaryButton } from '@/components/ui/fiqr/secondary-button'
import { SectionLabel } from '@/components/ui/fiqr/section-label'
import { createLog, createLogs } from '@/lib/api/logs.api'
import {
  estimateFoodFromPhoto,
  logFromEstimate,
  searchFoods,
  getPersonalFoods,
  type FoodEstimate,
} from '@/lib/api/foods.api'
import { buildFoodLogItems, isFoodDraftFilled, type FoodDraft } from '@/lib/food-log'
import { formatMacroKcal } from '@/lib/macros'
import { compressImage } from '@/lib/image/compress'
import { isNative } from '@/lib/platform'
import { pickPhoto } from '@/lib/platform/camera'
import type { FoodSearchResult, UserFood } from '@/types/foods.types'

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

const SOURCE_LABELS: Record<string, string> = {
  personal: 'Yours',
  open_food_facts: 'Open Food Facts',
  openfoodfacts: 'Open Food Facts',
  off: 'Open Food Facts',
  usda: 'USDA',
}

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
  const [mealType, setMealType] = useState(() => capitalizeMeal(searchParams.get('meal')) || 'Lunch')
  const [mealMenuOpen, setMealMenuOpen] = useState(false)
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
  const [searchFailed, setSearchFailed] = useState(false)
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
      setSearchFailed(false)
      try {
        setResults(await searchFoods(q.trim()))
      } catch {
        setResults([])
        setSearchFailed(true)
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

  const handlePhotoFile = async (file: File) => {
    setEstimating(true)
    try {
      const est = await estimateFoodFromPhoto(await compressImage(file))
      populateFromEstimate(est)
    } catch {
      toast.error("I couldn't read that photo. Try another angle with the whole plate in frame, or search for the food.")
    } finally {
      setEstimating(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void handlePhotoFile(file)
  }

  const handlePhotoButton = async () => {
    if (isNative()) {
      const file = await pickPhoto({ source: 'prompt' })
      if (file) await handlePhotoFile(file)
      return
    }
    fileInputRef.current?.click()
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
  const totalCalories = Math.round(
    pending.reduce((sum, item) => sum + (item.est_macros.calories ?? 0), 0)
      + (hasCurrent && typeof calories === 'number' ? calories : 0),
  )

  return (
    <div className="pb-40">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Back"
            className="-ml-2 flex size-10 items-center justify-center text-ink"
          >
            <ChevronLeft className="size-6" />
          </button>
          <h1 className="truncate text-[22px] font-semibold tracking-[-0.4px] text-ink">Log food</h1>
        </div>
        <button
          type="button"
          onClick={() => setMealMenuOpen((open) => !open)}
          aria-expanded={mealMenuOpen}
          className="flex h-11 shrink-0 items-center rounded-full bg-ink-08 px-3 text-[13.5px] font-semibold text-ink"
        >
          {mealType} <span aria-hidden="true" className="ml-1">▾</span>
        </button>
      </div>

      {mealMenuOpen ? (
        <div className="mb-4 flex gap-2 overflow-x-auto" aria-label="Meal type">
          {MEAL_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => { setMealType(type); setMealMenuOpen(false) }}
              className={`h-11 whitespace-nowrap rounded-full px-3 text-[13.5px] font-semibold ${
                mealType === type ? 'bg-ink text-cream' : 'bg-ink-08 text-ink'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      ) : null}

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-65" />
        <input
          type="text"
          value={query}
          onChange={(event) => handleSearch(event.target.value)}
          placeholder="Search foods, brands, or describe it"
          className="h-14 w-full rounded-[15px] border border-ink-16 bg-card pl-11 pr-4 text-[17px] text-ink outline-none placeholder:text-ink-65 focus:border-ink"
          data-testid="food-search-input"
        />
      </div>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => void handlePhotoButton()}
          disabled={estimating}
          data-testid="photo-estimate-button"
          className="flex h-11 items-center gap-2 rounded-full bg-ink-08 px-3 text-[13.5px] font-semibold text-ink disabled:text-ink-35"
        >
          <Camera className="size-4" />
          {estimating ? 'Analysing…' : 'Photo'}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/chat/session?id=${crypto.randomUUID()}&prefill=` + encodeURIComponent('Scan this menu and suggest what fits my remaining macros'))}
          className="flex h-11 items-center gap-2 rounded-full bg-ink-08 px-3 text-[13.5px] font-semibold text-ink"
        >
          <FileText className="size-4" />
          Menu
        </button>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />

      {searchFailed && !searching && query.trim().length >= 2 ? (
        <p role="status" className="mt-4 text-[15.5px] font-medium text-ink-80">Search isn&apos;t reachable right now. Try again, or use Photo or Menu.</p>
      ) : null}

      {(searching || results.length > 0) ? (
        <div className="mt-4 overflow-hidden rounded-[16px] border border-ink-12 bg-card divide-y divide-ink-09">
          {searching ? (
            <div className="flex min-h-14 items-center justify-center gap-1.5" role="status" aria-label="Searching">
              {[0, 1, 2].map((dot) => <span key={dot} className="size-2 animate-pulse rounded-full bg-ink-35" />)}
            </div>
          ) : results.map((food, index) => (
            <button
              key={food.id ?? `usda-${food.usda_fdc_id ?? index}`}
              type="button"
              onClick={() => handleSelectResult(food)}
              className="flex min-h-14 w-full items-center justify-between gap-3 px-[14px] py-2.5 text-left"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15.5px] font-semibold text-ink">{food.name}</span>
                {SOURCE_LABELS[String(food.source)] ? (
                  <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-[1.4px] text-ink-65">
                    {SOURCE_LABELS[String(food.source)]}
                  </span>
                ) : null}
                <span className="block truncate text-[13px] text-ink-65">
                  {food.serving_size_g ? `${food.serving_size_g}g` : '1 serving'} · {formatMacroKcal(food.macros_per_serving.calories)} kcal
                  {food.brand ? ` · ${food.brand}` : ''}
                </span>
              </span>
              <span className="shrink-0 text-[17px] font-semibold text-ink">+</span>
            </button>
          ))}
        </div>
      ) : null}

      {query.trim().length < 2 && !estimateId && (favourites.length > 0 || recents.length > 0) ? (
        <div className="mt-7 space-y-7" data-testid="your-foods">
          {recents.length > 0 ? (
            <div>
              <SectionLabel className="mb-2">Recent</SectionLabel>
              <div className="overflow-hidden rounded-[16px] border border-ink-12 bg-card divide-y divide-ink-09">
                {recents.map((food) => <PersonalFoodRow key={`recent-${food.id}`} food={food} onSelect={handleSelectPersonalFood} />)}
              </div>
            </div>
          ) : null}
          {favourites.length > 0 ? (
            <div>
              <SectionLabel className="mb-2">Favourites</SectionLabel>
              <div className="overflow-hidden rounded-[16px] border border-ink-12 bg-card divide-y divide-ink-09">
                {favourites.map((food) => <PersonalFoodRow key={`fav-${food.id}`} food={food} onSelect={handleSelectPersonalFood} />)}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {estimateId ? (
        <div data-testid="estimate-chip" className="mt-6 flex h-8 w-fit items-center gap-2 rounded-full bg-ink-08 px-3 text-[13px] font-medium text-ink">
          <span>
            Photo estimate
            {estimateConfidence != null ? ` · confidence ${Math.round(estimateConfidence * 100)}%` : ''}
          </span>
          <button type="button" onClick={clearEstimate} aria-label="Clear photo estimate" className="-my-3 -mr-3 flex size-11 items-center justify-center text-[18px] leading-none">×</button>
        </div>
      ) : null}

      {foodName ? (
        <div ref={formRef} className="mt-7 space-y-4 rounded-[16px] border border-ink-12 bg-card p-[14px]">
          {/* Wraps instead of clipping: photo estimates name the whole plate. */}
          <textarea
            rows={1}
            aria-label="Food name"
            placeholder="e.g. Grilled chicken breast"
            value={foodName}
            onChange={(event) => { setFoodName(event.target.value); setUserFoodId(null); setMacroBasisPerG(null) }}
            className="field-sizing-content min-h-14 w-full resize-none rounded-[15px] border border-ink-16 bg-card px-4 py-[15px] text-[15.5px] font-semibold leading-[1.35] text-ink outline-none placeholder:text-ink-65 focus:border-ink"
          />

          {servingSizeG && servingSizeG > 0 ? (
            <div className="space-y-3">
              {inputMode === 'servings' ? (
                <div className="flex items-center justify-between gap-3">
                  <button type="button" aria-label="Fewer servings" onClick={() => handleServingsChange(Math.max(0.25, Math.round((servings - 0.25) * 100) / 100))} className="flex size-11 items-center justify-center rounded-full bg-ink-08 text-[20px] font-semibold text-ink">−</button>
                  <div className="flex flex-1 items-baseline justify-center gap-2 text-center">
                    <span className="text-[15.5px] font-semibold text-ink">
                      <span data-testid="servings-value">{servings}</span> serving{servings === 1 ? '' : 's'}
                    </span>
                    <span className="text-[13px] text-ink-65">{Math.round(servings * servingSizeG)}g</span>
                  </div>
                  <button type="button" aria-label="More servings" onClick={() => handleServingsChange(Math.round((servings + 0.25) * 100) / 100)} className="flex size-11 items-center justify-center rounded-full bg-ink-08 text-[20px] font-semibold text-ink">+</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    aria-label="Grams"
                    type="number"
                    value={quantityG}
                    onChange={(event) => handleQuantityChange(event.target.value ? Number(event.target.value) : '')}
                    className="h-11 min-w-0 flex-1 rounded-[12px] border-0 bg-ink-08 px-3 text-center text-[15.5px] font-semibold text-ink outline-none"
                  />
                  <span className="text-[13px] text-ink-65">g</span>
                </div>
              )}
              <div className="flex gap-2" data-testid="serving-mode-toggle">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof quantityG === 'number' && quantityG > 0) setServings(Math.round((quantityG / servingSizeG) * 100) / 100)
                    setInputMode('servings')
                  }}
                  className={`h-11 rounded-full px-4 text-[14px] font-semibold ${inputMode === 'servings' ? 'bg-ink text-cream' : 'bg-ink-08 text-ink'}`}
                >
                  servings
                </button>
                <button
                  type="button"
                  onClick={() => { setQuantityG(Math.round(servings * servingSizeG)); setInputMode('grams') }}
                  className={`h-11 rounded-full px-4 text-[14px] font-semibold ${inputMode === 'grams' ? 'bg-ink text-cream' : 'bg-ink-08 text-ink'}`}
                >
                  grams
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                aria-label="Quantity in grams"
                type="number"
                placeholder="Quantity"
                value={quantityG}
                onChange={(event) => handleQuantityChange(event.target.value ? Number(event.target.value) : '')}
                className="h-11 min-w-0 flex-1 rounded-[12px] border-0 bg-ink-08 px-3 text-center text-[15.5px] font-semibold text-ink outline-none placeholder:text-ink-65"
              />
              <span className="text-[13px] text-ink-65">g</span>
            </div>
          )}

          <div className="grid grid-cols-4 gap-2">
            <MacroInput label="KCAL" value={calories} onChange={(value) => { setCalories(value); setMacroBasisPerG(null) }} />
            <MacroInput label="P" value={protein} onChange={(value) => { setProtein(value); setMacroBasisPerG(null) }} />
            <MacroInput label="C" value={carbs} onChange={(value) => { setCarbs(value); setMacroBasisPerG(null) }} />
            <MacroInput label="F" value={fat} onChange={(value) => { setFat(value); setMacroBasisPerG(null) }} />
          </div>

          <button type="button" onClick={() => router.push('/chat')} className="text-[13.5px] font-semibold text-ink-65">
            Ask Geo to estimate
          </button>

          {!estimateId ? (
            <SecondaryButton onNavy={false} type="button" onClick={handleAddAnother} disabled={saving || !hasCurrent}>
              Add to tray
            </SecondaryButton>
          ) : null}
        </div>
      ) : null}


      {(pending.length > 0 || isFoodDraftFilled(currentDraft())) ? (
        <FeatureCard
          data-testid="food-meal-tray"
          className="sticky z-30 mt-6"
          style={{ bottom: 'calc(96px + var(--safe-bottom))' }}
        >
          <p className="text-[11.5px] font-semibold uppercase tracking-[1.8px] text-cream-55">Tray</p>
          <p className="mt-1 text-[17px] font-bold text-cream">
            {totalCount} item{totalCount === 1 ? '' : 's'} · {formatMacroKcal(totalCalories)} kcal
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {pending.map((item, index) => (
              <span key={`pending-${index}-${item.food_name}`} className="flex h-8 items-center gap-2 rounded-full bg-cream-22 px-3 text-[13px] font-medium text-cream">
                <span className="max-w-36 truncate">{item.food_name}</span>
                <button type="button" onClick={() => handleRemovePending(index)} aria-label={`Remove ${item.food_name}`} className="-my-3 -mr-3 flex size-11 items-center justify-center text-[18px] leading-none">×</button>
              </span>
            ))}
            {hasCurrent ? (
              <span className="flex h-8 items-center gap-2 rounded-full bg-cream-22 px-3 text-[13px] font-medium text-cream">
                <span className="max-w-36 truncate">{foodName.trim()}</span>
                <button type="button" onClick={clearForm} aria-label={`Remove ${foodName.trim()}`} className="-my-3 -mr-3 flex size-11 items-center justify-center text-[18px] leading-none">×</button>
              </span>
            ) : null}
          </div>
          <TrayButton type="button" onClick={handleSave} disabled={saving || totalCount === 0} className="mt-4 justify-center">
            {saving ? 'Saving…' : totalCount > 1 ? `Log ${totalCount} items` : 'Log meal'}
          </TrayButton>
        </FeatureCard>
      ) : null}
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
      className="flex min-h-14 w-full items-center justify-between gap-3 px-[14px] py-2.5 text-left"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15.5px] font-semibold text-ink">{food.name}</p>
        <p className="truncate text-[13px] text-ink-65">
          1 serving · {formatMacroKcal(food.macros_per_serving.calories)} kcal
          {food.brand ? ` · ${food.brand}` : ''}
        </p>
      </div>
      <span className="shrink-0 text-[17px] font-semibold text-ink">+</span>
    </button>
  )
}

function MacroInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | ''
  onChange: (value: number | '') => void
}) {
  const id = `food-macro-${label.toLowerCase()}`
  return (
    <label htmlFor={id} className="min-w-0">
      <span className="mb-1 block text-center text-[11px] font-semibold uppercase tracking-[1.4px] text-ink-65">{label}</span>
      <input
        id={id}
        aria-label={label}
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : '')}
        className="h-11 w-full rounded-[12px] border-0 bg-ink-08 px-1 text-center text-[15.5px] font-semibold text-ink outline-none"
      />
    </label>
  )
}
