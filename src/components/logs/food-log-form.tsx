'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createLog } from '@/lib/api/logs.api'

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

  const handleSave = async () => {
    if (!foodName.trim()) {
      toast.error('Food name is required')
      return
    }

    setSaving(true)
    try {
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
