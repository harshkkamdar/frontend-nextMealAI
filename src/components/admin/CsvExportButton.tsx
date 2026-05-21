/**
 * FB-R6-S2-v2 · CsvExportButton — fetches the active-users CSV blob,
 * triggers a browser download, disables during in-flight (AC15), and
 * surfaces an error toast on failure (AC14).
 */

'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { exportActiveUsersCsv } from '@/lib/api/admin.api'

export function CsvExportButton() {
  const [busy, setBusy] = useState(false)

  async function handleClick() {
    if (busy) return
    setBusy(true)
    try {
      const { blob, filename } = await exportActiveUsersCsv()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'CSV export failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-surface border border-border text-text-primary hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Download className="w-3.5 h-3.5" />
      {busy ? 'Exporting…' : 'Export CSV'}
    </button>
  )
}
