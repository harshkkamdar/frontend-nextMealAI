'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Pencil, Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PushedHeader } from '@/components/layout/screen-header'
import { CARD, LIST, RiseList, RowsSkeleton, SearchField, SectionTitle } from '@/components/logs/log-ui'
import { FoodFormSheet } from '@/components/logs/food-form-sheet'
import { OfflineBand } from '@/components/shared/offline-band'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { PlusIcon } from '@/components/ui/fiqr/icons'
import { RoundButton } from '@/components/ui/fiqr/round-button'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import { deleteUserFood, getPersonalFoods, updateFood } from '@/lib/api/foods.api'
import { formatMacroKcal } from '@/lib/macros'
import { haptic } from '@/lib/platform/app'
import type { UserFood } from '@/types/foods.types'

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Added by you',
  usda: 'USDA',
  geo_estimate: 'From Geo',
  personal: 'Yours',
}

/** Holds a delete back this long so Undo can cancel it before anything reaches the server. */
const UNDO_MS = 4000

const n = (v?: number) => (v == null ? '-' : String(Math.round(v)))
const macroLine = (food: UserFood) => {
  const m = food.macros_per_serving
  return `${food.serving_size_g || 100} g · ${m.calories == null ? '-' : formatMacroKcal(m.calories)} kcal · P ${n(m.protein)} · C ${n(m.carbs)} · F ${n(m.fat)}`
}

function FoodRow({ food, onToggleFavorite, onMore }: { food: UserFood; onToggleFavorite: (food: UserFood) => void; onMore: (food: UserFood) => void }) {
  return (
    <div className="flex min-h-row items-center gap-1 pl-1.5 pr-1.5">
      <button
        type="button"
        onClick={() => { void haptic('selection'); onToggleFavorite(food) }}
        aria-label={food.is_favorite ? `Remove ${food.name} from favourites` : `Add ${food.name} to favourites`}
        aria-pressed={food.is_favorite}
        className="grid size-11 shrink-0 place-items-center rounded-full text-ink transition-transform active:scale-[.9]"
      >
        <Star className={`size-[18px] ${food.is_favorite ? 'fill-current text-ink' : 'text-ink-35'}`} />
      </button>
      <div className="min-w-0 flex-1 py-2.5">
        <p className="truncate text-body-sm font-bold text-ink">{food.name}</p>
        <p className="truncate text-caption text-ink-65 tabular-nums">{macroLine(food)}</p>
        <p className="truncate text-caption text-ink-65">
          {SOURCE_LABELS[food.source] ?? food.source}{food.brand ? ` · ${food.brand}` : ''} · used {(food.use_count ?? 0).toLocaleString('en-AU')}×
        </p>
      </div>
      <button
        type="button"
        onClick={() => onMore(food)}
        aria-label={`More options for ${food.name}`}
        className="grid size-11 shrink-0 place-items-center rounded-full text-ink-65 transition-transform active:scale-[.94]"
      >
        <MoreHorizontal className="size-5" />
      </button>
    </div>
  )
}

