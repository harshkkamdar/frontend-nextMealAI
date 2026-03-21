'use client'

import { useEffect, useState } from 'react'
import { getProfile, updateProfile } from '@/lib/api/profile.api'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Loader2, MessageCircle } from 'lucide-react'
import type { Profile, PrimaryGoal, ActivityLevel, DietaryStyle } from '@/types/profile.types'

const GOAL_OPTIONS: { value: PrimaryGoal; label: string }[] = [
  { value: 'fat_loss', label: 'Fat Loss' },
  { value: 'muscle_gain', label: 'Muscle Gain' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'body_recomposition', label: 'Recomposition' },
  { value: 'improve_health', label: 'Improve Health' },
  { value: 'athletic_performance', label: 'Performance' },
]

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Very Active' },
]

const DIETARY_OPTIONS: { value: DietaryStyle; label: string }[] = [
  { value: 'omnivore', label: 'Omnivore' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'pescatarian', label: 'Pescatarian' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' },
]

const EQUIPMENT_OPTIONS = [
  'Dumbbells',
  'Barbell',
  'Resistance bands',
  'Pull-up bar',
  'Kettlebell',
  'Bench',
  'Cable machine',
  'None',
]

export function ProfileForm() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [currentWeight, setCurrentWeight] = useState('')
  const [targetWeight, setTargetWeight] = useState('')
  const [height, setHeight] = useState('')
  const [goal, setGoal] = useState<PrimaryGoal | undefined>()
  const [activity, setActivity] = useState<ActivityLevel | undefined>()
  const [diet, setDiet] = useState<DietaryStyle | undefined>()
  const [equipment, setEquipment] = useState<string[]>([])

  useEffect(() => {
    getProfile()
      .then((p) => {
        setProfile(p)
        setCurrentWeight(p.current_weight_kg?.toString() ?? '')
        setTargetWeight(p.target_weight_kg?.toString() ?? '')
        setHeight(p.height_cm?.toString() ?? '')
        setGoal(p.primary_goal)
        setActivity(p.activity_level)
        setDiet(p.dietary_style)
        setEquipment(p.equipment ?? [])
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [])

  const toggleEquipment = (item: string) => {
    if (item === 'None') {
      setEquipment((prev) => (prev.includes('None') ? [] : ['None']))
      return
    }
    setEquipment((prev) => {
      const without = prev.filter((e) => e !== 'None')
      return without.includes(item)
        ? without.filter((e) => e !== item)
        : [...without, item]
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const data: Partial<Profile> = {
        current_weight_kg: currentWeight ? Number(currentWeight) : undefined,
        target_weight_kg: targetWeight ? Number(targetWeight) : undefined,
        height_cm: height ? Number(height) : undefined,
        primary_goal: goal,
        activity_level: activity,
        dietary_style: diet,
        equipment,
      }
      const updated = await updateProfile(data)
      setProfile(updated)
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  if (!profile) {
    return <p className="text-text-secondary text-sm">Unable to load profile.</p>
  }

  return (
    <div className="space-y-4">
      {/* Measurements */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary mb-3">
          Measurements
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-text-secondary text-xs mb-1">Weight (kg)</Label>
            <Input
              type="number"
              value={currentWeight}
              onChange={(e) => setCurrentWeight(e.target.value)}
              placeholder="75"
            />
          </div>
          <div>
            <Label className="text-text-secondary text-xs mb-1">Target (kg)</Label>
            <Input
              type="number"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              placeholder="70"
            />
          </div>
        </div>
        <div className="mt-3">
          <Label className="text-text-secondary text-xs mb-1">Height (cm)</Label>
          <Input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="175"
          />
        </div>
      </div>

      {/* Primary Goal */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary mb-3">
          Primary Goal
        </p>
        <div className="grid grid-cols-2 gap-2">
          {GOAL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setGoal(opt.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                goal === opt.value
                  ? 'bg-accent border-accent text-white'
                  : 'bg-background border-border text-text-primary hover:bg-surface-hover'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Level */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary mb-3">
          Activity Level
        </p>
        <div className="grid grid-cols-2 gap-2">
          {ACTIVITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setActivity(opt.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                activity === opt.value
                  ? 'bg-accent border-accent text-white'
                  : 'bg-background border-border text-text-primary hover:bg-surface-hover'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dietary Style */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary mb-3">
          Dietary Style
        </p>
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDiet(opt.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                diet === opt.value
                  ? 'bg-accent border-accent text-white'
                  : 'bg-background border-border text-text-primary hover:bg-surface-hover'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary mb-3">
          Equipment
        </p>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_OPTIONS.map((item) => {
            const isActive = equipment.includes(item)
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggleEquipment(item)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                  isActive
                    ? 'bg-accent border-accent text-white'
                    : 'bg-background border-border text-text-primary hover:bg-surface-hover'
                )}
              >
                {item}
              </button>
            )
          })}
        </div>
      </div>

      {/* Injuries */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary mb-3">
          Injuries
        </p>
        {profile.injuries && profile.injuries.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-3">
            {profile.injuries.map((injury) => (
              <span
                key={injury}
                className="px-3 py-1.5 rounded-full text-sm font-medium bg-surface-hover border border-border text-text-primary"
              >
                {injury}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-secondary mb-3">No injuries recorded</p>
        )}
        <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Chat with Geo to update</span>
        </div>
      </div>

      {/* Save Button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-accent to-accent-hover py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {saving ? 'Saving...' : 'Save changes'}
      </button>
    </div>
  )
}
