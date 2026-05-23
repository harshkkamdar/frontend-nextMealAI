/**
 * FB-R6-S2-v2 · ActiveUsersTable — sortable by every numeric column.
 *
 * Native `<table>` inside Card chrome. Column headers are <button>s so
 * RTL `getByRole('button', { name })` matches. First click on a column
 * sorts DESC; second click toggles ASC. Clicking a different column
 * resets to DESC.
 */

'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { ActiveUserEntry } from '@/types/admin.types'

type SortKey = 'food_log_count' | 'workout_session_count' | 'chat_turn_count' | null
type SortDir = 'asc' | 'desc'

export function ActiveUsersTable({
  users,
  onRowClick,
}: {
  users: ActiveUserEntry[]
  /** FB-R6-S2-v2.5: invoked when an admin clicks a row to drill into a user. */
  onRowClick?: (user: ActiveUserEntry) => void
}) {
  const [sortKey, setSortKey] = useState<SortKey>(null)
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const sorted = useMemo(() => {
    if (!sortKey) return users
    const copy = [...users]
    copy.sort((a, b) => {
      const va = a[sortKey]
      const vb = b[sortKey]
      return sortDir === 'desc' ? vb - va : va - vb
    })
    return copy
  }, [users, sortKey, sortDir])

  function toggleSort(key: NonNullable<SortKey>) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  if (users.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-4">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary block mb-2">
          Active Users (30d)
        </span>
        <p className="text-xs text-text-secondary">No active users in the last 30 days</p>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary block mb-3">
        Active Users (30d)
      </span>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-text-secondary border-b border-border">
              <th className="py-2 pr-4 font-semibold">Email</th>
              <th className="py-2 pr-4 font-semibold">Last active</th>
              <SortableHeader
                label="Food log count"
                active={sortKey === 'food_log_count'}
                dir={sortDir}
                onClick={() => toggleSort('food_log_count')}
              />
              <SortableHeader
                label="Workout session count"
                active={sortKey === 'workout_session_count'}
                dir={sortDir}
                onClick={() => toggleSort('workout_session_count')}
              />
              <SortableHeader
                label="Chat turn count"
                active={sortKey === 'chat_turn_count'}
                dir={sortDir}
                onClick={() => toggleSort('chat_turn_count')}
              />
            </tr>
          </thead>
          <tbody>
            {sorted.map((u) => {
              const label = u.email || `${u.user_id.slice(0, 8)}…`
              const interactive = Boolean(onRowClick)
              return (
                <tr
                  key={u.user_id}
                  data-testid="active-user-row"
                  data-user-id={u.user_id}
                  onClick={interactive ? () => onRowClick?.(u) : undefined}
                  className={`border-b border-border/50 last:border-b-0 ${
                    interactive ? 'cursor-pointer hover:bg-surface-hover transition-colors' : ''
                  }`}
                >
                  <td className="py-2 pr-4" data-testid="user-email">
                    <div className="flex flex-col">
                      <span className="text-text-primary">{label}</span>
                      {u.display_name && (
                        <span className="text-[10px] text-text-tertiary">
                          {u.display_name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 pr-4 text-text-secondary tabular-nums">{u.last_active}</td>
                  <td className="py-2 pr-4 text-text-primary tabular-nums">{u.food_log_count}</td>
                  <td className="py-2 pr-4 text-text-primary tabular-nums">{u.workout_session_count}</td>
                  <td className="py-2 pr-4 text-text-primary tabular-nums">{u.chat_turn_count}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SortableHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string
  active: boolean
  dir: SortDir
  onClick: () => void
}) {
  return (
    <th className="py-2 pr-4">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 font-semibold text-text-secondary hover:text-text-primary transition-colors"
      >
        {label}
        {active &&
          (dir === 'desc' ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronUp className="w-3 h-3" />
          ))}
      </button>
    </th>
  )
}
