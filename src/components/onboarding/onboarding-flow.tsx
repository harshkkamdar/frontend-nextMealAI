'use client'

import { useState, type CSSProperties } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { OnboardingStep } from '@/components/onboarding/onboarding-step'
import { ChipInput } from '@/components/ui/fiqr/chip-input'
import { OptionList, type Option } from '@/components/ui/fiqr/option-list'
import { CM, FT_IN, KG, LB, RulerInput } from '@/components/ui/fiqr/ruler-input'
import { WheelBand, WheelPicker } from '@/components/ui/fiqr/wheel-picker'
import { WeightPath } from '@/components/onboarding/weight-path'
import { questionScene } from '@/components/onboarding/aurora'
import { depthTo } from '@/components/onboarding/depth-nav'
import { submitFitnessOnboarding, submitNutritionOnboarding, submitPersonalOnboarding } from '@/lib/api/profile.api'
import { haptic } from '@/lib/platform/app'
import { ageOn, nextInModule, previousRoute, progressOf, routeOf, STEPS, stepsFor, visibleSteps, type OnboardingModule, type StepId } from '@/lib/onboarding-steps'
import { useOnboardingDraft, type OnboardingDraft } from '@/stores/onboarding-draft.store'
import { cn } from '@/lib/utils'
import type { ActivityLevel, DietaryStyle, ExperienceLevel, PrimaryGoal, Sex } from '@/types/profile.types'

