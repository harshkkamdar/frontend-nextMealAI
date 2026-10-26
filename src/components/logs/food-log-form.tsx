'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type SVGProps } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronDown, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { PushedHeader } from '@/components/layout/screen-header'
import { OfflineBand } from '@/components/shared/offline-band'
import { CameraFill, MenuFill } from '@/components/ui/fiqr/icons'
import { createLogs } from '@/lib/api/logs.api'
import { getPersonalFoods, searchFoods } from '@/lib/api/foods.api'
import { buildFoodLogItems } from '@/lib/food-log'
import { formatMacroKcal } from '@/lib/macros'
import { isNative } from '@/lib/platform'
import { haptic } from '@/lib/platform/app'
import { pickPhoto } from '@/lib/platform/camera'
import { useOnline } from '@/lib/platform/network'
import { cn } from '@/lib/utils'
import type { FoodSearchResult, UserFood } from '@/types/foods.types'
import { FoodItemSheet, plateItemFor, SOURCE_LABELS } from './food-item-sheet'
import { CARD, Chips, LIST, RiseList, RowsSkeleton, SearchField, SectionTitle } from './log-ui'
import { MEALS, mealForTime, parseMeal, type Meal, type PlateItem } from './log-math'
import { PhotoResult } from './photo-result'
import { PlatePill, PlateSheet } from './plate-tray'

const MENU_PROMPT = 'Scan this menu and suggest what fits my remaining macros'
const MEAL_OPTIONS = MEALS.map((value) => ({ value, label: value }))

const asResult = (f: UserFood): FoodSearchResult => ({
  id: f.id, name: f.name, brand: f.brand, serving_size_g: f.serving_size_g, macros_per_serving: f.macros_per_serving,
  source: 'personal', is_favorite: f.is_favorite, use_count: f.use_count,
})

/**
 * Log food (journey-log B2, C2, D2): search or pick a usual food, set its portion in the item sheet, gather a plate
 * in the pill at the bottom and log it in one go; or take a photo and adjust what Geo saw item by item.
 * The diary opens it with ?meal=&date= so the plate lands on the right meal and day; the + sheet's Photo adds ?photo=1.
 */
