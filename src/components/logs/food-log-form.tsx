'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X, MessageCircle, Camera, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createLog } from '@/lib/api/logs.api'
import {
  estimateFoodFromPhoto,
  logFromEstimate,
  type FoodEstimate,
} from '@/lib/api/foods.api'

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

export function FoodLogForm() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [foodName, setFoodName] = useState('')
  const [quantityG, setQuantityG] = useState<number | ''>('')
  const [mealType, setMealType] = useState('')
  const [calories, setCalories] = useState<number | ''>('')
  const [protein, setProtein] = useState<number | ''>('')
  const [carbs, setCarbs] = useState<number | ''>('')
  const [fat, setFat] = useState<number | ''>('')

  // FB-R6-13 — Photo estimate flow. When estimateId is set, Save calls
  // log-from-estimate (with edits) instead of the regular createLog path.
  const [estimating, setEstimating] = useState(false)
  const [estimateId, setEstimateId] = useState<string | null>(null)
  const [estimateConfidence, setEstimateConfidence] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
          },
          source: 'manual',
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
      <div className="space-y-4">
        <div className="space-y-1">
          <Label className="text-xs text-text-secondary">Food Name</Label>
          <Input
            type="text"
            placeholder="e.g. Grilled chicken breast"
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-text-secondary">Quantity (g)</Label>
          <Input
            type="number"
            placeholder="Optional"
            value={quantityG}
            onChange={(e) => setQuantityG(e.target.value ? Number(e.target.value) : '')}
          />
        </div>

        {/* Macros 2x2 grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-text-secondary">Calories</Label>
            <Input
              type="number"
              placeholder="kcal"
              value={calories}
              onChange={(e) => setCalories(e.target.value ? Number(e.target.value) : '')}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-text-secondary">Protein</Label>
            <Input
              type="number"
              placeholder="g"
              value={protein}
              onChange={(e) => setProtein(e.target.value ? Number(e.target.value) : '')}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-text-secondary">Carbs</Label>
            <Input
              type="number"
              placeholder="g"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value ? Number(e.target.value) : '')}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-text-secondary">Fat</Label>
            <Input
              type="number"
              placeholder="g"
              value={fat}
              onChange={(e) => setFat(e.target.value ? Number(e.target.value) : '')}
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

      {/* Save */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-accent hover:bg-accent-hover text-white mt-6"
      >
        {saving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  )
}
