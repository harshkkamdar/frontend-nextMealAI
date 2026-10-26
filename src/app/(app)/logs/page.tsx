'use client'

import { useRouter } from 'next/navigation'
import { LogList } from '@/components/logs/log-list'
import { useSetGeoScreen } from '@/contexts/geo-screen-context'

/** Recent logs (journey-log L). New logs start from the orb's + sheet. */
export default function LogsPage() {
  useSetGeoScreen('logs', {})
  const router = useRouter()

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-[calc(106px+var(--safe-bottom))]">
      <LogList onBack={() => router.back()} />
    </div>
  )
}
