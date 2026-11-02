import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { OnboardingStep } from '../onboarding-step'

describe('OnboardingStep', () => {
  it('starts progress at the gutter when there is no back button', () => {
    render(
      <OnboardingStep stepKey="consent" progress={1} question="Before Geo starts" canContinue onContinue={vi.fn()}>
        Consent
      </OnboardingStep>,
    )

    const progress = screen.getByRole('progressbar')
    expect(progress.closest('[data-chrome]')?.firstElementChild).toBe(progress)
  })
})
