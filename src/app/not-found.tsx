import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-[22px] font-semibold text-text-primary">Page not found</h1>
        <p className="text-sm text-text-secondary mt-2">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/dashboard" className="text-sm text-accent font-medium mt-4 inline-block">
          Go home
        </Link>
      </div>
    </div>
  )
}
