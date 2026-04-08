'use client'

import { use, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, ChevronDown, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { RestTimer } from '@/components/workout/rest-timer'
import { useUIStore } from '@/stores/ui.store'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'
import {
  getWorkoutSession,
  updateWorkoutSession,
  completeWorkoutSession
} from '@/lib/api/workout-sessions.api'
import { cn } from '@/lib/utils'
import type { WorkoutSession, SessionExercise } from '@/types/workout-session.types'

export default function WorkoutFollowPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params)
  const router = useRouter()
  const [session, setSession] = useState<WorkoutSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [collapsedIndices, setCollapsedIndices] = useState<Set<number>>(new Set())
  const [showRestTimer, setShowRestTimer] = useState(false)
  const [restSeconds, setRestSeconds] = useState(90)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [completing, setCompleting] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useSetGeoScreen('workout_follow', {
    sessionId,
    currentExercise: null,
    exerciseIndex: 0,
  })

  const loadSession = useCallback((showToast = false) => {
    return getWorkoutSession(sessionId)
      .then((s) => {
        setSession(s)
        // All exercises expanded by default — no need to track expanded index
        if (showToast) toast.success('Workout updated!')
      })
      .catch(() => { toast.error('Failed to load workout'); router.back() })
  }, [sessionId, router])

  useEffect(() => {
    loadSession().finally(() => setLoading(false))
  }, [loadSession])

  // Re-fetch when Geo swaps an exercise via the companion
  useEffect(() => {
    const handler = () => loadSession(true)
    window.addEventListener('workout:session-updated', handler)
    return () => window.removeEventListener('workout:session-updated', handler)
  }, [loadSession])

  useEffect(() => {
    if (!session || session.status !== 'in_progress') return
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [session])

  useEffect(() => {
    if (session?.started_at) {
      const elapsed = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000)
      setElapsedSeconds(Math.max(0, elapsed))
    }
  }, [session?.started_at])

  const saveExercises = useCallback((exercises: SessionExercise[]) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      updateWorkoutSession(sessionId, { exercises }).catch(() => {})
    }, 500)
  }, [sessionId])

  const exercises = session?.exercises ?? []

  const updateSet = (exIndex: number, setIndex: number, field: string, value: any) => {
    if (!session) return
    const updated = [...session.exercises]
    const sets = [...updated[exIndex].sets]
    sets[setIndex] = { ...sets[setIndex], [field]: value }
    updated[exIndex] = { ...updated[exIndex], sets }
    setSession({ ...session, exercises: updated })
    saveExercises(updated)
  }

  const completeSet = (exIndex: number, setIndex: number) => {
    if (!session) return
    const updated = [...session.exercises]
    const sets = [...updated[exIndex].sets]
    const set = sets[setIndex]

    if (set.completed) {
      sets[setIndex] = { ...set, completed: false, completed_at: null }
    } else {
      sets[setIndex] = { ...set, completed: true, completed_at: new Date().toISOString() }

      if (updated[exIndex].status === 'pending') {
        updated[exIndex] = { ...updated[exIndex], status: 'in_progress' }
      }

      const allDone = sets.every((s) => s.completed)
      if (allDone) {
        updated[exIndex] = { ...updated[exIndex], status: 'completed', sets }
        setSession({ ...session, exercises: updated })
        saveExercises(updated)
        // All exercises stay expanded — no auto-collapse needed
        return
      }

      setRestSeconds(updated[exIndex].rest_seconds || 90)
      setShowRestTimer(true)
    }

    updated[exIndex] = { ...updated[exIndex], sets }
    setSession({ ...session, exercises: updated })
    saveExercises(updated)
  }

  const handleComplete = async () => {
    if (completing) return
    setCompleting(true)
    try {
      const completed = await completeWorkoutSession(sessionId)
      setSession(completed)
      setShowSummary(true)
    } catch {
      toast.error('Failed to complete workout')
    } finally {
      setCompleting(false)
    }
  }

  const handleBack = () => {
    if (showSummary || session?.status === 'completed') { router.push('/activity'); return }
    if (confirm('End workout? Your progress is saved and you can resume later.')) router.push('/activity')
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return null

  if (showSummary) {
    const completedExercises = exercises.filter((e) => e.status === 'completed').length
    return (
      <div className="h-dvh flex flex-col bg-background">
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-2xl font-semibold text-text-primary mb-2">Workout Complete!</h1>
          <p className="text-sm text-text-secondary mb-6">{session.day_name}</p>
          <div className="grid grid-cols-3 gap-4 w-full max-w-xs mb-8">
            <div className="bg-surface border border-border rounded-xl p-3 text-center">
              <p className="text-lg font-semibold text-text-primary">{session.duration_minutes ?? 0}</p>
              <p className="text-[10px] text-text-tertiary">minutes</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-3 text-center">
              <p className="text-lg font-semibold text-text-primary">{completedExercises}</p>
              <p className="text-[10px] text-text-tertiary">exercises</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-3 text-center">
              <p className="text-lg font-semibold text-text-primary">{(session.total_volume_kg ?? 0).toLocaleString()}</p>
              <p className="text-[10px] text-text-tertiary">kg volume</p>
            </div>
          </div>
          <Button onClick={() => router.push('/activity')} className="w-full max-w-xs bg-gradient-to-r from-accent to-accent-hover text-white">
            Done
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-dvh flex flex-col bg-background">
      <RestTimer
        isActive={showRestTimer}
        duration={restSeconds}
        onSkip={() => setShowRestTimer(false)}
        onComplete={() => setShowRestTimer(false)}
      />

      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={handleBack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-hover">
            <ArrowLeft className="w-5 h-5 text-text-primary" />
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-text-primary">{session.day_name}</p>
            <p className="text-xs text-accent tabular-nums">{formatTime(elapsedSeconds)}</p>
          </div>
          <button
            onClick={handleComplete}
            disabled={completing}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-success/10 hover:bg-success/20"
          >
            <Check className="w-4 h-4 text-success" />
          </button>
        </div>
      </div>

      {/* Exercise accordion list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 pb-24">
        {exercises.map((exercise, exIndex) => {
          const isExpanded = !collapsedIndices.has(exIndex)
          const completedSets = exercise.sets.filter((s) => s.completed).length
          const totalSets = exercise.sets.length

          return (
            <div
              key={exIndex}
              className={cn(
                'bg-surface border rounded-xl overflow-hidden',
                exercise.status === 'completed' ? 'border-success/30' :
                isExpanded ? 'border-accent/50' :
                'border-border'
              )}
            >
              {/* Row header — tap to expand/collapse */}
              <button
                onClick={() => setCollapsedIndices(prev => {
                  const next = new Set(prev)
                  next.has(exIndex) ? next.delete(exIndex) : next.add(exIndex)
                  return next
                })}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                <div className={cn(
                  'w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
                  exercise.status === 'completed' ? 'bg-success border-success' :
                  exercise.status === 'in_progress' ? 'border-accent' :
                  'border-border'
                )}>
                  {exercise.status === 'completed' && <Check className="w-3 h-3 text-white" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium truncate',
                    exercise.status === 'completed' ? 'text-text-secondary line-through' : 'text-text-primary'
                  )}>
                    {exercise.name}
                  </p>
                  <p className="text-[11px] text-text-tertiary mt-0.5">
                    {exercise.muscle_group && (
                      <span className="text-accent mr-2">{exercise.muscle_group}</span>
                    )}
                    {completedSets}/{totalSets} sets
                  </p>
                </div>

                <ChevronDown className={cn(
                  'w-4 h-4 text-text-tertiary flex-shrink-0 transition-transform duration-200',
                  isExpanded && 'rotate-180'
                )} />
              </button>

              {/* Expanded: sets table + notes */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border/50">
                  {exercise.instructions && exercise.instructions.length > 0 && (
                    <details className="my-3">
                      <summary className="text-xs text-text-secondary cursor-pointer hover:text-accent">
                        How to perform
                      </summary>
                      <ol className="mt-2 space-y-1 pl-4 list-decimal">
                        {exercise.instructions.map((step, i) => (
                          <li key={i} className="text-xs text-text-secondary">{step}</li>
                        ))}
                      </ol>
                    </details>
                  )}

                  {/* Sets table */}
                  <div className="bg-background border border-border rounded-xl overflow-hidden mt-3">
                    <div className="grid grid-cols-[40px_1fr_1fr_1fr_44px] gap-1 px-3 py-2 border-b border-border text-[10px] font-medium text-text-tertiary uppercase tracking-wide">
                      <span>Set</span>
                      <span>Previous</span>
                      <span>Reps</span>
                      <span>kg</span>
                      <span />
                    </div>

                    {exercise.sets.map((set, setIdx) => (
                      <div
                        key={setIdx}
                        className={cn(
                          'grid grid-cols-[40px_1fr_1fr_1fr_44px] gap-1 items-center px-3 py-2.5 border-b border-border/50 last:border-b-0',
                          set.completed && 'bg-success/5'
                        )}
                      >
                        <span className="text-sm font-medium text-text-primary">{set.set_number}</span>
                        <span className="text-xs text-text-tertiary tabular-nums">
                          {set.previous_reps && set.previous_weight_kg
                            ? `${set.previous_reps}×${set.previous_weight_kg}`
                            : '—'}
                        </span>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={set.actual_reps ?? ''}
                          placeholder={String(set.planned_reps)}
                          onChange={(e) => updateSet(exIndex, setIdx, 'actual_reps', e.target.value ? Number(e.target.value) : null)}
                          className="w-full h-8 text-center text-sm bg-surface border border-border rounded-lg focus:border-accent outline-none tabular-nums"
                        />
                        <input
                          type="number"
                          inputMode="decimal"
                          value={set.actual_weight_kg ?? ''}
                          placeholder={set.planned_weight_kg ? String(set.planned_weight_kg) : '—'}
                          onChange={(e) => updateSet(exIndex, setIdx, 'actual_weight_kg', e.target.value ? Number(e.target.value) : null)}
                          className="w-full h-8 text-center text-sm bg-surface border border-border rounded-lg focus:border-accent outline-none tabular-nums"
                        />
                        <button
                          onClick={() => completeSet(exIndex, setIdx)}
                          className={cn(
                            'w-8 h-8 rounded-full border-2 flex items-center justify-center mx-auto transition-colors',
                            set.completed ? 'bg-success border-success' : 'border-border hover:border-accent'
                          )}
                        >
                          {set.completed && <Check className="w-4 h-4 text-white" />}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  <textarea
                    placeholder="Notes (form cues, how it felt...)"
                    value={exercise.notes || ''}
                    onChange={(e) => {
                      if (!session) return
                      const updated = [...session.exercises]
                      updated[exIndex] = { ...updated[exIndex], notes: e.target.value }
                      setSession({ ...session, exercises: updated })
                      saveExercises(updated)
                    }}
                    className="w-full mt-3 text-xs text-text-secondary bg-surface border border-border rounded-xl px-3 py-2 resize-none h-16 placeholder:text-text-tertiary outline-none focus:border-accent"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Floating Geo button */}
      <button
        onClick={() => useUIStore.getState().openSheet('geo-companion')}
        className="fixed bottom-6 right-4 w-12 h-12 rounded-full bg-accent shadow-lg shadow-accent/30 flex items-center justify-center z-20"
        aria-label="Ask Geo"
      >
        <MessageCircle className="w-5 h-5 text-white" />
      </button>
    </div>
  )
}
