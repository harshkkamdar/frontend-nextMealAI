import Link from 'next/link'
import { StatusCard, statusActionClass } from '@/components/settings/status-card'

export default function NotFound() {
  return (
    <StatusCard title="This page isn't here" action={<Link href="/dashboard" className={statusActionClass}>Back to Today</Link>}>
      The link may be old, or the page has moved. Everything you&apos;ve logged is safe.
    </StatusCard>
  )
}
