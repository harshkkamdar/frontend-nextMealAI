import { StepIndicator } from '@/components/onboarding/step-indicator'
import { FitnessForm } from '@/components/onboarding/fitness-form'

export default function FitnessPage() {
  return (
    <>
      <StepIndicator currentStep={2} />
      <FitnessForm />
    </>
  )
}
