import { StepIndicator } from '@/components/onboarding/step-indicator'
import { PersonalForm } from '@/components/onboarding/personal-form'

export default function PersonalPage() {
  return (
    <>
      <StepIndicator currentStep={1} />
      <PersonalForm />
    </>
  )
}
