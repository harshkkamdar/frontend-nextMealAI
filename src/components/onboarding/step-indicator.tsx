'use client'

import { cn } from '@/lib/utils'

export function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 | 4 }) {
  const steps = [1, 2, 3, 4] as const

  return (
    <div className="mb-6 flex items-center justify-center gap-[6px]">
      {steps.map((step) => (
        <div
          key={step}
          className={cn(
            'size-[7px] rounded-full',
            step <= currentStep ? 'bg-ink' : 'bg-ink-16'
          )}
        />
      ))}
    </div>
  )
}
