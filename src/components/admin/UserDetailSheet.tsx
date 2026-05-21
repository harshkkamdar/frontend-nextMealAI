/**
 * FB-R6-S2-v2.5 · UserDetailSheet — per-user admin drilldown.
 *
 * Slides in from the right when an admin clicks a row in ActiveUsersTable.
 * Calls GET /v1/admin/users/:userId/summary and renders 8 sections:
 *   1. Header   — email/name + joined + last-active + timezone
 *   2. Profile  — sex, dob, height, weights, goal, activity, diet, equipment, injuries
 *   3. Targets  — 4 mini KPI numbers (calories/protein/carbs/fat)
 *   4. Plans    — active meal + active workout (side-by-side)
 *   5. Now      — in-progress workout (if any)
 *   6. Recent   — last 7 days of logs + workout sessions, chronological
 *   7. Chat     — last 7 days of Geo conversations, grouped by session
 *   8. Photos   — last 7 days of message_attachments (signed URLs from BE)
 *
 * Visual contract matches src/components/dashboard/ — bg-surface +
 * border-border + rounded-2xl + p-4, uppercase 10px labels, tabular-nums
 * KPI numbers, Lucide icons at w-4 h-4.
 *
 * Pattern follows src/components/geo/geo-companion-sheet.tsx (Framer Motion
 * slide-out with backdrop + ESC-to-close).
 */

'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X,
  AlertCircle,
  Mail,
  CalendarDays,
  Ruler,
  Scale,
  Target,
  Dumbbell,
  Utensils,
  Activity,
  MessageCircle,
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { getAdminUserSummary } from '@/lib/api/admin.api'
import type { AdminUserSummary } from '@/types/admin.types'

type State =
  | { kind: 'loading' }
  | { kind: 'ok'; data: AdminUserSummary }
  | { kind: 'error'; message: string }

export function UserDetailSheet({
  userId,
  onClose,
}: {
  userId: string | null
  onClose: () => void
}) {
  const isOpen = userId !== null
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    if (!userId) return
    setState({ kind: 'loading' })
    let cancelled = false
    getAdminUserSummary(userId)
      .then((data) => {
        if (cancelled) return
        setState({ kind: 'ok', data })
      })
      .catch((err) => {
        if (cancelled) return
        setState({
          kind: 'error',
          message: err instanceof Error ? err.message : "Couldn't load user summary",
        })
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  // ESC closes the sheet
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="user-sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
            data-testid="user-detail-backdrop"
          />
          <motion.aside
            key="user-sheet"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-2xl bg-background border-l border-border overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="User detail"
            data-testid="user-detail-sheet"
          >
            <SheetHeader state={state} onClose={onClose} />
            <div className="p-4 space-y-4">
              {state.kind === 'loading' && (
                <div className="bg-surface border border-border rounded-2xl p-8 text-center">
                  <p className="text-sm text-text-secondary">Loading user summary…</p>
                </div>
              )}
              {state.kind === 'error' && (
                <div className="bg-surface border border-border rounded-2xl p-8 text-center">
                  <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                  <p className="text-sm text-text-primary mb-1">Couldn&apos;t load user</p>
                  <p className="text-xs text-text-secondary">{state.message}</p>
                </div>
              )}
              {state.kind === 'ok' && <SheetBody data={state.data} />}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function SheetHeader({ state, onClose }: { state: State; onClose: () => void }) {
  const title =
    state.kind === 'ok'
      ? state.data.user.email || state.data.user.id.slice(0, 8) + '…'
      : 'User'
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur-xl border-b border-border">
      <div className="flex items-center gap-2 min-w-0">
        <Mail className="w-4 h-4 text-text-secondary shrink-0" />
        <span className="text-sm font-semibold text-text-primary truncate" data-testid="user-sheet-title">
          {title}
        </span>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close user detail"
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-hover transition-colors"
      >
        <X className="w-4 h-4 text-text-secondary" />
      </button>
    </div>
  )
}

function SheetBody({ data }: { data: AdminUserSummary }) {
  return (
    <>
      <UserIdentityCard data={data} />
      {data.profile && <ProfileCard profile={data.profile} />}
      {data.targets && <TargetsCard targets={data.targets} />}
      <PlansRow
        meal={data.active_meal_plan}
        workout={data.active_workout_plan}
      />
      {data.in_progress_workout && <InProgressCard ip={data.in_progress_workout} />}
      <RecentActivityCard
        logs={data.recent_logs_7d}
        sessions={data.recent_workout_sessions_7d}
      />
      <ChatHistoryCard chat={data.recent_chat_7d} />
      {data.recent_attachments_7d.length > 0 && (
        <PhotosCard attachments={data.recent_attachments_7d} />
      )}
    </>
  )
}

function UserIdentityCard({ data }: { data: AdminUserSummary }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4" data-testid="section-identity">
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary block mb-2">
        Identity
      </span>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <Field label="Email" value={data.user.email || '—'} />
        <Field label="Display name" value={data.user.display_name || '—'} />
        <Field label="Joined" value={fmtDate(data.user.created_at)} />
        <Field label="Last active" value={data.user.last_active ?? '—'} />
        <Field label="Timezone" value={data.user.timezone || '—'} />
        <Field
          label="Onboarding"
          value={onboardingSummary(data.onboarding)}
        />
      </div>
    </div>
  )
}

function ProfileCard({ profile }: { profile: NonNullable<AdminUserSummary['profile']> }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4" data-testid="section-profile">
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary block mb-3">
        Profile
      </span>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <Field label="Sex" value={profile.sex || '—'} />
        <Field label="DOB" value={profile.dob || '—'} />
        <Field
          label="Height"
          value={profile.height_cm ? `${profile.height_cm} cm` : '—'}
          icon={Ruler}
        />
        <Field
          label="Weight"
          value={
            profile.current_weight_kg
              ? `${profile.current_weight_kg} kg${
                  profile.target_weight_kg ? ` → ${profile.target_weight_kg} kg` : ''
                }`
              : '—'
          }
          icon={Scale}
        />
        <Field label="Goal" value={profile.primary_goal || '—'} icon={Target} />
        <Field label="Activity" value={profile.activity_level || '—'} icon={Activity} />
        <Field label="Experience" value={profile.experience_level || '—'} />
        <Field label="Diet" value={profile.dietary_style || '—'} icon={Utensils} />
        <Field
          label="Meals/day"
          value={profile.meals_per_day != null ? String(profile.meals_per_day) : '—'}
        />
        <Field
          label="Workouts/week"
          value={
            profile.workout_frequency != null ? String(profile.workout_frequency) : '—'
          }
        />
        <Field
          label="Body fat"
          value={profile.body_fat_pct != null ? `${profile.body_fat_pct}%` : '—'}
        />
      </div>
      {(profile.equipment?.length || profile.injuries?.length || profile.allergies?.length) ? (
        <div className="mt-3 space-y-2">
          {profile.equipment && profile.equipment.length > 0 && (
            <ChipRow label="Equipment" items={profile.equipment} />
          )}
          {profile.injuries && profile.injuries.length > 0 && (
            <ChipRow label="Injuries" items={profile.injuries} />
          )}
          {profile.allergies && profile.allergies.length > 0 && (
            <ChipRow label="Allergies" items={profile.allergies} />
          )}
        </div>
      ) : null}
    </div>
  )
}

