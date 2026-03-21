import { StepIndicator } from '@/components/onboarding/step-indicator'
import { NutritionForm } from '@/components/onboarding/nutrition-form'

export default function NutritionPage() {
  return (
    <>
      <StepIndicator currentStep={3} />
      <NutritionForm />
    </>
  )
}
