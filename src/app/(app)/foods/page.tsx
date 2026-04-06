'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Star, Trash2, Plus, Utensils, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { EmptyState } from '@/components/shared/empty-state'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import { getPersonalFoods, updateFood, deleteUserFood, saveFood } from '@/lib/api/foods.api'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import type { UserFood, FoodMacros } from '@/types/foods.types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Manual',
  usda: 'USDA',
  geo_estimate: 'Geo AI',
  personal: 'Personal',
}

const SOURCE_COLORS: Record<string, string> = {
  manual: 'bg-purple-100 text-purple-700',
  usda: 'bg-blue-100 text-blue-700',
  geo_estimate: 'bg-amber-100 text-amber-700',
  personal: 'bg-green-100 text-green-700',
}

function MacroPill({ label, value }: { label: string; value?: number }) {
  return (
    <span className="text-[11px] text-text-secondary">
      <span className="font-medium text-text-primary">{value ?? 0}</span>{' '}
      {label}
    </span>
  )
}

function FoodCard({
  food,
  onToggleFavorite,
  onDelete,
}: {
  food: UserFood
  onToggleFavorite: (id: string, current: boolean) => void
  onDelete: (id: string) => void
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const macros = food.macros_per_serving

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -80 }}
      transition={{ duration: 0.2 }}
      className="bg-surface border border-border rounded-xl px-4 py-3 flex items-start gap-3"
    >
      {/* Favorite star */}
      <button
        type="button"
        onClick={() => onToggleFavorite(food.id, food.is_favorite)}
        className="mt-0.5 shrink-0 active:scale-90 transition-transform"
        aria-label={food.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Star
          className={cn(
            'w-5 h-5 transition-colors',
            food.is_favorite
              ? 'fill-accent text-accent'
              : 'text-text-tertiary'
          )}
        />
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-text-primary truncate">
            {food.name}
          </p>
          <span
            className={cn(
              'shrink-0 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full',
              SOURCE_COLORS[food.source] ?? 'bg-gray-100 text-gray-600'
            )}
          >
            {SOURCE_LABELS[food.source] ?? food.source}
          </span>
        </div>

        {food.brand && (
          <p className="text-xs text-text-secondary truncate mt-0.5">
            {food.brand}
          </p>
        )}

        <div className="flex items-center gap-3 mt-1.5">
          <MacroPill label="cal" value={macros.calories} />
          <MacroPill label="P" value={macros.protein} />
          <MacroPill label="C" value={macros.carbs} />
          <MacroPill label="F" value={macros.fat} />
        </div>

        <p className="text-[10px] text-text-tertiary mt-1">
          {food.serving_size_g}g per serving
          {food.use_count > 0 && ` · Used ${food.use_count}x`}
        </p>
      </div>

      {/* Delete */}
      <button
        type="button"
        onClick={() => setShowDeleteConfirm(true)}
        className="mt-0.5 shrink-0 active:scale-90 transition-transform"
        aria-label="Delete food"
      >
        <Trash2 className="w-4 h-4 text-text-tertiary" />
      </button>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          onDelete(food.id)
          setShowDeleteConfirm(false)
        }}
        title="Delete food?"
        description={`This will permanently remove "${food.name}" from your saved foods.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </motion.div>
  )
}

function AddFoodForm({
  onSave,
  onClose,
}: {
  onSave: (food: UserFood) => void
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [servingSize, setServingSize] = useState('100')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

  return (
    <motion.form
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.2 }}
      onSubmit={handleSubmit}
      className="bg-surface border border-border rounded-2xl p-4 space-y-3"
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold text-text-primary">Add New Food</p>
        <button type="button" onClick={onClose} className="text-text-tertiary">
          <X className="w-4 h-4" />
        </button>
      </div>

      <input
        type="text"
        placeholder="Food name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent transition-colors"
        autoFocus
      />
      <input
        type="text"
        placeholder="Brand (optional)"
        value={brand}
        onChange={(e) => setBrand(e.target.value)}
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent transition-colors"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          placeholder="Serving (g)"
          value={servingSize}
          onChange={(e) => setServingSize(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent transition-colors"
        />
        <input
          type="number"
          placeholder="Calories"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent transition-colors"
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <input
          type="number"
          placeholder="Protein (g)"
          value={protein}
          onChange={(e) => setProtein(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent transition-colors"
        />
        <input
          type="number"
          placeholder="Carbs (g)"
          value={carbs}
          onChange={(e) => setCarbs(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent transition-colors"
        />
        <input
          type="number"
          placeholder="Fat (g)"
          value={fat}
          onChange={(e) => setFat(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Food'}
      </button>
    </motion.form>
  )
}

export default function FoodsPage() {
  useSetGeoScreen('food_database', {})

  const [foods, setFoods] = useState<UserFood[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  // Fetch foods on mount
  useEffect(() => {
    getPersonalFoods()
      .then(setFoods)
      .catch(() => toast.error('Failed to load foods'))
      .finally(() => setLoading(false))
  }, [])

  // Filter by search query
  const filtered = useMemo(() => {
    if (!search.trim()) return foods
    const q = search.toLowerCase()
    return foods.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.brand && f.brand.toLowerCase().includes(q))
    )
  }, [foods, search])

  // Split into favorites and all
  const favorites = useMemo(() => filtered.filter((f) => f.is_favorite), [filtered])
  const allFoods = useMemo(
    () => [...filtered].sort((a, b) => (b.use_count ?? 0) - (a.use_count ?? 0)),
    [filtered]
  )

  const handleToggleFavorite = useCallback(
    async (id: string, currentFavorite: boolean) => {
      // Optimistic update
      setFoods((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, is_favorite: !currentFavorite } : f
        )
      )
      try {
        await updateFood(id, { is_favorite: !currentFavorite })
      } catch {
        // Revert on failure
        setFoods((prev) =>
          prev.map((f) =>
            f.id === id ? { ...f, is_favorite: currentFavorite } : f
          )
        )
        toast.error('Failed to update favorite')
      }
    },
    []
  )

  const handleDelete = useCallback(async (id: string) => {
    const backup = foods
    setFoods((prev) => prev.filter((f) => f.id !== id))
    try {
      await deleteUserFood(id)
      toast.success('Food deleted')
    } catch {
      setFoods(backup)
      toast.error('Failed to delete food')
    }
  }, [foods])

  const handleFoodAdded = useCallback((food: UserFood) => {
    setFoods((prev) => [food, ...prev])
    setShowAddForm(false)
  }, [])

  if (loading) {
    return (
      <PageWrapper>
        <h1 className="text-[22px] font-semibold tracking-tight text-text-primary mb-4">
          My Foods
        </h1>
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper className="pb-32">
      <h1 className="text-[22px] font-semibold tracking-tight text-text-primary mb-4">
        My Foods
      </h1>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input
          type="text"
          placeholder="Search foods..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent transition-colors"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-text-tertiary" />
          </button>
        )}
      </div>

      {/* Add Food Form */}
      <AnimatePresence>
        {showAddForm && (
          <div className="mb-4">
            <AddFoodForm
              onSave={handleFoodAdded}
              onClose={() => setShowAddForm(false)}
            />
          </div>
        )}
      </AnimatePresence>

      {foods.length === 0 ? (
        <EmptyState
          icon={Utensils}
          title="No saved foods yet"
          description="Foods you log will appear here automatically."
        >
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="mt-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Add Your First Food
          </button>
        </EmptyState>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matches"
          description={`No foods match "${search}"`}
        />
      ) : (
        <div className="space-y-5">
          {/* Favorites section */}
          {favorites.length > 0 && (
            <section>
              <p className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary px-1 mb-2">
                Favorites
              </p>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {favorites.map((food) => (
                    <FoodCard
                      key={food.id}
                      food={food}
                      onToggleFavorite={handleToggleFavorite}
                      onDelete={handleDelete}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {/* All Foods section */}
          <section>
            <p className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary px-1 mb-2">
              All Foods
              {filtered.length > 0 && (
                <span className="ml-1 text-text-tertiary">({filtered.length})</span>
              )}
            </p>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {allFoods.map((food) => (
                  <FoodCard
                    key={food.id}
                    food={food}
                    onToggleFavorite={handleToggleFavorite}
                    onDelete={handleDelete}
                  />
                ))}
              </AnimatePresence>
            </div>
          </section>
        </div>
      )}

      {/* Floating Add Button */}
      {!showAddForm && (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="fixed bottom-24 right-5 z-50 w-14 h-14 rounded-full bg-accent shadow-lg flex items-center justify-center hover:bg-accent-hover transition-colors active:scale-95"
          aria-label="Add new food"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      )}
    </PageWrapper>
  )
}
