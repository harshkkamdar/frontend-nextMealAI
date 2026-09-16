import Link from 'next/link'

import { Wordmark } from '@/components/ui/fiqr/wordmark'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <div
        className="mx-auto max-w-md px-gutter pb-16"
        style={{ paddingTop: 'calc(20px + var(--safe-top))' }}
      >
        <header className="mb-10">
          <Link href="/" aria-label="FIQR home">
            <Wordmark />
          </Link>
        </header>
        {children}
      </div>
    </div>
  )
}
