'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { WATER_GOAL_GLASSES } from '@/components/dashboard/home-cards'
import { waterGlassesToday } from '@/components/dashboard/home-data'
import { getLogs } from '@/lib/api/logs.api'
import { todayLocalISO } from '@/lib/timezone'
import type { Log } from '@/types/logs.types'
import { InlineStepper, ManualLogShell, saveManualLog } from './manual-log-shell'
import { clockTime } from './log-math'

/** Water (journey-log M): one glass per log by default (owner, 26 Oct 2026), today's glasses as dots under it. */
export function WaterLogForm() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const [glasses, setGlasses] = useState(1)
  const [today, setToday] = useState<{ count: number; last: string | null } | null>(null)

  useEffect(() => {
    let alive = true
    getLogs({ type: 'water', days: 1 }).then((logs: Log[]) => {
      if (!alive) return
      const day = todayLocalISO(Intl.DateTimeFormat().resolvedOptions().timeZone)
      const last = logs.filter((l) => l.type === 'water').sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
      setToday({ count: waterGlassesToday(logs, day), last: last && (last.local_date ?? day) === day ? clockTime(last.created_at) : null })
    }, () => {})
    return () => { alive = false }
  }, [])

  const handleSave = async () => {
    if (glasses <= 0) { toast.error('Add at least 1 glass'); return }
    setSaving(true)
    const ok = await saveManualLog({ type: 'water', payload: { glasses }, source: 'manual' }, glasses === 1 ? 'Glass of water logged' : `${glasses} glasses logged`, () => router.back())
    setFailed(!ok)
    setSaving(false)
  }

  const sub = today ? `Today ${today.count} of ${WATER_GOAL_GLASSES} glasses${today.last ? ` · last at ${today.last}` : ''}` : undefined
  const filled = (today?.count ?? 0) + glasses

  return (
    <ManualLogShell title="Water" prompt="Add water" sub={sub} saving={saving} failed={failed} onSave={() => void handleSave()}>
      <InlineStepper
        value={glasses}
        unit={`${glasses === 1 ? 'glass' : 'glasses'} · ${glasses * 250} ml`}
        onLess={() => setGlasses((n) => Math.max(0, n - 1))}
        onMore={() => setGlasses((n) => Math.min(30, n + 1))}
        lessDisabled={glasses <= 0}
        moreDisabled={glasses >= 30}
        lessLabel="Fewer glasses"
        moreLabel="More glasses"
      >
        <p aria-hidden="true" className="mt-3 flex justify-center gap-1.5">
          {Array.from({ length: Math.max(WATER_GOAL_GLASSES, filled) }, (_, i) => (
            <span key={i} className={`size-2.5 rounded-full ${i < (today?.count ?? 0) ? 'bg-macro-teal' : i < filled ? 'bg-macro-teal/60' : 'bg-ink-08'}`} />
          )).slice(0, 16)}
        </p>
      </InlineStepper>
    </ManualLogShell>
  )
}