function TargetsCard({ targets }: { targets: NonNullable<AdminUserSummary['targets']> }) {
  const tiles = [
    { label: 'Calories', value: targets.calories },
    { label: 'Protein', value: targets.protein_g, suffix: 'g' },
    { label: 'Carbs', value: targets.carbs_g, suffix: 'g' },
    { label: 'Fat', value: targets.fat_g, suffix: 'g' },
  ]
  return (
    <div className="bg-surface border border-border rounded-2xl p-4" data-testid="section-targets">
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary block mb-3">
        Daily targets
      </span>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="text-center">
            <p className="text-xs text-text-secondary mb-0.5">{t.label}</p>
            <p className="text-base font-semibold tabular-nums text-text-primary">
              {t.value != null ? `${t.value}${t.suffix ?? ''}` : '—'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PlansRow({
  meal,
  workout,
}: {
  meal: AdminUserSummary['active_meal_plan']
  workout: AdminUserSummary['active_workout_plan']
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="section-plans">
      <div className="bg-surface border border-border rounded-2xl p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Utensils className="w-4 h-4 text-text-secondary" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
            Active nutrition plan
          </span>
        </div>
        {meal ? (
          <>
            <p className="text-sm font-semibold text-text-primary mb-1">
              {meal.name ?? 'Untitled plan'}
            </p>
            <p className="text-xs text-text-secondary">
              {meal.days_count} day{meal.days_count === 1 ? '' : 's'}
              {meal.daily_targets?.calories
                ? ` · ${meal.daily_targets.calories} kcal/day`
                : ''}
            </p>
          </>
        ) : (
          <p className="text-xs text-text-tertiary">No active plan</p>
        )}
      </div>
      <div className="bg-surface border border-border rounded-2xl p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Dumbbell className="w-4 h-4 text-text-secondary" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
            Active workout plan
          </span>
        </div>
        {workout ? (
          <>
            <p className="text-sm font-semibold text-text-primary mb-1">
              {workout.name ?? 'Untitled program'}
            </p>
            <p className="text-xs text-text-secondary">
              {workout.days_count} day{workout.days_count === 1 ? '' : 's'} · cursor at day {workout.current_position + 1}
            </p>
          </>
        ) : (
          <p className="text-xs text-text-tertiary">No active plan</p>
        )}
      </div>
    </div>
  )
}

function InProgressCard({
  ip,
}: {
  ip: NonNullable<AdminUserSummary['in_progress_workout']>
}) {
  return (
    <div
      className="bg-accent-light border border-accent/20 rounded-2xl p-4"
      data-testid="section-in-progress"
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Activity className="w-4 h-4 text-accent" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-accent">
          Currently doing
        </span>
      </div>
      <p className="text-sm font-semibold text-text-primary mb-1">
        {ip.day_name ?? `Day ${ip.plan_day_index != null ? ip.plan_day_index + 1 : '?'}`}
      </p>
      <p className="text-xs text-text-secondary">
        Started {fmtRelative(ip.started_at)} · {ip.exercises_completed}/{ip.exercises_total} exercises complete
        {ip.total_volume_kg ? ` · ${ip.total_volume_kg.toLocaleString()} kg volume` : ''}
      </p>
    </div>
  )
}

function RecentActivityCard({
  logs,
  sessions,
}: {
  logs: AdminUserSummary['recent_logs_7d']
  sessions: AdminUserSummary['recent_workout_sessions_7d']
}) {
  // Merge + sort by date (descending)
  type Item =
    | { kind: 'log'; created_at: string; logType: string; payload: Record<string, unknown> }
    | {
        kind: 'session'
        created_at: string
        day_name: string | null
        status: string
        exercises_completed: number
        exercises_total: number
      }
  const items: Item[] = [
    ...logs.map((l) => ({
      kind: 'log' as const,
      created_at: l.created_at,
      logType: l.type,
      payload: l.payload,
    })),
    ...sessions.map((s) => ({
      kind: 'session' as const,
      created_at: s.started_at,
      day_name: s.day_name,
      status: s.status,
      exercises_completed: s.exercises_completed,
      exercises_total: s.exercises_total,
    })),
  ].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))

  return (
    <div className="bg-surface border border-border rounded-2xl p-4" data-testid="section-activity">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
          Recent activity (last 7 days)
        </span>
        <span className="text-[10px] text-text-tertiary tabular-nums">
          {items.length} item{items.length === 1 ? '' : 's'}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-text-tertiary">No activity in the last 7 days</p>
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 30).map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm border-b border-border/40 last:border-b-0 pb-2 last:pb-0"
            >
              <span className="text-[10px] text-text-tertiary tabular-nums w-20 shrink-0 mt-0.5">
                {fmtRelative(item.created_at)}
              </span>
              <span className="text-text-primary flex-1">
                {item.kind === 'log' ? renderLogSummary(item.logType, item.payload) : (
                  <>
                    Workout: {item.day_name ?? 'unnamed day'} —{' '}
                    <span className={item.status === 'completed' ? 'text-success' : item.status === 'abandoned' ? 'text-warning' : 'text-text-secondary'}>
                      {item.status}
                    </span>
                    {' '}({item.exercises_completed}/{item.exercises_total} exercises)
                  </>
                )}
              </span>
            </li>
          ))}
          {items.length > 30 && (
            <li className="text-xs text-text-tertiary text-center pt-1">
              +{items.length - 30} older items (capped for display)
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

function ChatHistoryCard({ chat }: { chat: AdminUserSummary['recent_chat_7d'] }) {
  // Group by session_id, oldest within a session first so a conversation reads naturally.
  const grouped = new Map<string, typeof chat>()
  for (const m of chat) {
    const key = m.session_id ?? 'unsessioned'
    const list = grouped.get(key) ?? []
    list.push(m)
    grouped.set(key, list)
  }
  // Sort within each session oldest→newest
  for (const list of grouped.values()) {
    list.sort((a, b) => (a.created_at > b.created_at ? 1 : -1))
  }
  // Sort sessions by their most recent message (newest first)
  const sessions = Array.from(grouped.entries()).sort((a, b) => {
    const aTime = a[1][a[1].length - 1]?.created_at ?? ''
    const bTime = b[1][b[1].length - 1]?.created_at ?? ''
    return aTime < bTime ? 1 : -1
  })

  const [expanded, setExpanded] = useState<Set<string>>(() => {
    // Expand most recent session by default
    if (sessions.length === 0) return new Set()
    return new Set([sessions[0][0]])
  })

  function toggle(sessionKey: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(sessionKey)) next.delete(sessionKey)
      else next.add(sessionKey)
      return next
    })
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-4" data-testid="section-chat">
      <div className="flex items-center gap-1.5 mb-3">
        <MessageCircle className="w-4 h-4 text-text-secondary" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
          Chat with Geo (last 7 days)
        </span>
        <span className="text-[10px] text-text-tertiary tabular-nums ml-auto">
          {chat.length} message{chat.length === 1 ? '' : 's'} · {sessions.length} session{sessions.length === 1 ? '' : 's'}
        </span>
      </div>
      {sessions.length === 0 ? (
        <p className="text-xs text-text-tertiary">No chat in the last 7 days</p>
      ) : (
        <ul className="space-y-2">
          {sessions.map(([sessionKey, msgs]) => {
            const isExpanded = expanded.has(sessionKey)
            const last = msgs[msgs.length - 1]
            return (
              <li key={sessionKey} className="border border-border rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggle(sessionKey)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-hover transition-colors"
                  data-testid="chat-session-toggle"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3 text-text-secondary shrink-0" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-text-secondary shrink-0" />
                  )}
                  <span className="text-xs font-mono text-text-secondary truncate">
                    {sessionKey.slice(0, 8)}…
                  </span>
                  <span className="text-[10px] text-text-tertiary tabular-nums ml-auto">
                    {msgs.length} · {fmtRelative(last.created_at)}
                  </span>
                </button>
                {isExpanded && (
                  <div className="px-3 py-2 space-y-2 bg-background border-t border-border">
                    {msgs.map((m) => (
                      <div key={m.id} className="text-sm">
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span
                            className={`text-[10px] font-semibold uppercase tracking-[0.04em] ${
                              m.role === 'user' ? 'text-accent' : 'text-text-secondary'
                            }`}
                          >
                            {m.role}
                          </span>
                          <span className="text-[10px] text-text-tertiary tabular-nums">
                            {fmtRelative(m.created_at)}
                          </span>
                          {m.tool_names.length > 0 && (
                            <span className="text-[10px] text-text-tertiary">
                              tools: {m.tool_names.join(', ')}
                            </span>
                          )}
                        </div>
                        <p className="text-text-primary whitespace-pre-wrap break-words">
                          {m.content || <span className="text-text-tertiary italic">(empty)</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function PhotosCard({
  attachments,
}: {
  attachments: AdminUserSummary['recent_attachments_7d']
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4" data-testid="section-photos">
      <div className="flex items-center gap-1.5 mb-3">
        <ImageIcon className="w-4 h-4 text-text-secondary" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
          Photos (last 7 days)
        </span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {attachments.slice(0, 15).map((a) => (
          <div
            key={a.id}
            className="aspect-square rounded-lg overflow-hidden bg-background border border-border"
          >
            {a.signed_url ? (
              <img
                src={a.signed_url}
                alt="attachment"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-text-tertiary" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function Field({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number
  icon?: typeof CalendarDays
}) {
  return (
    <div className="flex items-baseline gap-1.5 min-w-0">
      {Icon && <Icon className="w-3 h-3 text-text-tertiary shrink-0" />}
      <span className="text-[10px] uppercase tracking-[0.04em] text-text-tertiary shrink-0">
        {label}
      </span>
      <span className="text-sm text-text-primary truncate">{value}</span>
    </div>
  )
}

function ChipRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.04em] text-text-tertiary mb-1">{label}</p>
      <div className="flex flex-wrap gap-1">
        {items.map((item) => (
          <span
            key={item}
            className="px-2 py-0.5 rounded-full text-[11px] bg-background border border-border text-text-primary"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString()
  } catch {
    return iso
  }
}

function fmtRelative(iso: string): string {
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return iso
  const now = Date.now()
  const diff = Math.floor((now - then) / 1000) // seconds
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`
  return new Date(iso).toLocaleDateString()
}

function onboardingSummary(o: AdminUserSummary['onboarding']): string {
  const done = [o.personal && 'P', o.fitness && 'F', o.nutrition && 'N'].filter(Boolean)
  if (done.length === 3) return 'Complete'
  if (done.length === 0) return 'Not started'
  return `Partial (${done.join('/')})`
}

function renderLogSummary(type: string, payload: Record<string, unknown>): string {
  if (type === 'food') {
    const macros = (payload as { macros?: { total_kcal?: number } }).macros
    const meal = (payload as { meal_type?: string }).meal_type
    const kcal = macros?.total_kcal ?? (payload as { calories?: number }).calories
    return `Food log${meal ? ` (${meal})` : ''}${kcal ? ` — ${kcal} kcal` : ''}`
  }
  if (type === 'weight') {
    const w = (payload as { weight_kg?: number }).weight_kg
    return `Weight: ${w ?? '?'} kg`
  }
  if (type === 'sleep') {
    const h = (payload as { duration_hours?: number }).duration_hours
    return `Sleep: ${h ?? '?'}h`
  }
  if (type === 'mood') {
    const s = (payload as { mood_score?: number }).mood_score
    return `Mood: ${s ?? '?'}/10`
  }
  if (type === 'energy') {
    const s = (payload as { energy_level?: number }).energy_level
    return `Energy: ${s ?? '?'}/10`
  }
  if (type === 'photo') return 'Photo log'
  return `${type} log`
}
