import type { MealPlan, WorkoutPlan } from '@/types/plans.types'

interface TodayPlanCardProps {
  mealPlan?: MealPlan
  workoutPlan?: WorkoutPlan
  today: string // e.g. 'monday'
}

export function TodayPlanCard({ mealPlan, workoutPlan, today }: TodayPlanCardProps) {
  if (!mealPlan && !workoutPlan) {
    return (
      <div className="bg-bg-secondary rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-2">Today&apos;s Plan</h3>
        <p className="text-muted-foreground text-sm">No active plan yet. Chat with Geo to generate one!</p>
      </div>
    )
  }

  const todayMeals = mealPlan?.content?.days?.find((d) =>
    d.day.toLowerCase() === today || d.day.toLowerCase().startsWith(today.slice(0, 3))
  )
  const todayWorkout = workoutPlan?.content?.days?.find((d) =>
    d.day.toLowerCase() === today || d.day.toLowerCase().startsWith(today.slice(0, 3))
  )

  return (
    <div className="bg-bg-secondary rounded-2xl p-5 space-y-4">
      <h3 className="font-semibold text-foreground">Today&apos;s Plan</h3>

      {todayMeals && todayMeals.meals.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-brand uppercase tracking-wide">Meals</p>
          {todayMeals.meals.slice(0, 3).map((meal, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
              <p className="text-sm text-foreground">{meal.name}</p>
              {meal.time && <span className="text-xs text-muted-foreground ml-auto">{meal.time}</span>}
            </div>
          ))}
          {todayMeals.meals.length > 3 && (
            <p className="text-xs text-muted-foreground">+{todayMeals.meals.length - 3} more meals</p>
          )}
        </div>
      )}

      {todayWorkout && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-brand uppercase tracking-wide">Workout</p>
          {todayWorkout.rest ? (
            <p className="text-sm text-muted-foreground">Rest day 💪</p>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
              <p className="text-sm text-foreground">{todayWorkout.name}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
