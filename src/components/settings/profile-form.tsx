'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getProfile, updateProfile } from '@/lib/api/profile.api'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { Chip } from '@/components/ui/fiqr/chip'
import { ErrorState } from '@/components/ui/fiqr/error-state'
import { fieldClass } from '@/components/ui/fiqr/field'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { SectionLabel } from '@/components/ui/fiqr/section-label'
import { toast } from 'sonner'
import { computeAgeFromDob, computeDailyTargets } from '@/lib/tdee'
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

// Backend onboarding uses lightly_active/moderately_active; profile update uses light/moderate/active
function normalizeActivityLevel(level?: ActivityLevel): ActivityLevel | undefined {
  if (level === 'lightly_active') return 'light'
  if (level === 'moderately_active') return 'moderate'
  return level
}

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
  // Daily target overrides — only sent on save if user touched the input
  // (touchedTargets[field] = true). Untouched fields are omitted from the
  // PUT body so the backend recomputes them from TDEE on every save.
  const [dailyCalories, setDailyCalories] = useState('')
  const [dailyProtein, setDailyProtein] = useState('')
  const [dailyCarbs, setDailyCarbs] = useState('')
  const [dailyFat, setDailyFat] = useState('')
  const [touchedTargets, setTouchedTargets] = useState({
    calories: false,
    protein: false,
    carbs: false,
    fat: false,
  })
  const [resettingTargets, setResettingTargets] = useState(false)

  const load = useCallback(() => {
    getProfile()
      .then((p) => {
        setProfile(p)
        setCurrentWeight(p.current_weight_kg?.toString() ?? '')
        setTargetWeight(p.target_weight_kg?.toString() ?? '')
        setHeight(p.height_cm?.toString() ?? '')
        setGoal(p.primary_goal)
        setActivity(normalizeActivityLevel(p.activity_level))
        setDiet(p.dietary_style)
        setEquipment(p.equipment ?? [])
        setDailyCalories(p.daily_calorie_target?.toString() ?? '')
        setDailyProtein(p.daily_protein_g?.toString() ?? '')
        setDailyCarbs(p.daily_carbs_g?.toString() ?? '')
        setDailyFat(p.daily_fat_g?.toString() ?? '')
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

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

      // Only include daily_* targets the user actually touched. Untouched
      // fields are omitted so the backend recomputes them from TDEE every
      // save (so changing goal/weight propagates without you having to
      // re-type any Daily Targets values).
      if (touchedTargets.calories) {
        data.daily_calorie_target = dailyCalories.trim() === '' ? null : Number(dailyCalories)
      }
      if (touchedTargets.protein) {
        data.daily_protein_g = dailyProtein.trim() === '' ? null : Number(dailyProtein)
      }
      if (touchedTargets.carbs) {
        data.daily_carbs_g = dailyCarbs.trim() === '' ? null : Number(dailyCarbs)
      }
      if (touchedTargets.fat) {
        data.daily_fat_g = dailyFat.trim() === '' ? null : Number(dailyFat)
      }

      await updateProfile(data)
      // Re-fetch so inputs reflect the backend's recomputed values.
      const fresh = await getProfile()
      setProfile(fresh)
      setDailyCalories(fresh.daily_calorie_target?.toString() ?? '')
      setDailyProtein(fresh.daily_protein_g?.toString() ?? '')
      setDailyCarbs(fresh.daily_carbs_g?.toString() ?? '')
      setDailyFat(fresh.daily_fat_g?.toString() ?? '')
      setTouchedTargets({ calories: false, protein: false, carbs: false, fat: false })
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleResetTargetsToBaseline = async () => {
    setResettingTargets(true)
    try {
      await updateProfile({
        daily_calorie_target: null,
        daily_protein_g: null,
        daily_carbs_g: null,
        daily_fat_g: null,
      })
      const fresh = await getProfile()
      setProfile(fresh)
      setDailyCalories(fresh.daily_calorie_target?.toString() ?? '')
      setDailyProtein(fresh.daily_protein_g?.toString() ?? '')
      setDailyCarbs(fresh.daily_carbs_g?.toString() ?? '')
      setDailyFat(fresh.daily_fat_g?.toString() ?? '')
      toast.success('Reset to TDEE baseline')
    } catch {
      toast.error('Failed to reset targets')
    } finally {
      setResettingTargets(false)
    }
  }

  // Live preview — recompute the projected daily targets as the user changes
  // weight / height / goal / activity, BEFORE they hit Save. The placeholders
  // and the "preview" line below show these so users can see their goal
  // change instantly. The backend stays authoritative on save.
  // Note: must be called BEFORE any conditional return below to satisfy
  // React's Rules of Hooks.
  const previewTargets = useMemo(() => {
    return computeDailyTargets({
      weightKg: currentWeight ? Number(currentWeight) : null,
      heightCm: height ? Number(height) : null,
      ageYears: computeAgeFromDob(profile?.dob ?? null),
      sex: profile?.sex ?? null,
      activityLevel: activity ?? null,
      primaryGoal: goal ?? null,
      targetWeightKg: targetWeight ? Number(targetWeight) : null,
    })
  }, [currentWeight, height, targetWeight, goal, activity, profile?.dob, profile?.sex])

  if (loading) {
    return (
      <div className="mt-6 space-y-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  if (!profile) {
    return <ErrorState onRetry={() => { setLoading(true); load() }}>I couldn&apos;t load your profile. Check your connection and try again.</ErrorState>
  }

  // FB-tdee-baseline UX — surface the specific fields the user needs to
  // fill before TDEE can compute, so the form input doesn't look "set" via
  // a placeholder when it's actually empty.
  const missingFields = profile.daily_targets_missing_fields ?? []
  const heightMissing = missingFields.includes('height_cm')
  const weightMissing = missingFields.includes('current_weight_kg')
  const hasOverrides = profile.daily_calorie_target != null
    || profile.daily_protein_g != null
    || profile.daily_carbs_g != null
    || profile.daily_fat_g != null

  const targetFields = [
    { id: 'calories', label: 'Calories', unit: 'kcal', value: dailyCalories, set: setDailyCalories, saved: profile.daily_calorie_target, preview: previewTargets?.calories },
    { id: 'protein', label: 'Protein', unit: 'g', value: dailyProtein, set: setDailyProtein, saved: profile.daily_protein_g, preview: previewTargets?.protein },
    { id: 'carbs', label: 'Carbs', unit: 'g', value: dailyCarbs, set: setDailyCarbs, saved: profile.daily_carbs_g, preview: previewTargets?.carbs },
    { id: 'fat', label: 'Fat', unit: 'g', value: dailyFat, set: setDailyFat, saved: profile.daily_fat_g, preview: previewTargets?.fat },
  ] as const

  return (
    <div>
      {missingFields.length > 0 && (
        <div role="status" className="mt-5 rounded-[16px] border border-ink-16 bg-card px-[14px] py-[13px]">
          <p className="text-[15.5px] font-semibold text-ink">Add your {missingFields.map((f) => f.replace(/_(kg|cm)$/, '').replace(/_/g, ' ')).join(' and ')}</p>
          <p className="mt-1 text-[13.5px] text-ink-65">FIQR needs them to work out your daily targets.</p>
        </div>
      )}

      <section className="mt-6">
        <SectionLabel>Body</SectionLabel>
        <div className="mt-[13px] grid grid-cols-2 gap-[10px]">
          <Field id="weight" label={weightMissing ? 'Weight · needed' : 'Weight'} unit="kg">
            <input id="weight" type="number" inputMode="decimal" step="0.1" value={currentWeight} onChange={(e) => setCurrentWeight(e.target.value)} placeholder="75" className={`${fieldClass} pr-11 tabular-nums`} />
          </Field>
          <Field id="target-weight" label="Goal weight" unit="kg">
            <input id="target-weight" type="number" inputMode="decimal" step="0.1" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} placeholder="70" className={`${fieldClass} pr-11 tabular-nums`} />
          </Field>
          <Field id="height" label={heightMissing ? 'Height · needed' : 'Height'} unit="cm">
            <input id="height" type="number" inputMode="decimal" step="0.1" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="175" className={`${fieldClass} pr-11 tabular-nums`} />
          </Field>
        </div>
      </section>

      <section className="mt-7">
        <SectionLabel>Daily targets</SectionLabel>
        <p className="mt-2 text-[13.5px] leading-[1.45] text-ink-65">
          {previewTargets
            ? <>From your body, goal and activity FIQR suggests <b className="font-semibold text-ink tabular-nums">{previewTargets.calories.toLocaleString('en-AU')} kcal</b>. Type a number to set your own.</>
            : 'Add your weight and height and FIQR works these out for you.'}
        </p>
        <div className="mt-[13px] grid grid-cols-2 gap-[10px]">
          {targetFields.map((f) => (
            <Field key={f.id} id={`target-${f.id}`} label={f.label} unit={f.unit}>
              <input
                id={`target-${f.id}`}
                type="number"
                inputMode="numeric"
                value={f.value}
                onChange={(e) => { f.set(e.target.value); setTouchedTargets((t) => ({ ...t, [f.id]: true })) }}
                placeholder={f.preview != null ? String(f.preview) : f.saved != null ? String(f.saved) : '—'}
                className={`${fieldClass} pr-14 tabular-nums`}
              />
            </Field>
          ))}
        </div>
        {hasOverrides && (
          <button
            type="button"
            onClick={handleResetTargetsToBaseline}
            disabled={resettingTargets}
            className="mt-1 min-h-11 text-[13.5px] font-semibold text-ink underline decoration-ink-35 underline-offset-4 disabled:text-ink-35"
          >
            {resettingTargets ? 'Resetting…' : 'Use the suggested targets'}
          </button>
        )}
      </section>

      <ChipGroup label="Goal">
        {GOAL_OPTIONS.map((opt) => (
          <Chip key={opt.value} selected={goal === opt.value} onClick={() => setGoal(opt.value)}>{opt.label}</Chip>
        ))}
      </ChipGroup>

      <ChipGroup label="Activity">
        {ACTIVITY_OPTIONS.map((opt) => (
          <Chip key={opt.value} selected={activity === opt.value} onClick={() => setActivity(opt.value)}>{opt.label}</Chip>
        ))}
      </ChipGroup>

      <ChipGroup label="Eating style">
        {DIETARY_OPTIONS.map((opt) => (
          <Chip key={opt.value} selected={diet === opt.value} onClick={() => setDiet(opt.value)}>{opt.label}</Chip>
        ))}
      </ChipGroup>

      <ChipGroup label="Equipment">
        {EQUIPMENT_OPTIONS.map((item) => (
          <Chip key={item} selected={equipment.includes(item)} onClick={() => toggleEquipment(item)}>{item}</Chip>
        ))}
      </ChipGroup>

      <section className="mt-7">
        <SectionLabel>Injuries</SectionLabel>
        <div className="mt-[13px] rounded-[16px] border border-ink-12 bg-card px-[14px] py-[13px]">
          {profile.injuries && profile.injuries.length > 0 ? (
            <ul className="space-y-1">
              {profile.injuries.map((injury) => <li key={injury} className="text-[15.5px] font-semibold text-ink">{injury}</li>)}
            </ul>
          ) : (
            <p className="text-[15.5px] font-semibold text-ink">None recorded</p>
          )}
          <p className="mt-1 text-[13.5px] text-ink-65">Tell Geo about a new injury and it updates this list.</p>
        </div>
      </section>

      {/* Cream band runs under the nav's top edge so content never shows between the button and the nav. */}
      <div className="sticky z-10 mt-7 bg-cream pb-7 pt-3" style={{ bottom: 'calc(68px + var(--safe-bottom))' }}>
        <PrimaryButton type="button" onClick={handleSave} disabled={saving} className="justify-center">
          {saving ? 'Saving…' : 'Save changes'}
        </PrimaryButton>
      </div>
    </div>
  )
}

function Field({ id, label, unit, children }: { id: string; label: string; unit?: string; children: ReactNode }) {
  return (
    <div>
      <SectionLabel><label htmlFor={id}>{label}</label></SectionLabel>
      <div className="relative mt-2">
        {children}
        {unit ? <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[13.5px] font-medium text-ink-65">{unit}</span> : null}
      </div>
    </div>
  )
}

function ChipGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="mt-7" role="group" aria-label={label}>
      <SectionLabel>{label}</SectionLabel>
      <div className="mt-[13px] flex flex-wrap gap-2">{children}</div>
    </section>
  )
}