/** Your foods (journey-log F): favourites, then every saved food by use; star, options sheet, Add a food. */
export default function FoodsPage() {
  useSetGeoScreen('food_database', {})
  const router = useRouter()

  const [foods, setFoods] = useState<UserFood[]>([])
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [search, setSearch] = useState('')
  // Each sheet keeps its last content while it slides away, so open is separate from what it shows.
  const [formOpen, setFormOpen] = useState(false)
  const [sheetForm, setSheetForm] = useState<{ food: UserFood | null; seq: number }>({ food: null, seq: 0 })
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [sheetFood, setSheetFood] = useState<UserFood | null>(null)
  const openForm = (food: UserFood | null) => { setSheetForm((f) => ({ food, seq: f.seq + 1 })); setFormOpen(true) }
  const openOptions = (food: UserFood) => { setSheetFood(food); setOptionsOpen(true) }
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  const loadFoods = useCallback(() => {
    getPersonalFoods()
      .then((next) => { setFoods(next); setLoadFailed(false) })
      .catch(() => setLoadFailed(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(loadFoods, [loadFoods])

  const shown = useMemo(() => foods.filter((food) => !hidden.has(food.id)), [foods, hidden])
  const filtered = useMemo(() => {
    if (!search.trim()) return shown
    const query = search.toLowerCase()
    return shown.filter((food) => food.name.toLowerCase().includes(query) || food.brand?.toLowerCase().includes(query))
  }, [shown, search])
  const favorites = useMemo(() => filtered.filter((food) => food.is_favorite), [filtered])
  const allFoods = useMemo(() => [...filtered].sort((a, b) => (b.use_count ?? 0) - (a.use_count ?? 0)), [filtered])

  const handleToggleFavorite = useCallback(async (food: UserFood) => {
    const was = food.is_favorite
    setFoods((current) => current.map((f) => f.id === food.id ? { ...f, is_favorite: !was } : f))
    try {
      await updateFood(food.id, { is_favorite: !was })
    } catch {
      setFoods((current) => current.map((f) => f.id === food.id ? { ...f, is_favorite: was } : f))
      toast.error("Couldn't update favourites. Try again.")
    }
  }, [])

  // The row leaves at once; the server delete waits out the Undo window, and a failure brings it back.
  const handleDelete = (food: UserFood) => {
    const show = (on: boolean) => setHidden((prev) => { const next = new Set(prev); if (on) next.delete(food.id); else next.add(food.id); return next })
    show(false)
    let undone = false
    const timer = setTimeout(() => {
      if (undone) return
      deleteUserFood(food.id).then(
        () => setFoods((current) => current.filter((f) => f.id !== food.id)),
        () => { show(true); toast.error("Couldn't delete that food. Try again.") },
      )
    }, UNDO_MS)
    toast.success('Food deleted. Logged meals stay.', { duration: UNDO_MS, action: { label: 'Undo', onClick: () => { undone = true; clearTimeout(timer); show(true) } } })
  }

  const handleSaved = useCallback((food: UserFood) => {
    setFoods((current) => current.some((f) => f.id === food.id) ? current.map((f) => f.id === food.id ? food : f) : [food, ...current])
    setFormOpen(false)
  }, [])

  const optionRow = 'flex min-h-row w-full items-center gap-3 border-b border-ink-06 px-4 text-left text-body font-semibold text-ink last:border-b-0 active:bg-ink-04'

  return (
    <div className="mx-auto w-full max-w-md px-gutter pb-[calc(106px+var(--safe-bottom))]">
      <PushedHeader
        title="Your foods"
        onBack={() => router.back()}
        actions={<RoundButton aria-label="Add a food" onClick={() => openForm(null)}><PlusIcon /></RoundButton>}
      />
      <div className="-mx-gutter [&:not(:empty)]:mb-2"><OfflineBand /></div>

      {/* Nothing saved yet: nothing to search. */}
      <div className={!loading && !loadFailed && shown.length === 0 ? 'hidden' : 'mt-1'}>
        <SearchField label="Search your foods" value={search} onChange={setSearch} placeholder="Search your foods" />
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="space-y-5">
            <section><SectionTitle>Favourites</SectionTitle><RowsSkeleton rows={2} label="Loading your foods" /></section>
            <section aria-hidden="true"><SectionTitle>All</SectionTitle><RowsSkeleton rows={4} label="Loading" /></section>
          </div>
        ) : loadFailed && foods.length === 0 ? (
          <div role="alert" className={`${CARD} p-4`}>
            <p className="text-body-sm text-ink">I couldn&apos;t load your foods.</p>
            <button type="button" onClick={() => { setLoading(true); loadFoods() }} className="-ml-1 mt-1 min-h-11 px-1 text-body-sm font-semibold text-ink underline decoration-ink-35 underline-offset-4">Try again</button>
          </div>
        ) : shown.length === 0 ? (
          <div className={`${CARD} p-4`}>
            <p className="text-headline text-ink">Nothing saved yet</p>
            <p className="mt-1 text-caption leading-[1.4] text-ink-65">Foods you log land here, so your usual ones are one tap away. You can also add one by hand.</p>
            <button type="button" onClick={() => openForm(null)} className="mt-3 flex h-11 items-center gap-1.5 rounded-full bg-ink px-4 text-body-sm font-semibold text-cream transition-transform active:scale-[.96]">
              <PlusIcon aria-hidden="true" className="size-4" />Add a food
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <p role="status" className="px-1 text-body-sm leading-[1.4] text-ink">
            None of your foods match &ldquo;{search.trim()}&rdquo;. Search all foods from the + button.
          </p>
        ) : (
          <div className="space-y-5">
            {favorites.length > 0 ? (
              <section>
                <SectionTitle>Favourites</SectionTitle>
                <RiseList className={LIST}>
                  {favorites.map((food) => <FoodRow key={`favorite-${food.id}`} food={food} onToggleFavorite={handleToggleFavorite} onMore={openOptions} />)}
                </RiseList>
              </section>
            ) : null}
            <section>
              <SectionTitle>All, most used first</SectionTitle>
              <RiseList className={LIST}>
                {allFoods.map((food) => <FoodRow key={food.id} food={food} onToggleFavorite={handleToggleFavorite} onMore={openOptions} />)}
              </RiseList>
            </section>
          </div>
        )}
      </div>

      <BottomSheet open={optionsOpen} onClose={() => setOptionsOpen(false)} ariaLabel={sheetFood ? `${sheetFood.name} options` : 'Food options'}>
        {sheetFood ? (
          <div className="px-4 pb-4 pt-2">
            <p className="line-clamp-2 text-headline text-ink">{sheetFood.name}</p>
            <p className="mt-0.5 text-caption text-ink-65 tabular-nums">{macroLine(sheetFood)}</p>
            <div className={`${LIST} mt-4`}>
              <button type="button" onClick={() => { const f = sheetFood; setOptionsOpen(false); void handleToggleFavorite(f) }} className={optionRow}>
                <Star aria-hidden="true" className={`size-5 ${sheetFood.is_favorite ? 'fill-current' : ''}`} />
                {sheetFood.is_favorite ? 'Remove from favourites' : 'Add to favourites'}
              </button>
              <button type="button" onClick={() => { setOptionsOpen(false); openForm(sheetFood) }} className={optionRow}>
                <Pencil aria-hidden="true" className="size-5" />Edit
              </button>
              <button type="button" onClick={() => { const f = sheetFood; setOptionsOpen(false); handleDelete(f) }} className={optionRow}>
                <Trash2 aria-hidden="true" className="size-5" />Delete food
              </button>
            </div>
          </div>
        ) : null}
      </BottomSheet>

      <FoodFormSheet key={sheetForm.seq} open={formOpen} food={sheetForm.food} onClose={() => setFormOpen(false)} onSaved={handleSaved} />
    </div>
  )
}
