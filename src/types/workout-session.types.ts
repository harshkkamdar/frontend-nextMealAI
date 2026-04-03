export type SessionStatus = 'in_progress' | 'completed' | 'abandoned'
export type ExerciseStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'

export interface SetData {
  set_number: number
  planned_reps: number
  planned_weight_kg: number | null
  actual_reps: number | null
  actual_weight_kg: number | null
  completed: boolean
  completed_at: string | null
  previous_reps?: number | null
  previous_weight_kg?: number | null
}

export interface SessionExercise {
  name: string
  muscle_group: string | null
  planned_sets: number
  planned_reps: number
  rest_seconds: number
  instructions?: string[]
  notes?: string | null
  status: ExerciseStatus
  sets: SetData[]
}

export interface WorkoutSession {
  id: string
  user_id: string
  plan_id: string | null
  plan_day_index: number | null
  day_name: string
  status: SessionStatus
  started_at: string
  completed_at: string | null
  exercises: SessionExercise[]
  total_volume_kg: number | null
  duration_minutes: number | null
  notes: string | null
  created_at: string
}

export interface ExerciseHistory {
  session_id: string
  date: string
  day_name: string
  exercise: SessionExercise
}

export interface StartSessionInput {
  plan_id?: string
  plan_day_index?: number
  day_name?: string
  exercises?: Array<{
    name: string
    muscle_group?: string
    planned_sets?: number
    planned_reps?: number
    rest_seconds?: number
  }>
}