export function FoodLogForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const online = useOnline()
  const logDate = searchParams.get('date') || undefined
  const photoRequested = searchParams.get('photo') === '1'

  const [meal, setMeal] = useState<Meal>(() => parseMeal(searchParams.get('meal')) ?? mealForTime(new Date()))
  const [mealMenuOpen, setMealMenuOpen] = useState(false)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchFailed, setSearchFailed] = useState(false)
  const [searchedQuery, setSearchedQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  const [personalFoods, setPersonalFoods] = useState<UserFood[]>([])
  useEffect(() => {
    let alive = true
    getPersonalFoods().then((foods) => { if (alive) setPersonalFoods(foods) }, () => { /* search still works */ })
    return () => { alive = false }
  }, [])

  // Favourites first, then the most recently used, for "Recent and favourites" before a search.
  const usual = useMemo(() => {
    const favourites = personalFoods.filter((f) => f.is_favorite)
    const recents = personalFoods
      .filter((f) => f.last_used_at && !f.is_favorite)
      .sort((a, b) => new Date(b.last_used_at!).getTime() - new Date(a.last_used_at!).getTime())
    return [...favourites, ...recents].slice(0, 10)
  }, [personalFoods])

  const [picked, setPicked] = useState<FoodSearchResult | null>(null)
  const [plate, setPlate] = useState<PlateItem[]>([])
  const [plateOpen, setPlateOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [failedNote, setFailedNote] = useState<string | null>(null)
  const [loggedCount, setLoggedCount] = useState(0)

  const [photo, setPhoto] = useState<File | null>(null)
  const [photoKey, setPhotoKey] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSearch = useCallback((q: string) => {
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.trim().length < 2) { setResults([]); setSearchFailed(false); return }
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

  const takePhoto = (file: File) => { setPhoto(file); setPhotoKey((n) => n + 1) }
  const openCamera = async () => {
    if (isNative()) {
      const file = await pickPhoto({ source: 'prompt' })
      if (file) takePhoto(file)
      return
    }
    fileInputRef.current?.click()
  }
  // The + sheet's Photo opens this page with photo=1: straight to the camera on native. Web needs a user tap.
  useEffect(() => {
    if (!photoRequested || !isNative()) return
    const timer = setTimeout(() => { void openCamera() }, 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per arrival
  }, [photoRequested])

  const toGeo = (prompt: string) => router.push(`/chat/session?id=${crypto.randomUUID()}&prefill=${encodeURIComponent(prompt)}`)

  const addToPlate = (item: PlateItem) => {
    setPlate((current) => [...current, item])
    setFailedNote(null)
  }
  const quickAdd = (food: FoodSearchResult) => {
    void haptic('selection')
    addToPlate(plateItemFor(food, 1, food.serving_size_g || 100))
  }

  const savePlate = async (items: PlateItem[]) => {
    if (items.length === 0 || saving) return
    setSaving(true)
    try {
      const drafts = items.map((i) => ({ food_name: i.name, quantity_g: i.grams, est_macros: i.macros, meal_type: meal.toLowerCase(), user_food_id: i.user_food_id }))
      const { failures } = await createLogs(buildFoodLogItems(drafts, null, logDate))
      const done = items.length - failures.length
      if (failures.length === 0) {
        void haptic('success')
        toast.success(`Logged ${items.length === 1 ? items[0].name : `${items.length} items`} to ${meal}`)
        router.back()
        return
      }
      // Partial: only what failed stays on the plate, and the plate sheet says so.
      const failed = failures.map((f) => items[f.index])
      setPlate(failed)
      setLoggedCount((n) => n + done)
      setFailedNote(done > 0
        ? `${failed.length === 1 ? failed[0].name : `${failed.length} items`} didn't save. The other ${done} did.`
        : 'Nothing saved. Check your connection and try again.')
      setPlateOpen(true)
    } catch {
      toast.error("Couldn't log that. Check your connection and try again.")
    } finally {
      setSaving(false)
    }
  }

  const trimmed = query.trim()
  const showResults = trimmed.length >= 2
  const noMatch = showResults && !searching && !searchFailed && results.length === 0 && searchedQuery === trimmed

  const header = (
    <PushedHeader
      title={photo ? 'Your photo' : 'Log food'}
      onBack={() => (photo ? setPhoto(null) : router.back())}
      actions={(
        <button
          type="button"
          onClick={() => { void haptic('selection'); setMealMenuOpen((open) => !open) }}
          aria-expanded={mealMenuOpen}
          aria-label={`Meal: ${meal}`}
          className="glass flex h-11 shrink-0 items-center gap-1 rounded-full pl-4 pr-3 text-body-sm font-semibold text-ink transition-transform active:scale-[.96]"
        >
          {meal}
          <ChevronDown aria-hidden="true" className={cn('size-4 transition-transform duration-200', mealMenuOpen && 'rotate-180')} />
        </button>
      )}
    />
  )

  const mealMenu = mealMenuOpen ? (
    <Chips
      className="scrollbar-hide -mx-4 mb-2 overflow-x-auto px-4 py-1"
      label="Meal"
      options={MEAL_OPTIONS}
      value={meal}
      onChange={(next) => { if (next) setMeal(next); setMealMenuOpen(false) }}
    />
  ) : null

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      onChange={(event) => { const file = event.target.files?.[0]; if (file) takePhoto(file); event.target.value = '' }}
      className="hidden"
    />
  )

  if (photo) {
    return (
      <div className="mx-auto w-full max-w-md px-4">
        {header}
        <div className="-mx-4 [&:not(:empty)]:mb-2"><OfflineBand /></div>
        {mealMenu}
        {fileInput}
        <PhotoResult
          key={photoKey}
          file={photo}
          meal={meal}
          onRetake={() => void openCamera()}
          onSearch={() => setPhoto(null)}
          onGeo={() => toGeo('Help me log what is on my plate')}
          onLogged={() => router.back()}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-[calc(96px+var(--safe-bottom))]">
      {header}
      <div className="-mx-4 [&:not(:empty)]:mb-2"><OfflineBand /></div>
      {mealMenu}

      {/* Pinned under the bar so a focused field never scrolls beneath it: iOS draws the caret above fixed layers.
          No band of its own: the bar above fills with glass once the page scrolls. */}
      <div className="sticky top-[calc(60px+var(--safe-top))] z-[30] -mx-4 px-4 pb-2 pt-1">
        <SearchField
          label="Search foods"
          value={query}
          onChange={handleSearch}
          placeholder="Search foods or brands"
          // Arriving from Search in the + sheet, the keyboard is already up (no extra tap).
          autoFocus={!photoRequested}
          testId="food-search-input"
        />
      </div>
      <div className="mt-1 grid grid-cols-2 gap-2">
        <MethodChip icon={CameraFill} label="Photo" onClick={() => void openCamera()} testId="photo-estimate-button" />
        <MethodChip icon={MenuFill} label="Menu" onClick={() => toGeo(MENU_PROMPT)} />
      </div>
      {fileInput}

      <div className="mt-4">
        {!online ? (
          <>
            <p role="status" className="px-1 text-body-sm leading-[1.4] text-ink">Search needs a connection. Your saved foods work offline, and logs send when you are back.</p>
            <FoodList title="Your foods" foods={personalFoods.map(asResult)} onPick={setPicked} onAdd={quickAdd} personal className="mt-5" />
          </>
        ) : !showResults ? (
          <FoodList title="Recent and favourites" foods={usual.map(asResult)} onPick={setPicked} onAdd={quickAdd} personal />
        ) : searching ? (
          <RowsSkeleton rows={5} label="Searching" />
        ) : searchFailed ? (
          <>
            <div role="status" className={cn(CARD, 'p-4')}>
              <p className="text-body-sm leading-[1.4] text-ink">I can&apos;t reach search right now. Your own foods still work.</p>
              <button type="button" onClick={() => handleSearch(query)} className="-ml-1 mt-1 min-h-11 px-1 text-body-sm font-semibold text-ink underline decoration-ink-35 underline-offset-4">Try again</button>
            </div>
            <FoodList title="Your foods" foods={personalFoods.map(asResult)} onPick={setPicked} onAdd={quickAdd} personal className="mt-5" />
          </>
        ) : noMatch ? (
          <>
            <p role="status" className="px-1 text-body-sm leading-[1.4] text-ink">Nothing matches &ldquo;{trimmed}&rdquo;. Try a shorter name, or snap a photo.</p>
            <FoodList title="Recent" foods={usual.slice(0, 4).map(asResult)} onPick={setPicked} onAdd={quickAdd} personal className="mt-5" />
          </>
        ) : (
          <FoodList foods={results} onPick={setPicked} onAdd={quickAdd} label="Search results" />
        )}
      </div>

      <FoodItemSheet
        food={picked}
        onClose={() => setPicked(null)}
        onAdd={(item) => { addToPlate(item); setPicked(null) }}
        onLogNow={(item) => { const next = [...plate, item]; setPlate(next); setPicked(null); void savePlate(next) }}
      />
      {/* The pill steps aside while a sheet is up, so the screen keeps one orange action. */}
      <PlatePill items={picked || plateOpen ? [] : plate} saving={saving} onOpen={() => setPlateOpen(true)} onLog={() => void savePlate(plate)} />
      <PlateSheet
        open={plateOpen}
        items={plate}
        meal={meal}
        saving={saving}
        failedNote={failedNote}
        loggedCount={loggedCount}
        onMeal={setMeal}
        onRemove={(key) => setPlate((current) => { const next = current.filter((i) => i.key !== key); if (!next.length) setPlateOpen(false); return next })}
        onClose={() => setPlateOpen(false)}
        onLog={() => void savePlate(plate)}
        onDone={() => router.back()}
      />
    </div>
  )
}

function FoodList({ title, foods, onPick, onAdd, personal, label, className }: {
  title?: string
  foods: FoodSearchResult[]
  onPick: (food: FoodSearchResult) => void
  onAdd: (food: FoodSearchResult) => void
  personal?: boolean
  label?: string
  className?: string
}) {
  if (foods.length === 0) return null
  return (
    <motion.section
      className={className}
      aria-label={label}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.18, ease: 'easeOut' } }}
    >
      {title ? <SectionTitle>{title}</SectionTitle> : null}
      <RiseList className={LIST}>
        {foods.map((food, index) => (
          <FoodRow key={food.id ?? `db-${food.usda_fdc_id ?? index}`} food={food} onPick={onPick} onAdd={onAdd} personal={personal} />
        ))}
      </RiseList>
    </motion.section>
  )
}

