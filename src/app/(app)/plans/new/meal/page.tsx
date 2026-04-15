'use client'

import { PageWrapper } from '@/components/layout/page-wrapper'
import { MealPlanBuilder } from '@/components/plans/meal-plan-builder'

export default function NewMealPlanPage() {
  return (
    <PageWrapper>
      <MealPlanBuilder mode="create" />
    </PageWrapper>
  )
}
