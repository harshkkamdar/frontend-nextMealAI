'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createLog } from '@/lib/api/logs.api'
import { haptic } from '@/lib/platform/app'
import { ManualLogShell } from './manual-log-shell'
import { CARD, Stepper } from './log-ui'

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
      void haptic('success')
      toast.success('Water logged')
      router.back()
    } catch {
      toast.error('Failed to log water')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ManualLogShell title="Water" prompt="How many glasses so far?" saving={saving} onSave={() => void handleSave()}>
      <div className={`${CARD} py-8`}>
        <Stepper
          value={glasses}
          unit={glasses === 1 ? 'glass' : 'glasses'}
          onChange={setGlasses}
          max={30}
          lessLabel="Fewer glasses"
          moreLabel="More glasses"
        />
      </div>
    </ManualLogShell>
  )
}
