'use client'

import { PageWrapper } from '@/components/layout/page-wrapper'
import { WorkoutPlanBuilder } from '@/components/plans/workout-plan-builder'

export default function NewWorkoutPlanPage() {
  return (
    <PageWrapper>
      <WorkoutPlanBuilder mode="create" />
    </PageWrapper>
  )
}
