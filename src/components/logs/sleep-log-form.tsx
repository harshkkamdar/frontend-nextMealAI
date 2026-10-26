'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { FieldLabel, InlineStepper, ManualLogShell, NotesField, ScaleEnds, saveManualLog } from './manual-log-shell'
import { Scale } from './log-ui'

const hm = (hours: number) => `${Math.floor(hours)}h ${String(Math.round((hours % 1) * 60)).padStart(2, '0')}m`

/** Sleep (journey-log M): hours in 15 minute steps, then how well. Apple Health import is not wired, so no Health card. */
export function SleepLogForm() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const [hours, setHours] = useState(7.5)
  const [qualityRating, setQualityRating] = useState(0)
  const [notes, setNotes] = useState('')

  const handleSave = async () => {
    if (!hours) { toast.error('Hours slept is required'); return }
    if (qualityRating === 0) { toast.error('Select a quality rating'); return }
    setSaving(true)
    const ok = await saveManualLog({ type: 'sleep', payload: { hours, quality_rating: qualityRating, notes: notes.trim() || undefined }, source: 'manual' }, 'Sleep logged', () => router.back())
    setFailed(!ok)
    setSaving(false)
  }

  return (
    <ManualLogShell title="Sleep" prompt="How did you sleep?" saving={saving} failed={failed} onSave={() => void handleSave()}>
      <div className="space-y-6">
        <InlineStepper
          value={<span aria-label={`${hm(hours)} slept`}>{hm(hours)}</span>}
          unit="asleep"
          onLess={() => setHours((h) => Math.max(0, h - 0.25))}
          onMore={() => setHours((h) => Math.min(16, h + 0.25))}
          lessDisabled={hours <= 0}
          moreDisabled={hours >= 16}
          lessLabel="15 minutes less"
          moreLabel="15 minutes more"
        />
        <div>
          <FieldLabel>How well, 1 to 10</FieldLabel>
          <Scale value={qualityRating} onChange={setQualityRating} label="Sleep quality from 1 to 10" />
          <ScaleEnds low="Restless" high="Deep" />
        </div>
        <NotesField value={notes} onChange={setNotes} placeholder="Optional" />
      </div>
    </ManualLogShell>
  )
}
