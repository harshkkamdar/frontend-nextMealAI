interface StepIndicatorProps {
  currentStep: 1 | 2 | 3
}

const steps = [
  { number: 1, label: 'Personal' },
  { number: 2, label: 'Fitness' },
  { number: 3, label: 'Nutrition' },
]

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 px-4 py-6">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          {/* Step circle */}
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                step.number <= currentStep
                  ? 'bg-brand text-white'
                  : 'bg-bg-secondary text-muted-foreground border border-border'
              }`}
            >
              {step.number < currentStep ? '✓' : step.number}
            </div>
            <span
              className={`text-xs ${
                step.number <= currentStep ? 'text-brand' : 'text-muted-foreground'
              }`}
            >
              {step.label}
            </span>
          </div>
          {/* Connecting line (not after last step) */}
          {index < steps.length - 1 && (
            <div
              className={`h-0.5 w-16 mx-2 mb-5 transition-colors ${
                step.number < currentStep ? 'bg-brand' : 'bg-border'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}
