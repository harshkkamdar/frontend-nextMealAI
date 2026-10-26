'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, Plus, Star, X } from 'lucide-react'
import { toast } from 'sonner'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { CloseIcon } from '@/components/ui/fiqr/icons'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { CARD, Chips, EmptySlot, FIELD, LIST, ROW, RiseList, RowsSkeleton, SearchField, SectionTitle } from '@/components/logs/log-ui'
import { FieldLabel } from '@/components/logs/manual-log-shell'
import { useUIStore } from '@/stores/ui.store'
import { searchFoods, updateFood, saveFood, getRecentFoods } from '@/lib/api/foods.api'
import { getFavourites, logFavourite, deleteFavourite, type Favourite } from '@/lib/api/favourites.api'
import { createLog, createLogs, updateLog, deleteLog } from '@/lib/api/logs.api'
import { haptic } from '@/lib/platform/app'
import { cn } from '@/lib/utils'
import type { CreateLogInput } from '@/types/logs.types'
import { formatMacroGrams, formatMacroKcal, quantizeMacros } from '@/lib/macros'
import type { FoodSearchResult } from '@/types/foods.types'
import type { Log, FoodPayload, FoodLogItem } from '@/types/logs.types'
import { ChoiceGrid, GroupLabel } from './choice-grid'
import { mealOf } from './diary-logic'
import { ItemListEditor } from './item-list-editor'

const MEAL_CHOICES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((m) => ({ value: m, label: m }))

function FoodRow({ food, onSelect, onToggleFavorite }: {
  food: FoodSearchResult
  onSelect: (food: FoodSearchResult) => void
  onToggleFavorite: (food: FoodSearchResult) => void
}) {
  const canFavourite = food.source === 'personal' && !!food.id
  return (
    <div className={cn(ROW, 'gap-1 py-0 pr-2')}>
      <button
        type="button"
        onClick={() => { void haptic('selection'); onSelect(food) }}
        className="flex min-h-16 min-w-0 flex-1 items-center gap-3 py-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15.5px] font-semibold text-ink">{food.name}</span>
          <span className="block truncate text-[13px] text-ink-65">
            {formatMacroKcal(food.macros_per_serving.calories)} kcal
            {food.serving_size_g ? ` · per ${food.serving_size_g} g` : ''}
            {food.brand ? ` · ${food.brand}` : ''}
            {food.source === 'usda' && ' · USDA'}
          </span>
        </span>
        {canFavourite ? null : <AddMark />}
      </button>
      {canFavourite ? (
        <>
          <button
            type="button"
            onClick={() => { void haptic('selection'); onToggleFavorite(food) }}
            aria-label={food.is_favorite ? `Remove ${food.name} from favourites` : `Add ${food.name} to favourites`}
            aria-pressed={food.is_favorite}
            className="grid size-11 shrink-0 place-items-center rounded-full text-ink"
          >
            <Star className={cn('size-5', food.is_favorite ? 'fill-current' : 'text-ink-35')} />
          </button>
          <span className="pr-3"><AddMark /></span>
        </>
      ) : null}
    </div>
  )
}

function AddMark() {
  return (
    <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-ink-06 text-ink">
      <Plus className="size-4" />
    </span>
  )
}

function MacroTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[14px] bg-card px-2 py-3 text-center shadow-[var(--shadow-card)]">
      <p className="text-[18px] font-bold text-ink tabular-nums">{value}</p>
      <p className="text-[12px] font-semibold text-ink-65">{label}</p>
    </div>
  )
}

