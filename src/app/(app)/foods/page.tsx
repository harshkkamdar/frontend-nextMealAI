'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Star } from 'lucide-react'
import { toast } from 'sonner'
import { PushedHeader } from '@/components/layout/screen-header'
import { CARD, EmptySlot, FIELD, LIST, ROW, RiseList, RowsSkeleton, SearchField, SectionTitle } from '@/components/logs/log-ui'
import { FieldLabel } from '@/components/logs/manual-log-shell'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { OfflineBand } from '@/components/shared/offline-band'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { ErrorState } from '@/components/ui/fiqr/error-state'
import { PlusIcon } from '@/components/ui/fiqr/icons'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { RoundButton } from '@/components/ui/fiqr/round-button'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import { deleteUserFood, getPersonalFoods, saveFood, updateFood } from '@/lib/api/foods.api'
import { haptic } from '@/lib/platform/app'
import { cn } from '@/lib/utils'
import type { UserFood } from '@/types/foods.types'

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Added by you',
  usda: 'USDA',
  geo_estimate: 'From Geo',
  personal: 'Yours',
}

function FoodRow({
  food,
  onToggleFavorite,
  onDelete,
}: {
  food: UserFood
  onToggleFavorite: (id: string, current: boolean) => void
  onDelete: (id: string) => void | Promise<void>
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const macros = food.macros_per_serving

  return (
    <div className={cn(ROW, 'gap-1 pl-2 pr-2 active:bg-transparent')}>
      <button
        type="button"
        onClick={() => { void haptic('selection'); onToggleFavorite(food.id, food.is_favorite) }}
        aria-label={food.is_favorite ? `Remove ${food.name} from favourites` : `Add ${food.name} to favourites`}
        aria-pressed={food.is_favorite}
        className="grid size-11 shrink-0 place-items-center rounded-full text-ink transition-transform active:scale-[.9]"
      >
        <Star className={cn('size-5', food.is_favorite ? 'fill-current' : 'text-ink-35')} />
      </button>

      <div className="min-w-0 flex-1 py-0.5">
        <p className="truncate text-[15.5px] font-semibold text-ink">{food.name}</p>
        <p className="truncate text-[13px] text-ink-65 tabular-nums">
          {food.serving_size_g || 100} g · {macros.calories ?? 0} kcal · P {macros.protein ?? 0} · C {macros.carbs ?? 0} · F {macros.fat ?? 0}
        </p>
        <p className="truncate text-[12px] font-medium text-ink-65">
          {SOURCE_LABELS[food.source] ?? food.source}{food.brand ? ` · ${food.brand}` : ''} · used {food.use_count ?? 0}×
        </p>
      </div>

      <button
        type="button"
        onClick={() => setMenuOpen(true)}
        aria-label={`More options for ${food.name}`}
        className="grid size-11 shrink-0 place-items-center rounded-full text-ink-65 transition-transform active:scale-[.94]"
      >
        <MoreHorizontal className="size-5" />
      </button>

      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} ariaLabel={`${food.name} options`}>
        <div className="px-5 pb-5 pt-3">
          <p className="font-wide text-[22px] font-bold leading-tight text-ink">{food.name}</p>
          <p className="mt-1 text-[14px] text-ink-65 tabular-nums">{food.serving_size_g || 100} g · {macros.calories ?? 0} kcal</p>
          <div className={cn(LIST, 'mt-5')}>
            <button
              type="button"
              onClick={() => { setMenuOpen(false); onToggleFavorite(food.id, food.is_favorite) }}
              className={ROW}
            >
              <Star aria-hidden="true" className={cn('size-5 text-ink', food.is_favorite && 'fill-current')} />
              <span className="text-[16px] font-semibold text-ink">{food.is_favorite ? 'Remove from favourites' : 'Add to favourites'}</span>
            </button>
            <button
              type="button"
              onClick={() => { setMenuOpen(false); setShowDeleteConfirm(true) }}
              className={ROW}
            >
              <span aria-hidden="true" className="size-5" />
              <span className="text-[16px] font-semibold text-ink">Delete food</span>
            </button>
          </div>
        </div>
      </BottomSheet>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          await onDelete(food.id)
          setShowDeleteConfirm(false)
        }}
        title="Delete this food?"
        description={`"${food.name}" leaves your saved foods. Meals you already logged stay as they are.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}

function AddFoodForm({ onSave }: { onSave: (food: UserFood) => void }) {
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [servingSize, setServingSize] = useState('100')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim()) {
      toast.error('Give the food a name')
      return
    }
    setSaving(true)
    try {
      const food = await saveFood({
        name: name.trim(),
        brand: brand.trim() || undefined,
        serving_size_g: parseFloat(servingSize) || 100,
        macros_per_serving: {
          calories: parseInt(calories) || 0,
          protein: parseInt(protein) || 0,
          carbs: parseInt(carbs) || 0,
          fat: parseInt(fat) || 0,
        },
        source: 'manual',
        is_favorite: false,
      })
      onSave(food)
      void haptic('success')
      toast.success('Food saved')
    } catch {
      toast.error("Couldn't save that food. Try again.")
    } finally {
      setSaving(false)
    }
  }

  const input = cn(FIELD, 'h-14 bg-card')
  const field = (id: string, label: string, value: string, set: (v: string) => void, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="min-w-0">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input id={id} value={value} onChange={(event) => set(event.target.value)} className={input} {...props} />
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-2 pt-3">
        <h2 className="font-wide text-[22px] font-bold leading-tight text-ink">Add a food</h2>
        {field('food-name', 'Name', name, setName, { type: 'text', placeholder: 'Overnight oats', autoFocus: true })}
        {field('food-brand', 'Brand (optional)', brand, setBrand, { type: 'text' })}
        <div className="grid grid-cols-2 gap-3">
          {field('food-serving', 'Serving, g', servingSize, setServingSize, { type: 'number', inputMode: 'decimal' })}
          {field('food-kcal', 'Calories', calories, setCalories, { type: 'number', inputMode: 'numeric' })}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {field('food-protein', 'Protein, g', protein, setProtein, { type: 'number', inputMode: 'decimal' })}
          {field('food-carbs', 'Carbs, g', carbs, setCarbs, { type: 'number', inputMode: 'decimal' })}
          {field('food-fat', 'Fat, g', fat, setFat, { type: 'number', inputMode: 'decimal' })}
        </div>
      </div>
      <div className="px-5 pb-5 pt-3">
        <PrimaryButton type="submit" disabled={saving} aria-busy={saving} className="justify-center">
          {saving ? 'Saving…' : 'Save food'}
        </PrimaryButton>
      </div>
    </form>
  )
}

export default function FoodsPage() {
  useSetGeoScreen('food_database', {})
  const router = useRouter()

  const [foods, setFoods] = useState<UserFood[]>([])
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  const loadFoods = useCallback(() => {
    getPersonalFoods()
      .then((next) => { setFoods(next); setLoadFailed(false) })
      .catch(() => setLoadFailed(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(loadFoods, [loadFoods])

  const filtered = useMemo(() => {
    if (!search.trim()) return foods
    const query = search.toLowerCase()
    return foods.filter((food) => food.name.toLowerCase().includes(query) || food.brand?.toLowerCase().includes(query))
  }, [foods, search])

  const favorites = useMemo(() => filtered.filter((food) => food.is_favorite), [filtered])
  const allFoods = useMemo(
    () => [...filtered].sort((a, b) => (b.use_count ?? 0) - (a.use_count ?? 0)),
    [filtered],
  )

  const handleToggleFavorite = useCallback(async (id: string, currentFavorite: boolean) => {
    setFoods((current) => current.map((food) => food.id === id ? { ...food, is_favorite: !currentFavorite } : food))
    try {
      await updateFood(id, { is_favorite: !currentFavorite })
    } catch {
      setFoods((current) => current.map((food) => food.id === id ? { ...food, is_favorite: currentFavorite } : food))
      toast.error("Couldn't update favourites. Try again.")
    }
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    const backup = foods
    setFoods((current) => current.filter((food) => food.id !== id))
    try {
      await deleteUserFood(id)
      toast.success('Food deleted')
    } catch {
      setFoods(backup)
      toast.error("Couldn't delete that food. Try again.")
    }
  }, [foods])

  const handleFoodAdded = useCallback((food: UserFood) => {
    setFoods((current) => [food, ...current])
    setShowAddForm(false)
  }, [])

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-6">
      <PushedHeader
        title="Your foods"
        onBack={() => router.back()}
        actions={<RoundButton aria-label="Add a food" onClick={() => setShowAddForm(true)}><PlusIcon /></RoundButton>}
      />
      <div className="-mx-4 [&:not(:empty)]:mb-2"><OfflineBand /></div>

      <div className="mt-2">
        <SearchField label="Search your foods" value={search} onChange={setSearch} placeholder="Search your foods" />
      </div>

      <BottomSheet open={showAddForm} onClose={() => setShowAddForm(false)} ariaLabel="Add a food">
        <AddFoodForm onSave={handleFoodAdded} />
      </BottomSheet>

      <div className="mt-6">
        {loading ? (
          <RowsSkeleton rows={4} label="Loading your foods" />
        ) : loadFailed && foods.length === 0 ? (
          <ErrorState onRetry={() => { setLoading(true); loadFoods() }}>I couldn&apos;t load your foods. Check your connection and try again.</ErrorState>
        ) : foods.length === 0 ? (
          <div className={cn(CARD, 'p-5')}>
            <p className="font-wide text-[19px] font-bold leading-tight text-ink">Nothing saved yet</p>
            <p className="mt-1 text-[15px] leading-[1.45] text-ink-65">Foods you log land here, so your usual ones are one tap away. You can also add one by hand.</p>
            <div className="mt-4"><EmptySlot onClick={() => setShowAddForm(true)}>Add a food</EmptySlot></div>
          </div>
        ) : filtered.length === 0 ? (
          <p role="status" className="px-1 text-[15.5px] leading-[1.45] text-ink">
            None of your foods match &ldquo;{search.trim()}&rdquo;.
          </p>
        ) : (
          <div className="space-y-6">
            {favorites.length > 0 ? (
              <section>
                <SectionTitle>Favourites</SectionTitle>
                <RiseList className={LIST}>
                  {favorites.map((food) => (
                    <FoodRow key={`favorite-${food.id}`} food={food} onToggleFavorite={handleToggleFavorite} onDelete={handleDelete} />
                  ))}
                </RiseList>
              </section>
            ) : null}

            <section>
              <SectionTitle>All foods · {allFoods.length}</SectionTitle>
              <RiseList className={LIST}>
                {allFoods.map((food) => (
                  <FoodRow key={food.id} food={food} onToggleFavorite={handleToggleFavorite} onDelete={handleDelete} />
                ))}
              </RiseList>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
