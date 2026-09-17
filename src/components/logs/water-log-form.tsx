'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createLog } from '@/lib/api/logs.api'
import { ManualLogShell } from './manual-log-shell'

export function WaterLogForm() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [glasses, setGlasses] = useState(3)

  const handleSave = async () => {
    if (glasses <= 0) {
      toast.error('Add at least 1 glass')
      return
    }

    setSaving(true)
    try {
      await createLog({
        type: 'water',
        payload: { glasses },
        source: 'manual',
      })
      toast.success('Water logged')
      router.back()
    } catch {
      toast.error('Failed to log water')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ManualLogShell title="Log water" prompt="How much water today?" saving={saving} onSave={() => void handleSave()}>
      <div className="flex items-center justify-center gap-7 py-10">
        <button
          type="button"
          onClick={() => setGlasses(Math.max(0, glasses - 1))}
          aria-label="Fewer glasses"
          className="flex size-11 items-center justify-center rounded-full bg-ink-08 text-[24px] font-semibold text-ink"
        >
          −
        </button>
        <p className="min-w-32 text-center text-[28px] font-bold tracking-[-0.6px] text-ink">
          {glasses} glass{glasses === 1 ? '' : 'es'}
        </p>
        <button
          type="button"
          onClick={() => setGlasses(glasses + 1)}
          aria-label="More glasses"
          className="flex size-11 items-center justify-center rounded-full bg-ink-08 text-[24px] font-semibold text-ink"
        >
          +
        </button>
      </div>
    </ManualLogShell>
  )
}
