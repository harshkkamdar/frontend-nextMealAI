import Link from 'next/link'

import { Wordmark } from '@/components/ui/fiqr/wordmark'
import { cn } from '@/lib/utils'
import { PublicBack } from './_components/public-back'

/**
 * Long-form type for the public pages (privacy, support, account deletion): a 36rem column keeps lines near
 * 60-70 characters on wide screens, with a clear heading scale. Descendant rules so the shared legal content
 * reads the same as the pages written here.
 */
const PROSE = cn(
  '[&_h1]:[font-stretch:112%] [&_h1]:text-[30px] [&_h1]:font-bold [&_h1]:leading-[1.12] [&_h1]:tracking-[-0.6px] [&_h1]:text-ink sm:[&_h1]:text-[34px]',
  '[&_h2]:mt-10 [&_h2]:text-[20px] [&_h2]:font-bold [&_h2]:leading-[1.25] [&_h2]:tracking-[-0.2px] [&_h2]:text-ink',
  '[&_h3]:mt-6 [&_h3]:text-[17px] [&_h3]:font-semibold [&_h3]:leading-[1.3] [&_h3]:text-ink',
  '[&_p]:mt-3 [&_p]:text-[16px] [&_p]:leading-[1.6] [&_p]:text-ink-80 sm:[&_p]:text-[17px]',
  '[&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-2.5 [&_li]:text-[16px] [&_li]:leading-[1.6] [&_li]:text-ink-80 [&_li]:marker:text-ink-35 sm:[&_li]:text-[17px]',
  '[&_a:not([data-action])]:font-semibold [&_a:not([data-action])]:text-ink [&_a:not([data-action])]:underline [&_a:not([data-action])]:decoration-ink-35 [&_a:not([data-action])]:underline-offset-4',
  // Inline links get 44 pt of tap height through padding, without changing the line box.
  '[&_a:not([data-action])]:py-[14px]',
)

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <div className="mx-auto max-w-[36rem] px-5 pb-20" style={{ paddingTop: 'calc(12px + var(--safe-top))' }}>
        <header className="mb-8 flex h-11 items-center gap-3">
          <PublicBack />
          <Link href="/" aria-label="FIQR home" className="inline-flex min-h-11 items-center">
            <Wordmark />
          </Link>
        </header>
        <div className={cn('page-in', PROSE)}>{children}</div>
      </div>
    </div>
  )
}
