import type { Log, LogsSummary, FoodPayload } from '@/types/logs.types'
import type { MealPlan, WorkoutPlan } from '@/types/plans.types'
import type { Profile } from '@/types/profile.types'

export type NudgeType = 'time_to_eat' | 'workout_today' | 'protein_check' | 'program_complete'

export interface Nudge {
  type: NudgeType
  title: string
  message: string
  cta: string
  action: 'open_companion' | 'start_workout' | 'open_food_search' | 'open_full_chat'
  actionData?: Record<string, unknown>
}

interface NudgeInput {
  todayLogs: Log[]
  summary: LogsSummary | null
  mealPlan: MealPlan | null
  workoutPlan: WorkoutPlan | null
  profile: Profile | null
}

export function computeNudges(input: NudgeInput): Nudge[] {
  const { todayLogs, summary, mealPlan, workoutPlan, profile } = input
  const nudges: Nudge[] = []
  const now = new Date()
  const hour = now.getHours()

  // --- "Time to Eat" ---
  // Last food log > 3 hours ago AND remaining calories > 400
  const foodLogs = todayLogs.filter((l) => l.type === 'food')
  const lastFoodLog = foodLogs.length > 0
    ? new Date(foodLogs.reduce((latest, l) => l.created_at > latest ? l.created_at : latest, foodLogs[0].created_at))
    : null

  const hoursSinceFood = lastFoodLog
    ? (now.getTime() - lastFoodLog.getTime()) / 3600000
    : hour >= 9 ? 999 : 0 // If no food logged and it's after 9am, treat as long ago

  const caloriesTarget = mealPlan?.content?.daily_targets?.calories ?? 2000
  const caloriesConsumed = summary?.daily_breakdown?.[0]?.calories ?? 0
  const remaining = caloriesTarget - caloriesConsumed

  if (hoursSinceFood > 3 && remaining > 400 && hour >= 8 && hour <= 22) {
    const hoursText = lastFoodLog ? `${Math.floor(hoursSinceFood)}h` : 'a while'
    nudges.push({
      type: 'time_to_eat',
      title: 'Time to Eat',
      message: `You haven't eaten in ${hoursText} and have ${remaining} cal left. Want a suggestion?`,
      cta: 'Ask Geo',
      action: 'open_companion'
    })
  }

  // --- "Workout Today" ---
  // Active workout plan has today's workout AND no workout session logged AND after 10am
  if (workoutPlan?.content?.days && hour >= 10) {
    const planStart = workoutPlan.start_date ? new Date(workoutPlan.start_date) : new Date(workoutPlan.created_at)
    const daysDiff = Math.floor((now.getTime() - planStart.getTime()) / 86400000)
    const totalDays = workoutPlan.content.days.length
    if (totalDays > 0) {
      const dayIndex = daysDiff % totalDays
      const todayDay = workoutPlan.content.days[dayIndex]
      const hasWorkoutToday = todayDay && !todayDay.is_rest_day
      const workoutLoggedToday = todayLogs.some((l) => l.type === 'workout')

      if (hasWorkoutToday && !workoutLoggedToday) {
        nudges.push({
          type: 'workout_today',
          title: 'Workout Today',
          message: `Today's workout: ${todayDay.name || `Day ${dayIndex + 1}`}. Ready to go?`,
          cta: 'Start Workout',
          action: 'start_workout',
          actionData: { planId: workoutPlan.id, dayIndex }
        })
      }
    }
  }

  // --- "Protein Check" ---
  // After 7pm AND protein < 70% of target
  if (hour >= 19) {
    const proteinTarget = mealPlan?.content?.daily_targets?.protein ?? 150
    const proteinConsumed = summary?.daily_breakdown?.[0]?.protein ?? 0
    const proteinPct = proteinTarget > 0 ? (proteinConsumed / proteinTarget) * 100 : 100

    if (proteinPct < 70) {
      nudges.push({
        type: 'protein_check',
        title: 'Protein Check',
        message: `You're at ${proteinConsumed}g of your ${proteinTarget}g protein goal. A quick protein shake could help!`,
        cta: 'Log a snack',
        action: 'open_food_search',
        actionData: { mealType: 'Snack' }
      })
    }
  }

  // --- "Program Complete" ---
  if (workoutPlan?.start_date && workoutPlan?.content?.days) {
    const planStart = new Date(workoutPlan.start_date)
    const daysDiff = Math.floor((now.getTime() - planStart.getTime()) / 86400000)
    const totalDays = workoutPlan.content.days.length
    // If we've cycled through the entire plan at least once (assume 4-6 week programs)
    if (totalDays > 0 && daysDiff >= totalDays) {
      nudges.push({
        type: 'program_complete',
        title: 'Program Complete',
        message: "You've finished your workout program! Want Geo to create a new one?",
        cta: 'Chat with Geo',
        action: 'open_full_chat'
      })
    }
  }

  // Return max 2 nudges
  return nudges.slice(0, 2)
}
