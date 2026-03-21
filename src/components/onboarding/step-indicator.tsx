'use client'

import { cn } from '@/lib/utils'

export function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  const steps = [1, 2, 3] as const

  return (
    <div className="mb-6 flex items-center justify-center gap-2">
      {steps.map((step) => (
        <div
          key={step}
          className={cn(
            'h-2.5 w-2.5 rounded-full transition-colors',
            step < currentStep && 'bg-accent',
            step === currentStep && 'bg-accent',
            step > currentStep && 'border border-border bg-surface'
          )}
        />
      ))}
    </div>
  )
}
