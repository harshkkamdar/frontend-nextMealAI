'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getLogs } from '@/lib/api/logs.api'
import { haptic } from '@/lib/platform/app'
import { CARD } from './log-ui'
import { ManualLogShell, NotesField, saveManualLog } from './manual-log-shell'

const dayLabel = (iso: string) => new Date(iso).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '')

/** Weight (journey-log M): starts at the last weigh-in, nudged by 0.1 kg or typed. */
export function WeightLogForm() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const [weightKg, setWeightKg] = useState<number | ''>('')
  const [last, setLast] = useState<{ kg: number; on: string } | null>(null)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    let alive = true
    getLogs({ type: 'weight', limit: 1 }).then((logs) => {
      const log = logs.find((l) => l.type === 'weight')
      const kg = Number((log?.payload as { weight_kg?: number } | undefined)?.weight_kg)
      if (!alive || !log || !Number.isFinite(kg)) return
      setLast({ kg, on: dayLabel(log.created_at) })
      setWeightKg((current) => (current === '' ? kg : current))
    }, () => {})
    return () => { alive = false }
  }, [])

  const nudge = (by: number) => {
    void haptic('selection')
    setWeightKg((kg) => Math.max(0, Math.round(((kg || last?.kg || 0) + by) * 10) / 10))
  }

  const handleSave = async () => {
    if (!weightKg) { toast.error('Weight is required'); return }
    setSaving(true)
    const ok = await saveManualLog({ type: 'weight', payload: { weight_kg: weightKg, notes: notes.trim() || undefined }, source: 'manual' }, 'Weight logged', () => router.back())
    setFailed(!ok)
    setSaving(false)
  }

  return (
    <ManualLogShell title="Weight" prompt="What does the scale say?" sub={last ? `Last ${last.kg} kg on ${last.on}` : undefined} saving={saving} failed={failed} onSave={() => void handleSave()}>
      <div className="space-y-5">
        <div className={`${CARD} px-4 pb-4 pt-5`}>
          <label className="flex items-baseline justify-center gap-1.5">
            <input
              aria-label="Weight"
              type="number"
              inputMode="decimal"
              step="0.1"
              value={weightKg}
              placeholder="0.0"
              onChange={(event) => setWeightKg(event.target.value ? Number(event.target.value) : '')}
              className="font-display w-[5ch] bg-transparent text-right text-[40px] font-extrabold leading-none tracking-[-0.02em] text-ink outline-none placeholder:text-ink-35 tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-body font-semibold text-ink-65">kg</span>
          </label>
          <div className="mt-3 flex justify-center gap-2">
            <button type="button" onClick={() => nudge(-0.1)} aria-label="0.1 kg less" className="h-11 rounded-full bg-ink-06 px-4 text-body-sm font-bold text-ink transition-transform active:scale-[.94]">−0.1</button>
            <button type="button" onClick={() => nudge(0.1)} aria-label="0.1 kg more" className="h-11 rounded-full bg-ink-06 px-4 text-body-sm font-bold text-ink transition-transform active:scale-[.94]">+0.1</button>
          </div>
        </div>
        <NotesField value={notes} onChange={setNotes} placeholder="Optional" />
      </div>
    </ManualLogShell>
  )
}