/** Tap the row for the item sheet; + puts one serving straight on the plate (D2). */
function FoodRow({ food, onPick, onAdd, personal }: { food: FoodSearchResult; onPick: (food: FoodSearchResult) => void; onAdd: (food: FoodSearchResult) => void; personal?: boolean }) {
  const tag = SOURCE_LABELS[String(food.source)]
  return (
    <div className="flex min-h-row items-center">
      <button
        type="button"
        onClick={() => { void haptic('selection'); onPick(food) }}
        data-testid={personal ? 'personal-food-row' : undefined}
        className="flex min-h-row min-w-0 flex-1 items-center gap-3 py-2 pl-4 pr-1 text-left transition-colors active:bg-ink-04"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body-sm font-semibold text-ink">{food.name}</span>
          <span className="block truncate text-caption text-ink-65 tabular-nums">
            {food.serving_size_g || 100} g · {formatMacroKcal(food.macros_per_serving.calories)} kcal{food.brand ? ` · ${food.brand}` : ''}
          </span>
        </span>
        {tag ? <span className={`shrink-0 text-label ${tag === 'Yours' ? 'text-ink' : 'text-ink-65'}`}>{tag}</span> : null}
      </button>
      <button type="button" onClick={() => onAdd(food)} aria-label={`Add ${food.name} to your plate`} className="grid size-11 shrink-0 place-items-center rounded-full text-ink transition-transform active:scale-[.9]">
        <Plus aria-hidden="true" strokeWidth={1.75} className="size-5" />
      </button>
    </div>
  )
}

function MethodChip({ icon: Icon, label, onClick, testId }: { icon: ComponentType<SVGProps<SVGSVGElement>>; label: string; onClick: () => void; testId?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className="flex h-11 items-center justify-center gap-2 rounded-full card-glass px-4 text-body-sm font-semibold text-ink transition-transform active:scale-[.96]"
    >
      <Icon aria-hidden="true" className="size-[18px] translate-y-[0.5px]" />
      {label}
    </button>
  )
}
