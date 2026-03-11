import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
      <Button asChild className="bg-brand hover:bg-brand/90 text-white">
        <Link href="/dashboard">Go to Dashboard</Link>
      </Button>
    </div>
  )
}
