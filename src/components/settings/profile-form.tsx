'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getProfile, updateProfile } from '@/lib/api/profile.api'
import { Chip } from '@/components/ui/fiqr/chip'
import { ErrorState } from '@/components/ui/fiqr/error-state'
import { PushedHeader } from '@/components/layout/screen-header'
import { OfflineBand } from '@/components/shared/offline-band'
import { SettingsRow, SettingsSection, SettingsSkeleton } from '@/components/settings/settings-section'
import { toast } from 'sonner'
import { computeAgeFromDob, computeDailyTargets } from '@/lib/tdee'
import type { Profile, PrimaryGoal, ActivityLevel, DietaryStyle } from '@/types/profile.types'

const GOAL_OPTIONS: { value: PrimaryGoal; label: string }[] = [
  { value: 'fat_loss', label: 'Fat loss' },
  { value: 'muscle_gain', label: 'Muscle gain' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'body_recomposition', label: 'Recomposition' },
  { value: 'improve_health', label: 'Improve health' },
  { value: 'athletic_performance', label: 'Performance' },
]

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Very active' },
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

export function ProfileForm({ onBack }: { onBack: () => void }) {
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
      toast.success('Saved')
    } catch {
      toast.error("Couldn't save your profile. Try again.")
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
      toast.success('Back to the suggested targets')
    } catch {
      toast.error("Couldn't reset your targets. Try again.")
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

  // Save lives in the bar as a glass pill (iOS idiom), so nothing sits over the form and covers its controls.
  const header = (
    <>
      <PushedHeader
        title="Profile"
        onBack={onBack}
        backLabel="Back to settings"
        // Always rendered (disabled until the profile loads), so the bar never changes shape mid-transition.
        actions={(
          <button type="button" onClick={handleSave} disabled={saving || !profile} className="glass h-11 rounded-full px-4 text-[16px] font-semibold text-ink transition-transform duration-100 enabled:active:scale-[.94] disabled:text-ink-65">
            {saving ? 'Saving…' : 'Save'}
          </button>
        )}
      />
      <div className="-mx-4 mb-4 [&:empty]:hidden"><OfflineBand /></div>
    </>
  )

  if (loading) return <>{header}<SettingsSkeleton groups={[3, 4, 2, 2]} label="Loading your profile" /></>

  if (!profile) {
    return <>{header}<ErrorState onRetry={() => { setLoading(true); load() }}>I couldn&apos;t load your profile. Check your connection and try again.</ErrorState></>
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
    <>
    {header}
    <div className="enter-rows mt-2 flex flex-col gap-7">
      {missingFields.length > 0 ? (
        <div role="status" className="rounded-[24px] bg-card px-4 py-3.5 shadow-[var(--shadow-card)]">
          <p className="text-[16px] font-semibold text-ink">Add your {missingFields.map((f) => f.replace(/_(kg|cm)$/, '').replace(/_/g, ' ')).join(' and ')}</p>
          <p className="mt-0.5 text-[14px] text-ink-65">Geo needs it to work out your daily targets.</p>
        </div>
      ) : null}

      <SettingsSection title="Body">
        <NumberRow id="weight" label="Weight" needed={weightMissing} unit="kg" step="0.1" value={currentWeight} onChange={setCurrentWeight} placeholder="75" />
        <NumberRow id="target-weight" label="Goal weight" unit="kg" step="0.1" value={targetWeight} onChange={setTargetWeight} placeholder="70" />
        <NumberRow id="height" label="Height" needed={heightMissing} unit="cm" step="0.1" value={height} onChange={setHeight} placeholder="175" />
      </SettingsSection>

      <div>
        <SettingsSection
          title="Daily targets"
          footer={previewTargets
            ? <>From your body, goal and activity Geo suggests <b className="font-semibold text-ink tabular-nums">{previewTargets.calories.toLocaleString('en-AU')} kcal</b>. Type a number to set your own.</>
            : 'Add your weight and height and Geo works these out for you.'}
        >
          {targetFields.map((f) => (
            <NumberRow
              key={f.id}
              id={`target-${f.id}`}
              label={f.label}
              unit={f.unit}
              numeric
              value={f.value}
              onChange={(value) => { f.set(value); setTouchedTargets((t) => ({ ...t, [f.id]: true })) }}
              placeholder={f.preview != null ? String(f.preview) : f.saved != null ? String(f.saved) : '—'}
            />
          ))}
        </SettingsSection>
        {hasOverrides ? (
          <button
            type="button"
            onClick={handleResetTargetsToBaseline}
            disabled={resettingTargets}
            className="mt-1 min-h-11 px-4 text-[14px] font-semibold text-ink underline decoration-ink-35 underline-offset-4 disabled:text-ink-65"
          >
            {resettingTargets ? 'Resetting…' : 'Use the suggested targets'}
          </button>
        ) : null}
      </div>

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

      <SettingsSection title="Injuries" footer="Tell Geo about a new injury and it updates this list.">
        {profile.injuries && profile.injuries.length > 0
          ? profile.injuries.map((injury) => <SettingsRow key={injury} label={injury} />)
          : <SettingsRow label={<span className="text-ink-65">None recorded</span>} />}
      </SettingsSection>

    </div>
    </>
  )
}

/** A 44 pt settings row with the number typed right-aligned, iOS style, and its unit after it. */
function NumberRow({ id, label, unit, needed, numeric, step, value, onChange, placeholder }: {
  id: string
  label: string
  unit: string
  needed?: boolean
  numeric?: boolean
  step?: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div className="flex min-h-11 items-center gap-2 pl-4 pr-4 text-[16px] focus-within:bg-ink-04">
      <label htmlFor={id} className="flex shrink-0 items-center gap-2 py-2.5 font-medium text-ink">
        {label}
        {needed ? <span className="rounded-full bg-ink px-2 py-0.5 text-[12px] font-semibold text-cream">Needed</span> : null}
      </label>
      <input
        id={id}
        type="number"
        inputMode={numeric ? 'numeric' : 'decimal'}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 min-w-0 flex-1 bg-transparent text-right text-[16px] font-medium text-ink outline-none tabular-nums placeholder:font-normal placeholder:text-ink-50"
      />
      <span aria-hidden="true" className="w-9 shrink-0 text-[15px] text-ink-65">{unit}</span>
    </div>
  )
}

function ChipGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section role="group" aria-label={label}>
      <h2 className="mb-2 px-4 text-[13px] font-semibold text-ink-65">{label}</h2>
      <div className="flex flex-wrap gap-2 rounded-[24px] bg-card p-3 shadow-[var(--shadow-card)]">{children}</div>
    </section>
  )
}