const SEX: Option<Sex>[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
]
const GOALS: Option<PrimaryGoal>[] = [
  { value: 'fat_loss', label: 'Lose fat', hint: 'Eat a little under what you burn' },
  { value: 'muscle_gain', label: 'Build muscle', hint: 'Eat a little over it and lift' },
  { value: 'body_recomposition', label: 'Both, slowly', hint: 'Lose fat and build muscle at the same time' },
  { value: 'maintenance', label: 'Stay where I am', hint: 'Keep weight steady, eat and train well' },
]
const ACTIVITY: Option<ActivityLevel>[] = [
  { value: 'sedentary', label: 'Mostly sitting', hint: 'Desk job, little walking' },
  { value: 'light', label: 'Lightly active', hint: 'On your feet some of the day' },
  { value: 'moderate', label: 'Moderately active', hint: 'Walking or standing a lot' },
  { value: 'active', label: 'Active', hint: 'Physical job or long daily walks' },
  { value: 'very_active', label: 'Very active', hint: 'Hard physical work every day' },
]
const EXPERIENCE: Option<ExperienceLevel>[] = [
  { value: 'beginner', label: 'New to it', hint: 'Under a year of regular training' },
  { value: 'intermediate', label: 'Some experience', hint: 'One to three years' },
  { value: 'advanced', label: 'Experienced', hint: 'Three years or more' },
]
const EQUIPMENT: Option<string>[] = [
  ...['Dumbbells', 'Barbell', 'Bench', 'Pull-up bar', 'Kettlebell', 'Resistance bands', 'Cable machine'].map((v) => ({ value: v, label: v })),
  { value: 'None', label: 'Just my body', hint: 'No equipment' },
]
const ALLERGIES: Option<string>[] = [
  ...['Dairy', 'Gluten', 'Nuts', 'Eggs', 'Soy', 'Shellfish'].map((v) => ({ value: v, label: v })),
  { value: 'None', label: 'No allergies' },
]
const DIETS: Option<DietaryStyle>[] = [
  { value: 'omnivore', label: 'I eat everything' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'pescatarian', label: 'Pescatarian' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
]

function NumberCells({ label, values, value, onChange }: { label: string; values: number[]; value: number | null; onChange: (n: number) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${values.length > 5 ? 4 : values.length}, minmax(0, 1fr))` }}>
      {values.map((n, i) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          onClick={() => { void haptic('light'); onChange(n) }}
          style={{ '--i': i + 2 } as CSSProperties}
          className={cn('rise font-wide h-16 rounded-[var(--radius-row)] text-[24px] font-bold tabular-nums transition-[background-color,color,transform] duration-200 active:scale-[.94] active:duration-75', value === n ? 'bg-ink text-cream' : 'bg-card text-ink outline outline-1 -outline-offset-1 outline-ink-08')}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

/** Single choice as wrapping chips (mocks/aurora-onboarding.html, How do you eat?). Selected = ink fill, never orange. */
function ChoiceChips<T extends string>({ label, options, value, onChange }: { label: string; options: Option<T>[]; value: T | null; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => { void haptic('light'); onChange(o.value) }}
          style={{ '--i': i + 2 } as CSSProperties}
          className={cn('rise h-chip rounded-full px-[18px] text-body-sm font-semibold transition-[background-color,color,transform] duration-200 active:scale-[.96] active:duration-75', value === o.value ? 'bg-ink text-cream' : 'glass text-ink')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const pad = (n: number) => String(n).padStart(2, '0')

/** Month, day and year wheels. Shows a starting date but saves nothing until a wheel moves. */
function DateWheels({ value, onChange, minYear, maxYear }: { value: string; onChange: (iso: string) => void; minYear: number; maxYear: number }) {
  const [y, m, d] = value ? value.split('-').map(Number) : [maxYear - 17, 1, 1]
  const days = new Date(y, m, 0).getDate()
  const emit = (year: number, month: number, day: number) => onChange(`${year}-${pad(month)}-${pad(Math.min(day, new Date(year, month, 0).getDate()))}`)
  return (
    <div className="relative grid grid-cols-[1.5fr_.8fr_1fr] gap-1">
      <WheelBand />
      <WheelPicker label="Month" items={MONTHS.map((name, i) => ({ value: i + 1, label: name }))} value={m} onChange={(month) => emit(y, month, d)} />
      <WheelPicker label="Day" items={Array.from({ length: days }, (_, i) => ({ value: i + 1, label: String(i + 1) }))} value={Math.min(d, days)} onChange={(day) => emit(y, m, day)} />
      <WheelPicker label="Year" items={Array.from({ length: maxYear - minYear + 1 }, (_, i) => ({ value: minYear + i, label: String(minYear + i) }))} value={y} onChange={(year) => emit(year, m, d)} />
    </div>
  )
}

const MODULES: OnboardingModule[] = ['personal', 'fitness', 'nutrition']

/** Fill of the three section bars on step `id`: sections before it full, its own section up to and including it, later ones empty. */
export function segmentsOf(id: StepId, goal: PrimaryGoal | null): number[] {
  const current = STEPS.find((s) => s.id === id)!.module
  return MODULES.map((m, k) => {
    const at = MODULES.indexOf(current)
    if (k !== at) return k < at ? 1 : 0
    const steps = stepsFor(m, goal)
    return (steps.findIndex((s) => s.id === id) + 1) / steps.length
  })
}

function weeksAt(deltaKg: number, perWeek: number) {
  return Math.max(1, Math.round(Math.abs(deltaKg) / perWeek))
}

export function OnboardingFlow({ module }: { module: OnboardingModule }) {
  const router = useRouter()
  const params = useSearchParams()
  const draft = useOnboardingDraft()
  const [busy, setBusy] = useState(false)

  const moduleSteps = stepsFor(module, draft.goal)
  const requested = params.get('q') as StepId | null
  const id: StepId = requested && moduleSteps.some((s) => s.id === requested) ? requested : moduleSteps[0].id
  const back = previousRoute(id, draft.goal)
  const set = (patch: Partial<OnboardingDraft>) => draft.set(patch)
  /** Single-choice screens move on by themselves after the selection has shown (redesign slice 1, tap budget). */
  const pick = (patch: Partial<OnboardingDraft>) => { draft.set(patch); window.setTimeout(() => { void next() }, 280) }

  async function submitModule() {
    const draft = useOnboardingDraft.getState()
    if (module === 'personal') {
      await submitPersonalOnboarding({ name: draft.name.trim(), dob: draft.dob, sex: draft.sex!, height_cm: draft.heightCm! })
    } else if (module === 'fitness') {
      await submitFitnessOnboarding({
        equipment: draft.equipment,
        injuries: draft.injuries,
        ...(draft.experience ? { experience_level: draft.experience } : {}),
        activity_level: draft.activity!,
        workout_frequency: draft.frequency!,
        primary_goal: draft.goal!,
      })
    } else {
      await submitNutritionOnboarding({
        allergies: draft.allergies,
        dietary_style: draft.diet ?? undefined,
        dislikes: draft.dislikes.length ? draft.dislikes : undefined,
        cuisines: draft.cuisines.length ? draft.cuisines : undefined,
        meals_per_day: draft.meals ?? undefined,
        weight_kg: draft.weightKg ?? undefined,
        target_weight_kg: draft.goal === 'maintenance' ? draft.weightKg ?? undefined : draft.targetKg ?? undefined,
      })
    }
  }

  async function next() {
    const draft = useOnboardingDraft.getState()
    const following = nextInModule(id, draft.goal)
    if (following) return router.push(routeOf(following))
    setBusy(true)
    try {
      await submitModule()
      void haptic('success')
      if (module === 'nutrition') {
        draft.reset()
        depthTo(() => router.push('/onboarding/consent'))
      } else {
        const firstOfNext = visibleSteps(draft.goal).find((s) => s.module === (module === 'personal' ? 'fitness' : 'nutrition'))!
        depthTo(() => router.push(routeOf(firstOfNext.id)))
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "That didn't save. Check your connection and try again.")
    } finally {
      setBusy(false)
    }
  }

  const common = {
    stepKey: id,
    progress: progressOf(id, draft.goal),
    segments: segmentsOf(id, draft.goal),
    scene: questionScene(visibleSteps(draft.goal).findIndex((s) => s.id === id)),
    // Crossing into another module is a route change: step back through it in depth. Within a module only the question moves.
    onBack: back ? () => (back.startsWith(`/onboarding/${module}?`) ? router.push(back) : depthTo(() => router.push(back), -1)) : undefined,
    busy,
    onContinue: next,
  }

  const today = new Date()
  const delta = draft.weightKg !== null && draft.targetKg !== null ? Math.round((draft.targetKg - draft.weightKg) * 10) / 10 : 0

  switch (id) {
    case 'name':
      return (
        <OnboardingStep {...common} question="What should Geo call you?" why="A first name is fine." canContinue={draft.name.trim().length > 0}>
          <input
            aria-label="Your name"
            style={{ '--i': 2 } as CSSProperties}
            autoFocus
            autoComplete="given-name"
            value={draft.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="Your name"
            className="rise h-16 w-full rounded-[var(--radius-row)] bg-card px-5 text-[22px] font-semibold text-ink outline outline-1 -outline-offset-1 outline-ink-08 focus:outline-ink placeholder:font-normal placeholder:text-ink-65"
          />
        </OnboardingStep>
      )
    case 'sex':
      return (
        <OnboardingStep {...common} question="What is your sex?" why="Geo uses it to estimate how many calories you burn." canContinue={draft.sex !== null}>
          <OptionList label="Sex" options={SEX} value={draft.sex} onChange={(sex) => pick({ sex })} />
        </OnboardingStep>
      )
    case 'dob': {
      const age = draft.dob ? ageOn(draft.dob, today) : null
      return (
        <OnboardingStep {...common} question="When were you born?" why="Age changes how much you burn at rest." canContinue={age !== null && age >= 13 && age <= 100}>
          <div className="rise" style={{ '--i': 2 } as CSSProperties}>
            <DateWheels value={draft.dob} onChange={(dob) => set({ dob })} minYear={1926} maxYear={today.getFullYear() - 13} />
            <p aria-live="polite" className="mt-4 text-center text-[15px] font-medium text-ink-65">
              {age !== null && age >= 13 && age <= 100 ? `${age} years old` : 'Scroll to your birthday'}
            </p>
          </div>
        </OnboardingStep>
      )
    }
    case 'height':
      return (
        <OnboardingStep {...common} question="How tall are you?" why="Height and weight set your daily calories." canContinue={draft.heightCm !== null && draft.heightCm >= 100 && draft.heightCm <= 250}>
          <div className="rise" style={{ '--i': 2 } as CSSProperties}><RulerInput label="Height" value={draft.heightCm} onChange={(heightCm) => set({ heightCm })} min={100} max={250} start={170} units={[CM, FT_IN]} /></div>
        </OnboardingStep>
      )
    case 'goal':
      return (
        <OnboardingStep {...common} question="What is your main goal?" why="Geo sets your calories and training from this. You can change it later." canContinue={draft.goal !== null}>
          <OptionList label="Main goal" options={GOALS} value={draft.goal} onChange={(goal) => pick({ goal })} />
        </OnboardingStep>
      )
    case 'activity':
      return (
        <OnboardingStep {...common} question="How active are you outside workouts?" canContinue={draft.activity !== null}>
          <OptionList label="Daily activity" options={ACTIVITY} value={draft.activity} onChange={(activity) => pick({ activity })} />
        </OnboardingStep>
      )
    case 'frequency':
      return (
        <OnboardingStep {...common} question="How many days a week can you train?" why="Geo builds your program around this." canContinue={draft.frequency !== null}>
          <NumberCells label="Training days per week" values={[1, 2, 3, 4, 5, 6, 7]} value={draft.frequency} onChange={(frequency) => pick({ frequency })} />
        </OnboardingStep>
      )
    case 'experience':
      return (
        <OnboardingStep {...common} question="How long have you been training?" canContinue={draft.experience !== null} secondary={{ label: 'Skip', onClick: () => { set({ experience: null }); void next() } }}>
          <OptionList label="Training experience" options={EXPERIENCE} value={draft.experience} onChange={(experience) => pick({ experience })} />
        </OnboardingStep>
      )
    case 'equipment':
      return (
        <OnboardingStep {...common} question="What can you train with?" why="Pick everything you have access to." canContinue={draft.equipment.length > 0}>
          <OptionList multi exclusive="None" label="Equipment" options={EQUIPMENT} value={draft.equipment} onChange={(equipment) => set({ equipment })} />
        </OnboardingStep>
      )
    case 'injuries':
      return (
        <OnboardingStep {...common} question="Anything Geo should work around?" why="Injuries or pain. Geo leaves out exercises that load them." canContinue cta={draft.injuries.length ? 'Continue' : 'Nothing to work around'}>
          <div className="rise" style={{ '--i': 2 } as CSSProperties}><ChipInput label="Injuries" placeholder="e.g. lower back" value={draft.injuries} onChange={(injuries) => set({ injuries })} suggestions={['Lower back', 'Knee', 'Shoulder', 'Wrist']} /></div>
        </OnboardingStep>
      )
    case 'weight':
      return (
        <OnboardingStep {...common} question="What do you weigh today?" why="Geo uses this to set your daily calories." canContinue={draft.weightKg !== null && draft.weightKg >= 30 && draft.weightKg <= 250}>
          <div className="rise" style={{ '--i': 2 } as CSSProperties}><RulerInput label="Weight" value={draft.weightKg} onChange={(weightKg) => set({ weightKg })} min={30} max={250} start={75} units={[KG, LB]} /></div>
        </OnboardingStep>
      )
    case 'target':
      return (
        <OnboardingStep {...common} question="What weight are you aiming for?" why={draft.weightKg ? `You are at ${draft.weightKg.toFixed(1)} kg today.` : undefined} canContinue={draft.targetKg !== null && draft.targetKg >= 30 && draft.targetKg <= 250}>
          <div className="rise" style={{ '--i': 2 } as CSSProperties}><RulerInput label="Target weight" value={draft.targetKg} onChange={(targetKg) => set({ targetKg })} min={30} max={250} start={draft.weightKg ?? 75} units={[KG, LB]} /></div>
          {draft.targetKg !== null && delta !== 0 ? (
            <p className="mt-2 text-center text-[16px] font-semibold text-ink tabular-nums">{Math.abs(delta).toFixed(1)} kg to {delta < 0 ? 'lose' : 'gain'}</p>
          ) : null}
        </OnboardingStep>
      )
    case 'reflection': {
      const losing = delta < 0
      const weeks = delta === 0 ? null : weeksAt(delta, losing ? 0.5 : 0.25)
      const headline = delta === 0
        ? 'Holding steady is a plan too.'
        : `${Math.abs(delta).toFixed(1)} kg is about ${weeks} weeks at a steady pace.`
      const body = losing
        ? 'A steady half a kilo a week is easier to stick with. Geo sets your calories for it and adjusts them at every weekly check-in.'
        : delta > 0
          ? 'A slow, steady gain is easier to keep lean. Geo sets your calories for it and adjusts them at every weekly check-in.'
          : 'Geo sets calories to hold your weight and adjusts them at every weekly check-in.'
      return (
        <OnboardingStep {...common} question={headline} why={body} canContinue cta="Sounds right">
          {draft.weightKg !== null ? (
            <div className="rise mb-3" style={{ '--i': 2 } as CSSProperties}>
              <WeightPath fromKg={draft.weightKg} toKg={draft.goal === 'maintenance' || draft.targetKg === null ? draft.weightKg : draft.targetKg} weeks={weeks} />
            </div>
          ) : null}
          <div className="rise flex items-center gap-3 rounded-[var(--radius-card)] bg-card p-4 outline outline-1 -outline-offset-1 outline-ink-08" style={{ '--i': 3 } as CSSProperties}>
            <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-[14px] font-bold text-cream">G</span>
            <p className="text-[15.5px] leading-[1.45] text-ink">
              {draft.name ? `${draft.name.trim()}, the` : 'The'} rest is about food: allergies, how you eat and what you enjoy.
            </p>
          </div>
        </OnboardingStep>
      )
    }
    case 'allergies':
      return (
        <OnboardingStep {...common} question="Any food allergies?" why="Geo never suggests or logs these for you." canContinue={draft.allergies.length > 0}>
          <OptionList multi exclusive="None" label="Allergies" options={ALLERGIES} value={draft.allergies} onChange={(allergies) => set({ allergies })} />
        </OnboardingStep>
      )
    case 'diet':
      return (
        <OnboardingStep {...common} question="How do you eat?" canContinue={draft.diet !== null} secondary={{ label: 'Skip', onClick: () => { set({ diet: null }); void next() } }}>
          <ChoiceChips label="Eating style" options={DIETS} value={draft.diet} onChange={(diet) => pick({ diet })} />
        </OnboardingStep>
      )
    case 'dislikes':
      return (
        <OnboardingStep {...common} question="Foods you would rather skip?" why="Geo keeps them out of your nutrition plan." canContinue cta={draft.dislikes.length ? 'Continue' : 'Nothing comes to mind'}>
          <div className="rise" style={{ '--i': 2 } as CSSProperties}><ChipInput label="Foods to skip" placeholder="e.g. mushrooms" value={draft.dislikes} onChange={(dislikes) => set({ dislikes })} suggestions={['Mushrooms', 'Olives', 'Coriander', 'Fish', 'Eggplant']} /></div>
        </OnboardingStep>
      )
    case 'cuisines':
      return (
        <OnboardingStep {...common} question="What do you like to eat?" why="Cuisines Geo should lean on." canContinue cta={draft.cuisines.length ? 'Continue' : 'Anything goes'}>
          <div className="rise" style={{ '--i': 2 } as CSSProperties}><ChipInput label="Cuisines" placeholder="e.g. Thai" value={draft.cuisines} onChange={(cuisines) => set({ cuisines })} suggestions={['Indian', 'Italian', 'Mexican', 'Japanese', 'Chinese', 'Mediterranean', 'Thai']} /></div>
        </OnboardingStep>
      )
    case 'meals':
      return (
        <OnboardingStep {...common} question="How many meals a day suit you?" why="Snacks count as meals." canContinue={draft.meals !== null} cta="Finish">
          <NumberCells label="Meals per day" values={[2, 3, 4, 5, 6]} value={draft.meals} onChange={(meals) => set({ meals })} />
        </OnboardingStep>
      )
  }
}

/** All step ids, exported for tests and captures. */
export const ONBOARDING_STEP_IDS = STEPS.map((s) => s.id)
