'use client'

import { use } from 'react'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { FoodLogForm } from '@/components/logs/food-log-form'
import { WorkoutLogForm } from '@/components/logs/workout-log-form'
import { WaterLogForm } from '@/components/logs/water-log-form'
import { WeightLogForm } from '@/components/logs/weight-log-form'
import { MoodLogForm } from '@/components/logs/mood-log-form'
import { SleepLogForm } from '@/components/logs/sleep-log-form'
import { EnergyLogForm } from '@/components/logs/energy-log-form'

const FORMS: Record<string, React.ComponentType> = {
  food: FoodLogForm,
  workout: WorkoutLogForm,
  water: WaterLogForm,
  weight: WeightLogForm,
  mood: MoodLogForm,
  sleep: SleepLogForm,
  energy: EnergyLogForm,
}

export default function NewLogPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = use(params)
  const FormComponent = FORMS[type]

  if (!FormComponent) {
    return <PageWrapper><p className="text-text-secondary">Unknown log type</p></PageWrapper>
  }

  return (
    <PageWrapper>
      <FormComponent />
    </PageWrapper>
  )
}