/** Totals of an itemised log's components. */
function sumItems(items: FoodLogItem[]) {
  return items.reduce(
    (t, i) => ({ calories: t.calories + (i.est_macros.calories ?? 0), protein: t.protein + (i.est_macros.protein ?? 0), carbs: t.carbs + (i.est_macros.carbs ?? 0), fat: t.fat + (i.est_macros.fat ?? 0) }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
}

const TABS = [{ value: 'food', label: 'Foods' }, { value: 'meals', label: 'Saved meals' }] as const
const AMOUNTS = [{ value: 'servings', label: 'Servings' }, { value: 'grams', label: 'Grams' }] as const

interface FoodSearchSheetProps {
  isOpen: boolean
  onClose: () => void
  mealType: string
  onFoodLogged: () => void
  /** The calendar date being viewed (YYYY-MM-DD). Logs land on THIS date, not
   *  "today" (fixes adding food while viewing a past day landing on today). */
  logDate?: string
  /** Existing food logs for this meal+day — used to MERGE a re-added food into
   *  the existing entry (servings + macros) instead of creating a duplicate. */
  existingMealLogs?: Log[]
  /** FB-R5-03 — edit an existing log instead of creating one. */
  mode?: 'log' | 'edit'
  existingLog?: Log
  onLogUpdated?: (logId: string, payload: FoodPayload) => void
  onLogDeleted?: (logId: string) => void
  /** Edit mode: the line under the title, e.g. "Breakfast, Mon 26 Oct". */
  editSubtitle?: string
  /** Edit mode: Delete entry hands the log to the caller, which closes this sheet and confirms (a confirm over a modal sheet can't take focus). */
  onRequestDelete?: (log: Log) => void
}

export function FoodSearchSheet({ isOpen, onClose, mealType, onFoodLogged, logDate, existingMealLogs, mode, existingLog, onLogUpdated, onLogDeleted, editSubtitle, onRequestDelete }: FoodSearchSheetProps) {
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
  // Favourites surfaced right where the user adds food (the #1 place they look
  // for a saved meal). Tapping one logs the whole favourite onto the viewed
  // day + this meal in one go.
  const [favourites, setFavourites] = useState<Favourite[]>([])
  const [loggingFav, setLoggingFav] = useState<string | null>(null)
  const [confirmDeleteFav, setConfirmDeleteFav] = useState<string | null>(null)
  const [confirmDeleteEdit, setConfirmDeleteEdit] = useState(false)
  // Edit mode: the meal the entry files under, and an itemised (photo) log's components, both saved on Save.
  const [editMeal, setEditMeal] = useState('Snack')
  const [editItems, setEditItems] = useState<FoodLogItem[] | null>(null)
  // Add-food sheet has two tabs: search individual Foods, or log a saved Meal.
  const [activeTab, setActiveTab] = useState<'food' | 'meals'>('food')
  const [mealQuery, setMealQuery] = useState('')
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
      setEditMeal(mealOf(payload))
      setEditItems(payload.items?.length ? payload.items : null)
      const servingSize = payload.servings && payload.quantity_g
        ? Math.round(payload.quantity_g / payload.servings)
        : null
      // payload.est_macros is the TOTAL for the logged amount, but the
      // confirmation view multiplies macros_per_serving × servings. So for a
      // multi-serving entry we must store the PER-SERVING macros here, else
      // opening the editor (and re-saving) doubles/compounds the calories.
      const editServings =
        typeof payload.servings === 'number' && payload.servings > 0 ? payload.servings : 1
      const totalMacros = payload.est_macros ?? { calories: 0, protein: 0, carbs: 0, fat: 0 }
      setSelectedFood({
        id: payload.user_food_id ?? null,
        usda_fdc_id: undefined,
        name: payload.food_name,
        brand: undefined,
        serving_size_g: servingSize ?? payload.quantity_g ?? 100,
        macros_per_serving: {
          calories: (totalMacros.calories ?? 0) / editServings,
          protein: (totalMacros.protein ?? 0) / editServings,
          carbs: (totalMacros.carbs ?? 0) / editServings,
          fat: (totalMacros.fat ?? 0) / editServings,
        },
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
    setActiveTab('food')
    setMealQuery('')
    setConfirmDeleteFav(null)
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
    getFavourites()
      .then((f) => {
        // Favourites whose saved meal matches THIS meal float to the top.
        const meal = mealType.toLowerCase()
        setFavourites(
          [...f].sort((a, b) => Number((b.default_meal_type ?? '') === meal) - Number((a.default_meal_type ?? '') === meal)),
        )
      })
      .catch(() => setFavourites([]))
  }, [isOpen, mode, existingLog, mealType])

  // Clean up debounce on unmount
  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  // One-tap log a whole saved meal onto the viewed day + this meal slot.
  const handleLogFavourite = async (f: Favourite) => {
    setLoggingFav(f.id)
    try {
      const r = await logFavourite(f.id, { target_date: logDate, target_meal_type: mealType.toLowerCase() })
      void haptic('success')
      toast.success(`Logged ${f.name}, ${r.logged} item${r.logged === 1 ? '' : 's'}`)
      onFoodLogged()
      onClose()
    } catch {
      toast.error('Failed to log meal')
    } finally {
      setLoggingFav(null)
    }
  }

  const handleDeleteFavourite = async (f: Favourite) => {
    try {
      await deleteFavourite(f.id)
      setFavourites((prev) => prev.filter((x) => x.id !== f.id))
      toast.success(`Removed ${f.name}`)
    } catch {
      toast.error('Failed to remove meal')
    } finally {
      setConfirmDeleteFav(null)
    }
  }

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

  // BUG-C (merge) — find an existing entry for the SAME food in this meal+day
  // (matched by user_food_id when both have one, else by case-insensitive
  // name) so a re-add combines instead of creating a duplicate row.
  const findMergeTarget = (payload: FoodPayload): Log | null => {
    if (!existingMealLogs?.length) return null
    const wantId = payload.user_food_id
    const wantName = (payload.food_name ?? '').trim().toLowerCase()
    return (
      existingMealLogs.find((l) => {
        const ep = l.payload as FoodPayload | undefined
        if (!ep) return false
        if (wantId && ep.user_food_id) return ep.user_food_id === wantId
        return (ep.food_name ?? '').trim().toLowerCase() === wantName
      }) ?? null
    )
  }

  const mergeFoodPayloads = (existing: FoodPayload, added: FoodPayload): Partial<FoodPayload> => {
    const em = existing.est_macros ?? {}
    const am = added.est_macros ?? {}
    const bothServings = typeof existing.servings === 'number' && typeof added.servings === 'number'
    return {
      quantity_g: Math.round((existing.quantity_g ?? 0) + (added.quantity_g ?? 0)),
      servings: bothServings ? (existing.servings as number) + (added.servings as number) : undefined,
      est_macros: quantizeMacros({
        calories: (em.calories ?? 0) + (am.calories ?? 0),
        protein: (em.protein ?? 0) + (am.protein ?? 0),
        carbs: (em.carbs ?? 0) + (am.carbs ?? 0),
        fat: (em.fat ?? 0) + (am.fat ?? 0),
      }),
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
      // BUG-C — combine into the existing entry when the same food is already
      // logged for this meal+day.
      const match = findMergeTarget(payload)
      if (match) {
        const merged = mergeFoodPayloads(match.payload as FoodPayload, payload)
        await updateLog(match.id, merged)
        void haptic('success')
        toast.success(`${selectedFood.name} added to the same entry`)
        onFoodLogged()
        return
      }
      // BUG-A — stamp the viewed date so it doesn't land on "today".
      await createLog({ type: 'food', payload, source: 'manual', local_date: logDate })
      void haptic('success')
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
      local_date: logDate, // BUG-A — bucket onto the viewed date
    }))
    // Include the currently-selected (un-added) food if present.
    const selectedPayload = buildFoodPayload()
    if (selectedPayload) {
      items.push({ type: 'food', payload: selectedPayload, source: 'manual', local_date: logDate })
    }
    if (items.length === 0) return

    setSaving(true)
    try {
      const { created, failures } = await createLogs(items)
      if (failures.length === 0) {
        void haptic('success')
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
    // An itemised log saves its components (the backend re-sums the parent); a single food saves its amount.
    const updated: Partial<FoodPayload> = editItems
      ? { items: editItems, est_macros: quantizeMacros(sumItems(editItems)), meal_type: editMeal.toLowerCase() }
      : { quantity_g: quantity, servings: inputMode === 'servings' ? servings : undefined, est_macros: macros, meal_type: editMeal.toLowerCase() }
    try {
      await updateLog(existingLog.id, updated)
      onLogUpdated?.(existingLog.id, { ...(existingLog.payload as FoodPayload), ...updated })
      toast.success('Updated')
      onClose()
    } catch {
      toast.error("Couldn't save. Your change is still here.")
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
        local_date: logDate, // BUG-A — bucket onto the viewed date
      })
      void haptic('success')
      toast.success(`${customName.trim()} saved and logged`)
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

  const shownMacros = editItems ? sumItems(editItems) : calculatedMacros
  // Edit mode names the serving under the number ("bowl"), as the mock does.
  const servingUnit = mode === 'edit' ? ((existingLog?.payload as FoodPayload | undefined)?.serving_label?.trim() || null) : null

  const title = mode === 'edit'
    ? `Edit ${(existingLog?.payload as FoodPayload | undefined)?.food_name ?? 'food'}`
    : pending.length > 0
      ? `${mealType} · ${pending.length} in meal`
      : `Add to ${mealType}`
  const amountInvalid = inputMode === 'grams' && !grams
  const stepButton = 'grid size-14 shrink-0 place-items-center rounded-full bg-card text-ink shadow-[var(--shadow-card)] transition-transform active:scale-[.94]'
  const numberInput = 'font-wide h-16 w-28 rounded-[18px] bg-card px-3 text-center text-[28px] font-bold text-ink shadow-[var(--shadow-card)] outline-none tabular-nums focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-ink [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
  const step = (fn: () => void) => () => { void haptic('selection'); fn() }

  return (
    <>
      <BottomSheet
        open={isOpen}
        onClose={onClose}
        ariaLabel={mode === 'edit' ? 'Edit food' : 'Add food'}
        // Log mode holds one height so results arriving never resize the sheet (no layout jump).
        className={mode === 'edit' ? '' : 'h-[calc(92vh-var(--nav-clearance)-var(--safe-top))]'}
      >
        <div className={cn('flex justify-between gap-3 px-5 pb-3 pt-1', mode === 'edit' ? 'items-start' : 'items-center')}>
          {mode === 'edit' ? (
            <div className="min-w-0 flex-1">
              <h2 id="food-sheet-title" className="font-display line-clamp-2 text-headline font-extrabold leading-tight text-ink [overflow-wrap:anywhere]">{title}</h2>
              {editSubtitle ? <p className="mt-0.5 text-caption text-ink-65">{editSubtitle}</p> : null}
            </div>
          ) : (
            <h2 id="food-sheet-title" className="font-wide min-w-0 truncate text-[22px] font-bold leading-tight text-ink">{title}</h2>
          )}
          <button type="button" aria-label="Close" onClick={onClose} className="grid size-11 shrink-0 place-items-center rounded-full bg-ink-06 text-ink transition-transform active:scale-[.94] [&_svg]:size-5"><CloseIcon /></button>
        </div>

        {selectedFood ? (
          /* Confirmation view */
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
              {mode !== 'edit' && (
                <button type="button" onClick={() => setSelectedFood(null)} className="-ml-3 mb-1 min-h-11 rounded-full px-3 text-[15px] font-semibold text-ink-65">
                  Back to search
                </button>
              )}

              {editItems ? <ItemListEditor items={editItems} onChange={setEditItems} /> : (<>
              {/* Edit mode names the food in the title, so the card only shows when logging. */}
              {mode !== 'edit' && (
                <div className={cn(CARD, 'mb-5 p-5')}>
                  <p className="text-[17px] font-bold leading-snug text-ink">{selectedFood.name}</p>
                  {selectedFood.brand && <p className="text-[14px] text-ink-65">{selectedFood.brand}</p>}
                  <p className="mt-1 text-[13px] text-ink-65">Per serving ({selectedFood.serving_size_g} g)</p>
                </div>
              )}

              <ChoiceGrid
                label="Amount in"
                choices={AMOUNTS}
                value={inputMode}
                onPick={(next) => {
                  if (next === 'servings') setInputMode('servings')
                  if (next === 'grams') {
                    setInputMode('grams')
                    setGrams(Math.round((selectedFood?.serving_size_g || 100) * servings))
                  }
                }}
              />

              {inputMode === 'servings' ? (
                <div className="mt-5 flex items-center justify-center gap-5">
                  <button type="button" onClick={step(() => setServings(Math.max(0.25, servings - 0.25)))} aria-label="Decrease servings" className={stepButton}>
                    <span aria-hidden="true" className="text-[22px] font-semibold leading-none">−</span>
                  </button>
                  <span className="flex flex-col items-center gap-1">
                    <input
                    type="number"
                    inputMode="decimal"
                    value={servings}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === '') return
                      const num = Number(val)
                      if (!isNaN(num) && num > 0) setServings(Math.round(num * 4) / 4)
                    }}
                    onBlur={() => { if (!servings || servings < 0.25) setServings(0.25) }}
                    aria-label="Servings"
                    className={numberInput}
                  />
                    {servingUnit ? <span className="text-caption font-semibold text-ink-65">{servingUnit}</span> : null}
                  </span>
                  <button type="button" onClick={step(() => setServings(servings + 0.25))} aria-label="Increase servings" className={stepButton}>
                    <Plus className="size-5" />
                  </button>
                </div>
              ) : (
                <div className="mt-5 flex items-center justify-center gap-5">
                  <button type="button" onClick={step(() => setGrams(Math.max(1, (grams || 0) - 10)))} aria-label="Decrease grams" className={stepButton}>
                    <span aria-hidden="true" className="text-[22px] font-semibold leading-none">−</span>
                  </button>
                  <div className="flex items-baseline gap-1.5">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={grams}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === '') { setGrams(''); return }
                        const num = Number(val)
                        if (!isNaN(num)) setGrams(Math.max(0, Math.round(num)))
                      }}
                      onBlur={() => { if (grams === '' || grams === 0) setGrams(1) }}
                      aria-label="Grams"
                      className={numberInput}
                    />
                    <span aria-hidden="true" className="text-[15px] font-semibold text-ink-65">g</span>
                  </div>
                  <button type="button" onClick={step(() => setGrams((grams || 0) + 10))} aria-label="Increase grams" className={stepButton}>
                    <Plus className="size-5" />
                  </button>
                </div>
              )}

              </>)}

              {shownMacros && (
                <div className={cn('grid grid-cols-4 gap-2', editItems ? 'mt-3' : 'mt-6')}>
                  <MacroTile value={formatMacroKcal(shownMacros.calories)} label="kcal" />
                  <MacroTile value={formatMacroGrams(shownMacros.protein)} label="protein" />
                  <MacroTile value={formatMacroGrams(shownMacros.carbs)} label="carbs" />
                  <MacroTile value={formatMacroGrams(shownMacros.fat)} label="fat" />
                </div>
              )}

              {mode === 'edit' ? (
                <>
                  <GroupLabel>Meal</GroupLabel>
                  <ChoiceGrid label="Meal" choices={MEAL_CHOICES} value={editMeal} onPick={setEditMeal} />
                </>
              ) : null}
            </div>

            <div className="px-5 pb-5 pt-3">
              {mode === 'edit' ? (
                <div className="space-y-1">
                  <PrimaryButton onClick={handleSaveEdit} disabled={saving || !selectedFood} aria-busy={saving} className="justify-center">
                    {saving ? 'Saving…' : 'Save'}
                  </PrimaryButton>
                  <button type="button" onClick={() => (onRequestDelete && existingLog ? onRequestDelete(existingLog) : setConfirmDeleteEdit(true))} disabled={saving} className="min-h-11 w-full rounded-full text-center text-[15.5px] font-semibold text-ink-65">
                    Delete entry
                  </button>
                </div>
              ) : (
                /* FE-RCA F3 — multi-select footer.
                   "+ Add to meal" stages the current selection in the pending tray
                   and returns to search so the user can add another item without
                   re-opening the sheet. "Log meal (N)" / "Log food" commits via
                   the batch createLogs() surface. */
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { void haptic('selection'); handleAddToMeal() }}
                    disabled={saving || amountInvalid}
                    className="flex h-[60px] flex-1 items-center justify-center gap-1.5 rounded-[18px] bg-ink-06 text-[16px] font-semibold text-ink transition-transform active:scale-[.97] disabled:opacity-40"
                  >
                    <Plus aria-hidden="true" className="size-4" />
                    Add to meal
                  </button>
                  <PrimaryButton onClick={handleConfirmLog} disabled={saving || amountInvalid} aria-busy={saving} className="flex-1 justify-center px-3">
                    {saving
                      ? 'Logging…'
                      : pending.length > 0
                        ? `Log meal (${pending.length + 1})`
                        : 'Log food'}
                  </PrimaryButton>
                </div>
              )}
            </div>
          </>
        ) : showCustomForm ? (
          /* Custom food form */
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
            <button type="button" onClick={() => setShowCustomForm(false)} className="-ml-3 mb-1 min-h-11 rounded-full px-3 text-[15px] font-semibold text-ink-65">
              Back to search
            </button>
            <h3 className="font-wide mb-4 text-[19px] font-bold text-ink">New food</h3>
            <div className="space-y-4">
              <div>
                <FieldLabel htmlFor="custom-name">Name</FieldLabel>
                <input id="custom-name" type="text" placeholder="Mum's dal and rice" value={customName} onChange={(e) => setCustomName(e.target.value)} autoFocus className={cn(FIELD, 'h-14')} />
              </div>
              <div>
                <FieldLabel htmlFor="custom-serving">Serving, g</FieldLabel>
                <input id="custom-serving" type="number" inputMode="decimal" placeholder="100" value={customServingG} onChange={(e) => setCustomServingG(e.target.value ? Number(e.target.value) : '')} className={cn(FIELD, 'h-14')} />
              </div>
              <p className="px-1 text-[13px] font-semibold text-ink-65">Per serving</p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  ['custom-kcal', 'Calories', customCalories, setCustomCalories],
                  ['custom-protein', 'Protein, g', customProtein, setCustomProtein],
                  ['custom-carbs', 'Carbs, g', customCarbs, setCustomCarbs],
                  ['custom-fat', 'Fat, g', customFat, setCustomFat],
                ] as const).map(([id, label, value, set]) => (
                  <div key={id}>
                    <FieldLabel htmlFor={id}>{label}</FieldLabel>
                    <input id={id} type="number" inputMode="decimal" value={value} onChange={(e) => set(e.target.value ? Number(e.target.value) : '')} className={cn(FIELD, 'h-14')} />
                  </div>
                ))}
              </div>
            </div>
            <PrimaryButton onClick={handleSaveCustomFood} disabled={saving || !customName.trim()} aria-busy={saving} className="mt-6 justify-center">
              {saving ? 'Saving…' : 'Save and log'}
            </PrimaryButton>
            <p className="mt-2 text-center text-[13px] text-ink-65">It&apos;s saved to your foods for next time.</p>
          </div>
        ) : (
          /* Search view */
          <>
            {mode !== 'edit' && (
              <Chips
                className="px-5 pb-3"
                label="Add from"
                options={TABS.map((t) => (t.value === 'meals' && favourites.length > 0 ? { ...t, label: `${t.label} · ${favourites.length}` } : t))}
                value={activeTab}
                onChange={(next) => { if (next) setActiveTab(next) }}
              />
            )}

            {activeTab === 'meals' && mode !== 'edit' ? (
              /* Meals tab — your saved meals, one tap to log the whole thing */
              <>
                {favourites.length > 0 && (
                  <div className="px-5 pb-3">
                    <SearchField label="Search saved meals" value={mealQuery} onChange={setMealQuery} placeholder="Search saved meals" />
                  </div>
                )}
                <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
                  {favourites.length === 0 ? (
                    <EmptySlot>No saved meals yet. In your diary, open a meal&apos;s menu and choose Save as meal.</EmptySlot>
                  ) : (() => {
                    const q = mealQuery.trim().toLowerCase()
                    const shown = q
                      ? favourites.filter((f) => f.name.toLowerCase().includes(q) || f.items.some((it) => (it.food_name ?? '').toLowerCase().includes(q)))
                      : favourites
                    if (shown.length === 0) {
                      return <p className="px-1 py-4 text-[15.5px] text-ink">No saved meals match &ldquo;{mealQuery}&rdquo;.</p>
                    }
                    return (
                      <div className={LIST} role="list" aria-label="Saved meals">
                        {shown.map((f) => (
                          <div key={f.id} role="listitem" className={cn(ROW, 'gap-1 py-0 pr-2')}>
                            <button
                              type="button"
                              onClick={() => handleLogFavourite(f)}
                              disabled={loggingFav === f.id}
                              className="flex min-h-16 min-w-0 flex-1 items-center justify-between gap-2 py-3 text-left disabled:opacity-50"
                              aria-label={`Log ${f.name}`}
                            >
                              <span className="min-w-0">
                                <span className="block truncate text-[15.5px] font-semibold text-ink">{f.name}</span>
                                <span className="block truncate text-[13px] text-ink-65">
                                  {f.items.length} item{f.items.length === 1 ? '' : 's'}
                                  {f.items.length > 0 ? ` · ${f.items.map((it) => it.food_name).slice(0, 3).join(', ')}${f.items.length > 3 ? '…' : ''}` : ''}
                                </span>
                              </span>
                              <span className="inline-flex shrink-0 items-center gap-1 text-[14px] font-semibold text-ink">
                                <Plus aria-hidden="true" className="size-4" />
                                {loggingFav === f.id ? 'Logging…' : 'Log'}
                              </span>
                            </button>
                            {confirmDeleteFav === f.id ? (
                              <button type="button" onClick={() => handleDeleteFavourite(f)} className="h-11 shrink-0 rounded-full px-3 text-[14px] font-semibold text-ink" aria-label={`Confirm remove ${f.name}`}>Remove?</button>
                            ) : (
                              <button type="button" onClick={() => setConfirmDeleteFav(f.id)} aria-label={`Remove ${f.name}`} className="grid size-11 shrink-0 place-items-center rounded-full text-ink-65">
                                <X className="size-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              </>
            ) : (
              <>
                <div className="px-5 pb-3">
                  <SearchField inputRef={inputRef} label="Search foods" value={query} onChange={handleSearch} placeholder="Search foods" />
                </div>

                {/* FE-RCA F3 — pending tray summary. Only visible in log mode
                    and only when at least one item has been staged. Lets the
                    user review/remove items before committing the meal. */}
                {mode !== 'edit' && pending.length > 0 && (
                  <div className="px-5 pb-3">
                    <div className={cn(CARD, 'p-4')}>
                      <p className="px-1 text-[13px] font-semibold text-ink-65">In this meal · {pending.length}</p>
                      <ul className="mt-1">
                        {pending.map((item, idx) => (
                          <li key={`pending-${idx}-${item.food.id ?? item.food.name}`} className="flex items-center justify-between gap-2 border-b border-ink-06 py-1 pl-1 last:border-b-0">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[15.5px] font-semibold text-ink">{item.food.name}</p>
                              <p className="text-[13px] tabular-nums text-ink-65">
                                {item.inputMode === 'servings'
                                  ? `${item.servings} × ${item.food.serving_size_g ?? 100} g`
                                  : `${item.quantity_g} g`}
                                {' · '}
                                {formatMacroKcal(item.est_macros.calories)} kcal
                              </p>
                            </div>
                            <button type="button" onClick={() => handleRemovePendingItem(idx)} aria-label={`Remove ${item.food.name}`} className="grid size-11 shrink-0 place-items-center rounded-full text-ink-65">
                              <X className="size-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                      <PrimaryButton onClick={handleCommitMeal} disabled={saving} aria-busy={saving} className="mt-3 justify-center">
                        {saving ? 'Logging…' : `Log meal (${pending.length})`}
                      </PrimaryButton>
                    </div>
                  </div>
                )}

                <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
                  {searching ? (
                    <RowsSkeleton label="Searching" />
                  ) : results.length > 0 ? (
                    <RiseList className={LIST} role="list" aria-label="Food search results">
                      {results.map((food, i) => (
                        <FoodRow key={food.id ?? `usda-${food.usda_fdc_id ?? i}`} food={food} onSelect={handleSelectFood} onToggleFavorite={handleToggleFavorite} />
                      ))}
                    </RiseList>
                  ) : query.length >= 2 ? (
                    <div className="px-1 py-4">
                      <p className="text-[15.5px] text-ink">Nothing matches &ldquo;{query}&rdquo;.</p>
                      <button
                        type="button"
                        onClick={() => { setShowCustomForm(true); setCustomName(query) }}
                        className="mt-3 inline-flex h-11 max-w-full items-center gap-1.5 rounded-full bg-ink px-4 text-[15px] font-semibold text-cream"
                      >
                        <Plus aria-hidden="true" className="size-4 shrink-0" />
                        <span className="truncate">Add &ldquo;{query}&rdquo; as a new food</span>
                      </button>
                    </div>
                  ) : recentFoods.length > 0 ? (
                    <section>
                      <SectionTitle>Recent</SectionTitle>
                      <div className={LIST} role="list" aria-label="Recent foods">
                        {recentFoods.map((food, i) => (
                          <FoodRow key={food.id ?? `recent-${i}`} food={food} onSelect={handleSelectFood} onToggleFavorite={handleToggleFavorite} />
                        ))}
                      </div>
                    </section>
                  ) : (
                    <p className="px-1 py-6 text-center text-[15.5px] text-ink-65">Start typing to find a food.</p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-ink-06 px-3 pb-4 pt-2">
                  <button type="button" onClick={handleAskGeo} className="flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[15px] font-semibold text-ink-65">
                    <MessageCircle aria-hidden="true" className="size-4" />
                    Ask Geo to estimate
                  </button>
                  <button type="button" onClick={() => setShowCustomForm(true)} className="flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[15px] font-semibold text-ink-65">
                    <Plus aria-hidden="true" className="size-4" />
                    New food
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </BottomSheet>
      <ConfirmDialog
        open={confirmDeleteEdit}
        onClose={() => setConfirmDeleteEdit(false)}
        onConfirm={handleDeleteEdit}
        title="Delete this entry?"
        description="It comes off your diary and your totals update."
        confirmLabel="Delete entry"
        variant="danger"
      />
    </>
  )
}
