'use client'

import { useState, useRef, useEffect, useCallback, useMemo, type ComponentType, type SVGProps } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronDown, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { PushedHeader } from '@/components/layout/screen-header'
import { CameraFill, MenuFill } from '@/components/ui/fiqr/icons'
import { PrimaryButton as TrayButton } from '@/components/ui/fiqr/primary-button'
import { haptic } from '@/lib/platform/app'
import { reducedFade, spring } from '@/lib/motion'
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
import { OfflineBand } from '@/components/shared/offline-band'
import { FieldLabel } from './manual-log-shell'
import { CARD, Chips, LIST, ROW, RiseList, RowsSkeleton, SearchField, SectionTitle, Stepper } from './log-ui'

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
  const reduce = useReducedMotion()
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
  const [searchedQuery, setSearchedQuery] = useState('')
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
        setSearchedQuery(q.trim())
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

  // The + sheet's Photo opens this page with photo=1: go straight to the camera (native). Web needs a user tap.
  const photoRequested = searchParams.get('photo') === '1'
  useEffect(() => {
    if (!photoRequested || !isNative()) return
    const timer = setTimeout(() => { void handlePhotoButton() }, 0)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- once per arrival
  }, [photoRequested])

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
          void haptic('success')
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
        void haptic('success')
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
        void haptic('success')
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
  const trimmed = query.trim()
  // While a food is open in the editor the lists step aside, so nothing sits half under the tray; Add to tray brings them back.
  const showYourFoods = trimmed.length < 2 && !estimateId && !foodName && (favourites.length > 0 || recents.length > 0)
  const showTray = pending.length > 0 || isFoodDraftFilled(currentDraft())

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-6">
      <PushedHeader
        title="Log food"
        onBack={() => router.back()}
        actions={(
          <button
            type="button"
            onClick={() => { void haptic('selection'); setMealMenuOpen((open) => !open) }}
            aria-expanded={mealMenuOpen}
            aria-label={`Meal: ${mealType}`}
            className="-mr-2 flex h-11 shrink-0 items-center gap-1 rounded-full px-3 text-[15px] font-semibold text-ink-80 transition-[transform,background-color] active:scale-[.96] active:bg-ink-06"
          >
            {mealType}
            <ChevronDown aria-hidden="true" className={`size-4 transition-transform duration-200 ${mealMenuOpen ? 'rotate-180' : ''}`} />
          </button>
        )}
      />
      <div className="-mx-4 [&:not(:empty)]:mb-2"><OfflineBand /></div>

      {mealMenuOpen ? (
        <Chips
          className="scrollbar-hide -mx-4 mb-3 overflow-x-auto px-4 pb-1 pt-1"
          label="Meal type"
          options={MEAL_OPTIONS}
          value={mealType}
          onChange={(type) => { if (type) setMealType(type); setMealMenuOpen(false) }}
        />
      ) : null}

      <div className="mt-2">
        <SearchField
          label="Search foods"
          value={query}
          onChange={handleSearch}
          placeholder="Search foods or brands"
          // J1: arriving from Search in the + sheet, the keyboard is already up (no extra tap).
          autoFocus={!photoRequested}
          testId="food-search-input"
        />
      </div>

      <div className="mt-3 flex gap-2">
        <MethodChip
          icon={CameraFill}
          label={estimating ? 'Reading…' : 'Photo'}
          onClick={() => void handlePhotoButton()}
          disabled={estimating}
          testId="photo-estimate-button"
        />
        <MethodChip
          icon={MenuFill}
          label="Menu"
          onClick={() => router.push(`/chat/session?id=${crypto.randomUUID()}&prefill=` + encodeURIComponent('Scan this menu and suggest what fits my remaining macros'))}
        />
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />

      {searchFailed && !searching && trimmed.length >= 2 ? (
        <div role="status" className="mt-4 px-1">
          <p className="text-[15.5px] leading-[1.45] text-ink">I can&apos;t reach search right now. Try again, or snap a photo instead.</p>
          <button type="button" onClick={() => handleSearch(query)} className="-ml-3 mt-1 min-h-11 rounded-full px-3 text-[15px] font-semibold text-ink underline decoration-ink-35 underline-offset-4">Try again</button>
        </div>
      ) : !searching && !searchFailed && trimmed.length >= 2 && results.length === 0 && searchedQuery === trimmed ? (
        <p role="status" className="mt-4 px-1 text-[15.5px] leading-[1.45] text-ink">
          Nothing matches &ldquo;{trimmed}&rdquo;. Try a shorter name, or snap a photo.
        </p>
      ) : null}

      {/* popLayout: results leaving (a food was picked) fade over the editor rising into their place, no one-frame cut. */}
      <AnimatePresence mode="popLayout" initial={false}>
      {searching ? (
        <motion.div key="searching" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.18, ease: 'easeOut' } }} exit={{ opacity: 0, transition: { duration: 0.12 } }} className="mt-4"><RowsSkeleton label="Searching" /></motion.div>
      ) : results.length > 0 ? (
        <motion.section key="results" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.18, ease: 'easeOut' } }} exit={{ opacity: 0, transition: { duration: 0.14 } }} className="mt-4" aria-label="Search results">
          <RiseList className={LIST}>
            {results.map((food, index) => (
              <button
                key={food.id ?? `usda-${food.usda_fdc_id ?? index}`}
                type="button"
                onClick={() => { void haptic('selection'); handleSelectResult(food) }}
                className={ROW}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15.5px] font-semibold text-ink">{food.name}</span>
                  <span className="block truncate text-[13px] text-ink-65">
                    {food.serving_size_g ? `${food.serving_size_g} g` : '1 serving'} · {formatMacroKcal(food.macros_per_serving.calories)} kcal
                    {food.brand ? ` · ${food.brand}` : ''}
                  </span>
                </span>
                <SourceTag source={String(food.source)} />
                <AddMark />
              </button>
            ))}
          </RiseList>
        </motion.section>
      ) : null}
      </AnimatePresence>

      {estimating ? (
        <motion.div role="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18, ease: 'easeOut' }} className={`${CARD} mt-4 p-5`}>
          <p className="text-[15.5px] font-semibold text-ink">Reading your photo</p>
          <p className="mt-0.5 text-[13px] text-ink-65">A few seconds. I&apos;ll fill in what I can see.</p>
          <div className="mt-4 space-y-2.5" aria-hidden="true">
            {[78, 56, 64].map((w) => <span key={w} className="block h-3 animate-pulse rounded-full bg-ink-06 [animation-duration:1.2s]" style={{ width: `${w}%` }} />)}
          </div>
        </motion.div>
      ) : null}

      {foodName ? (
        <motion.div
          ref={formRef}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={reduce ? reducedFade : spring.glide}
          className={`${CARD} mt-4 space-y-5 p-5`}
        >
          {estimateId ? (
            <div data-testid="estimate-chip" className="flex h-9 w-fit items-center gap-1 rounded-full bg-ink-06 pl-3 text-[13px] font-semibold text-ink">
              <span>
                From your photo
                {estimateConfidence != null ? ` · about ${Math.round(estimateConfidence * 100)}% sure` : ''}
              </span>
              <button type="button" onClick={clearEstimate} aria-label="Clear photo estimate" className="grid size-11 place-items-center rounded-full -my-1"><X className="size-4" /></button>
            </div>
          ) : null}

          <div>
            <FieldLabel htmlFor="food-name">Food</FieldLabel>
            {/* Wraps instead of clipping: photo estimates name the whole plate. */}
            <textarea
              id="food-name"
              rows={1}
              aria-label="Food name"
              placeholder="e.g. Grilled chicken breast"
              value={foodName}
              onChange={(event) => { setFoodName(event.target.value); setUserFoodId(null); setMacroBasisPerG(null) }}
              className="field-sizing-content min-h-12 w-full resize-none rounded-[14px] bg-ink-04 px-4 py-3 text-[17px] font-semibold leading-[1.35] text-ink outline-none placeholder:text-ink-65 focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-ink"
            />
          </div>

          {servingSizeG && servingSizeG > 0 ? (
            <div className="space-y-4">
              <div data-testid="serving-mode-toggle">
                <Chips
                  label="Amount in"
                  options={AMOUNT_OPTIONS}
                  value={inputMode}
                  onChange={(mode) => {
                    if (mode === 'servings') {
                      if (typeof quantityG === 'number' && quantityG > 0) setServings(Math.round((quantityG / servingSizeG) * 100) / 100)
                      setInputMode('servings')
                    } else if (mode === 'grams') {
                      setQuantityG(Math.round(servings * servingSizeG))
                      setInputMode('grams')
                    }
                  }}
                />
              </div>
              {inputMode === 'servings' ? (
                <Stepper
                  value={servings}
                  unit={`serving${servings === 1 ? '' : 's'} · ${Math.round(servings * servingSizeG)} g`}
                  onChange={handleServingsChange}
                  step={0.25}
                  min={0.25}
                  max={50}
                  lessLabel="Fewer servings"
                  moreLabel="More servings"
                  valueTestId="servings-value"
                />
              ) : (
                <GramsInput label="Grams" value={quantityG} onChange={handleQuantityChange} />
              )}
            </div>
          ) : (
            <GramsInput label="Quantity in grams" placeholder="Quantity" value={quantityG} onChange={handleQuantityChange} />
          )}

          <div className="grid grid-cols-4 gap-2">
            <MacroInput label="Calories" unit="kcal" value={calories} onChange={(value) => { setCalories(value); setMacroBasisPerG(null) }} />
            <MacroInput label="Protein" unit="g" value={protein} onChange={(value) => { setProtein(value); setMacroBasisPerG(null) }} />
            <MacroInput label="Carbs" unit="g" value={carbs} onChange={(value) => { setCarbs(value); setMacroBasisPerG(null) }} />
            <MacroInput label="Fat" unit="g" value={fat} onChange={(value) => { setFat(value); setMacroBasisPerG(null) }} />
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => router.push('/chat')} className="-ml-3 min-h-11 rounded-full px-3 text-[15px] font-semibold text-ink-65 transition-transform active:scale-[.97]">
              Ask Geo to estimate
            </button>
            {!estimateId ? (
              <button
                type="button"
                onClick={() => { void haptic('selection'); handleAddAnother() }}
                disabled={saving || !hasCurrent}
                className="ml-auto flex h-11 items-center gap-1.5 rounded-full bg-ink-06 px-4 text-[15px] font-semibold text-ink transition-transform active:scale-[.96] disabled:opacity-40"
              >
                <Plus aria-hidden="true" className="size-4" />Add to tray
              </button>
            ) : null}
          </div>
        </motion.div>
      ) : null}

      {showYourFoods ? (
        <div className="mt-6 space-y-6" data-testid="your-foods">
          {recents.length > 0 ? (
            <section>
              <SectionTitle>Recent</SectionTitle>
              <div className={LIST}>
                {recents.map((food) => <PersonalFoodRow key={`recent-${food.id}`} food={food} onSelect={handleSelectPersonalFood} />)}
              </div>
            </section>
          ) : null}
          {favourites.length > 0 ? (
            <section>
              <SectionTitle>Favourites</SectionTitle>
              <div className={LIST}>
                {favourites.map((food) => <PersonalFoodRow key={`fav-${food.id}`} food={food} onSelect={handleSelectPersonalFood} />)}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      <AnimatePresence>
        {showTray ? (
          <motion.div
            key="tray"
            data-testid="food-meal-tray"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 32 }}
            transition={reduce ? reducedFade : spring.sheet}
            className="glass sticky z-30 mt-6 rounded-[28px] p-4"
            style={{ bottom: 'calc(12px + var(--safe-bottom))' }}
          >
            <p className="flex items-baseline justify-between gap-3 px-1">
              <span className="text-[17px] font-bold text-ink tabular-nums">
                {totalCount} item{totalCount === 1 ? '' : 's'} · {formatMacroKcal(totalCalories)} kcal
              </span>
              <span className="text-[13px] font-semibold text-ink-65">{mealType}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {pending.map((item, index) => (
                <TrayChip key={`pending-${index}-${item.food_name}`} name={item.food_name} onRemove={() => handleRemovePending(index)} />
              ))}
              {hasCurrent ? <TrayChip name={foodName.trim()} onRemove={clearForm} /> : null}
            </div>
            <TrayButton type="button" onClick={handleSave} disabled={saving || totalCount === 0} aria-busy={saving} className="mt-3 justify-center">
              {saving ? 'Saving…' : totalCount > 1 ? `Log ${totalCount} items` : 'Log meal'}
            </TrayButton>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

const MEAL_OPTIONS = MEAL_TYPES.map((value) => ({ value, label: value }))
const AMOUNT_OPTIONS = [{ value: 'servings', label: 'Servings' }, { value: 'grams', label: 'Grams' }] as const

/** Plain + glyph; -mr-0.5 puts its centre on the search field's clear icon (28 px from the edge). */
function AddMark() {
  return <Plus aria-hidden="true" strokeWidth={1.75} className="-mr-0.5 size-5 shrink-0 text-ink-65" />
}

/** Quiet trailing source tag; your own foods get a soft ink chip so they stand out from database rows. */
function SourceTag({ source }: { source: string }) {
  const label = SOURCE_LABELS[source]
  if (!label) return null
  return source === 'personal'
    ? <span className="shrink-0 rounded-full bg-ink-06 px-2 py-0.5 text-[12px] font-semibold text-ink">{label}</span>
    : <span className="shrink-0 text-[12px] font-medium text-ink-65">{label}</span>
}

function MethodChip({ icon: Icon, label, onClick, disabled, testId }: {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
  onClick: () => void
  disabled?: boolean
  testId?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      className="flex h-11 items-center gap-2 rounded-full bg-card pl-3.5 pr-4 text-[15px] font-semibold text-ink shadow-[var(--shadow-card)] transition-transform active:scale-[.96] disabled:opacity-60"
    >
      <Icon aria-hidden="true" className="size-[18px]" />
      {label}
    </button>
  )
}

function TrayChip({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <span className="flex h-11 max-w-full items-center rounded-full bg-ink-06 pl-3 text-[13.5px] font-semibold text-ink">
      <span className="max-w-40 truncate">{name}</span>
      <button type="button" onClick={onRemove} aria-label={`Remove ${name}`} className="grid size-11 shrink-0 place-items-center rounded-full"><X className="size-4" /></button>
    </span>
  )
}

function GramsInput({ label, value, onChange, placeholder }: { label: string; value: number | ''; onChange: (value: number | '') => void; placeholder?: string }) {
  return (
    <label className="flex h-14 items-center gap-2 rounded-[14px] bg-ink-04 px-4 focus-within:outline focus-within:outline-[1.5px] focus-within:outline-ink">
      <input
        aria-label={label}
        type="number"
        inputMode="decimal"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : '')}
        className="h-full min-w-0 flex-1 bg-transparent text-[20px] font-bold text-ink outline-none placeholder:text-ink-65 tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className="text-[15px] font-semibold text-ink-65">g</span>
    </label>
  )
}

/** A tappable row for one of the user's saved foods (favourite or recent). */
function PersonalFoodRow({ food, onSelect }: { food: UserFood; onSelect: (f: UserFood) => void }) {
  return (
    <button
      type="button"
      onClick={() => { void haptic('selection'); onSelect(food) }}
      data-testid="personal-food-row"
      className={ROW}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15.5px] font-semibold text-ink">{food.name}</span>
        <span className="block truncate text-[13px] text-ink-65">
          1 serving · {formatMacroKcal(food.macros_per_serving.calories)} kcal
          {food.brand ? ` · ${food.brand}` : ''}
        </span>
      </span>
      <AddMark />
    </button>
  )
}

function MacroInput({
  label,
  unit,
  value,
  onChange,
}: {
  label: string
  unit: string
  value: number | ''
  onChange: (value: number | '') => void
}) {
  const id = `food-macro-${label.toLowerCase()}`
  return (
    <div className="min-w-0 rounded-[14px] bg-ink-04 px-2 pb-2 pt-2.5 text-center focus-within:outline focus-within:outline-[1.5px] focus-within:outline-ink">
      <label htmlFor={id} className="block text-[12px] font-semibold text-ink-65">{label}</label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : '')}
        className="h-11 w-full bg-transparent text-center text-[18px] font-bold text-ink outline-none tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span aria-hidden="true" className="block text-[11.5px] font-medium text-ink-65">{unit}</span>
    </div>
  )
}
