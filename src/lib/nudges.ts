import type { Log, LogsSummary, FoodPayload } from '@/types/logs.types'
import type { MealPlan, WorkoutPlan } from '@/types/plans.types'
import type { Profile } from '@/types/profile.types'
import { formatMacroGrams } from '@/lib/macros'
import { nextWorkoutDayIndex } from '@/lib/workout-session'

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

  // FB-tdee-baseline: targets come from meal-plan override → profile baseline.
  // Never fall back to hardcoded numbers — if both are null the user's profile
  // is incomplete and we suppress this nudge entirely so we don't lie.
  const caloriesTarget = mealPlan?.content?.daily_targets?.calories
    ?? profile?.daily_calorie_target
    ?? 0
  const caloriesConsumed = summary?.daily_breakdown?.[0]?.calories ?? 0
  const remaining = caloriesTarget - caloriesConsumed

  if (caloriesTarget > 0 && hoursSinceFood > 3 && remaining > 400 && hour >= 8 && hour <= 22) {
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
  // Active workout plan has today's workout AND no workout session logged AND after 10am.
  // Suppressed if "Program Complete" already fires below (would be contradictory).
  const programIsComplete = (() => {
    if (!workoutPlan?.start_date || !workoutPlan?.content?.days) return false;
    const planStart = new Date(workoutPlan.start_date);
    const daysSinceStart = Math.floor((now.getTime() - planStart.getTime()) / 86400000);
    // Plan is "complete" only after a full 6-week minimum cycle, not after one
    // 7-day pass. Cyclic 7-day plans aren't meant to "end" after 7 days.
    return daysSinceStart >= 42;
  })();

  if (workoutPlan?.content?.days && hour >= 10 && !programIsComplete) {
    const totalDays = workoutPlan.content.days.length
    // Use the SAME cursor source as Activity + WorkoutCard (plan.current_position),
    // not calendar arithmetic. The old `daysDiff % totalDays` ignored the cursor,
    // so the nudge named a different day than every other surface (and tapping it
    // started the wrong day's session). nextWorkoutDayIndex reads current_position.
    const dayIndex = nextWorkoutDayIndex(workoutPlan)
    if (totalDays > 0 && dayIndex >= 0) {
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
    // FB-tdee-baseline: same precedence as calories. Skip the nudge if both
    // sources are null — we won't fabricate a 150g default.
    const proteinTarget = mealPlan?.content?.daily_targets?.protein
      ?? profile?.daily_protein_g
      ?? 0
    const proteinConsumed = summary?.daily_breakdown?.[0]?.protein ?? 0
    const proteinPct = proteinTarget > 0 ? (proteinConsumed / proteinTarget) * 100 : 100

    if (proteinTarget > 0 && proteinPct < 70) {
      nudges.push({
        type: 'protein_check',
        title: 'Protein Check',
        message: `You're at ${formatMacroGrams(proteinConsumed)} of your ${formatMacroGrams(proteinTarget)} protein goal. A quick protein shake could help!`,
        cta: 'Log a snack',
        action: 'open_food_search',
        actionData: { mealType: 'Snack' }
      })
    }
  }

  // --- "Program Complete" ---
  // Cyclic plans aren't "complete" after 7 days — they cycle. Treat completion
  // as "at least 6 weeks elapsed since plan start" so the nudge actually means
  // the user has done the program long enough to justify a refresh.
  if (programIsComplete) {
    nudges.push({
      type: 'program_complete',
      title: 'Program Complete',
      message: "You've been on this program 6+ weeks! Want Geo to refresh it?",
      cta: 'Chat with Geo',
      action: 'open_full_chat'
    })
  }

  // Return max 2 nudges
  return nudges.slice(0, 2)
}
