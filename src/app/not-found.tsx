import Link from 'next/link'
import { StatusScreen, statusActionClass } from '@/components/ui/fiqr/status-screen'

export default function NotFound() {
  return (
    <StatusScreen title="This page isn't here" action={<Link href="/dashboard" className={statusActionClass}>Back to Today</Link>}>
      The link may be old, or the page has moved. Everything you&apos;ve logged is safe.
    </StatusScreen>
  )
}
