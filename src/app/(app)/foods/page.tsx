'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { MoreHorizontal, Plus, Search, Star, Utensils, X } from 'lucide-react'
import { toast } from 'sonner'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { ErrorState } from '@/components/ui/fiqr/error-state'
import { EmptyState } from '@/components/shared/empty-state'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { SectionLabel } from '@/components/ui/fiqr/section-label'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import { deleteUserFood, getPersonalFoods, saveFood, updateFood } from '@/lib/api/foods.api'
import type { UserFood } from '@/types/foods.types'

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Manual',
  usda: 'USDA',
  geo_estimate: 'Geo',
  personal: 'Personal',
}

function FoodRow({
  food,
  onToggleFavorite,
  onDelete,
}: {
  food: UserFood
  onToggleFavorite: (id: string, current: boolean) => void
  onDelete: (id: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const macros = food.macros_per_serving

  return (
    <div className="flex min-h-16 items-start gap-3 px-[14px] py-3">
      <button
        type="button"
        onClick={() => onToggleFavorite(food.id, food.is_favorite)}
        aria-label={food.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
        className={`-my-2.5 -ml-2.5 flex size-11 shrink-0 items-center justify-center ${food.is_favorite ? 'text-accent' : 'text-ink-65'}`}
      >
        <Star className={`size-6 ${food.is_favorite ? 'fill-current' : ''}`} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p className="truncate text-[15.5px] font-semibold text-ink">{food.name}</p>
          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[1.4px] text-ink-65">
            {SOURCE_LABELS[food.source] ?? food.source}
          </span>
        </div>
        <p className="mt-0.5 text-[13px] leading-[1.45] text-ink-65">
          {food.serving_size_g || 100}g · {macros.calories ?? 0} kcal · {macros.protein ?? 0}P {macros.carbs ?? 0}C {macros.fat ?? 0}F · used {food.use_count ?? 0}×
        </p>
      </div>

      <button
        type="button"
        onClick={() => setMenuOpen(true)}
        aria-label={`More options for ${food.name}`}
        className="-my-2.5 -mr-2.5 flex size-11 shrink-0 items-center justify-center text-ink-65"
      >
        <MoreHorizontal className="size-6" />
      </button>

      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} ariaLabel={`${food.name} options`}>
        <div className="px-gutter pb-6 pt-3">
          <p className="text-[17px] font-bold text-ink">{food.name}</p>
          <button
            type="button"
            onClick={() => { setMenuOpen(false); setShowDeleteConfirm(true) }}
            className="mt-4 h-12 w-full rounded-[15px] bg-ink-08 text-[15.5px] font-semibold text-ink"
          >
            Delete
          </button>
        </div>
      </BottomSheet>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          await onDelete(food.id)
          setShowDeleteConfirm(false)
        }}
        title="Delete food?"
        description={`This will permanently remove "${food.name}" from your saved foods.`}
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
      toast.error('Name is required')
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
      toast.success('Food saved')
    } catch {
      toast.error('Failed to save food')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'h-14 w-full rounded-[15px] border border-ink-16 bg-card px-4 text-[15.5px] font-semibold text-ink outline-none placeholder:text-ink-35 focus:border-ink'

  return (
    <form onSubmit={handleSubmit} className="space-y-3 px-gutter pb-6 pt-3">
      <h2 className="text-[22px] font-semibold tracking-[-0.4px] text-ink">Add a food</h2>
      <input type="text" placeholder="Food name *" value={name} onChange={(event) => setName(event.target.value)} className={inputClass} autoFocus />
      <input type="text" placeholder="Brand (optional)" value={brand} onChange={(event) => setBrand(event.target.value)} className={inputClass} />
      <div className="grid grid-cols-2 gap-2">
        <input type="number" placeholder="Serving (g)" value={servingSize} onChange={(event) => setServingSize(event.target.value)} className={inputClass} />
        <input type="number" placeholder="Calories" value={calories} onChange={(event) => setCalories(event.target.value)} className={inputClass} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <input type="number" placeholder="Protein (g)" value={protein} onChange={(event) => setProtein(event.target.value)} className={inputClass} />
        <input type="number" placeholder="Carbs (g)" value={carbs} onChange={(event) => setCarbs(event.target.value)} className={inputClass} />
        <input type="number" placeholder="Fat (g)" value={fat} onChange={(event) => setFat(event.target.value)} className={inputClass} />
      </div>
      <PrimaryButton type="submit" disabled={saving} className="justify-center">
        {saving ? 'Saving…' : 'Save food'}
      </PrimaryButton>
    </form>
  )
}

export default function FoodsPage() {
  useSetGeoScreen('food_database', {})

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
      toast.error('Failed to update favorite')
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
      toast.error('Failed to delete food')
    }
  }, [foods])

  const handleFoodAdded = useCallback((food: UserFood) => {
    setFoods((current) => [food, ...current])
    setShowAddForm(false)
  }, [])

  return (
    <PageWrapper className="pb-32">
      <h1 className="text-[22px] font-semibold tracking-[-0.4px] text-ink">Foods</h1>

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-65" />
        <input
          type="text"
          placeholder="Search foods, brands, or describe it"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-14 w-full rounded-[15px] border border-ink-16 bg-card pl-11 pr-11 text-[17px] text-ink outline-none placeholder:text-ink-35 focus:border-ink"
        />
        {search ? (
          <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-1.5 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center text-ink-65">
            <X className="size-5" />
          </button>
        ) : null}
      </div>

      {!showAddForm ? (
        <PrimaryButton type="button" onClick={() => setShowAddForm(true)} icon={<Plus className="size-5" />} className="mt-3">
          Add a food
        </PrimaryButton>
      ) : null}

      <BottomSheet open={showAddForm} onClose={() => setShowAddForm(false)} ariaLabel="Add a food">
        <AddFoodForm onSave={handleFoodAdded} />
      </BottomSheet>

      <div className="mt-8">
        {loading ? (
          <div className="space-y-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : loadFailed && foods.length === 0 ? (
          <ErrorState onRetry={() => { setLoading(true); loadFoods() }}>I couldn&apos;t load your foods. Check your connection and try again.</ErrorState>
        ) : foods.length === 0 ? (
          <EmptyState icon={Utensils} title="No saved foods yet" description="Foods you log will appear here automatically." />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Search} title="No matches" description={`No foods match "${search}"`} />
        ) : (
          <div className="space-y-7">
            {favorites.length > 0 ? (
              <section>
                <SectionLabel className="mb-2">Favourites</SectionLabel>
                <div className="overflow-hidden rounded-[16px] border border-ink-12 bg-card divide-y divide-ink-09">
                  {favorites.map((food) => (
                    <FoodRow key={`favorite-${food.id}`} food={food} onToggleFavorite={handleToggleFavorite} onDelete={handleDelete} />
                  ))}
                </div>
              </section>
            ) : null}

            <section>
              <SectionLabel className="mb-2">All foods · {allFoods.length}</SectionLabel>
              <div className="overflow-hidden rounded-[16px] border border-ink-12 bg-card divide-y divide-ink-09">
                {allFoods.map((food) => (
                  <FoodRow key={food.id} food={food} onToggleFavorite={handleToggleFavorite} onDelete={handleDelete} />
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
