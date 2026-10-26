import { PublicHeader } from './_components/public-back'

/**
 * Long-form type for the public pages (privacy, support, account deletion): a 36rem column keeps lines near
 * 60-70 characters on wide screens, with a clear heading scale. Descendant rules so the shared legal content
 * reads the same as the pages written here.
 */
// Joined, not cn(): tailwind-merge reads text-title and text-ink as one group and would drop the size.
const PROSE = [
  '[&_h1]:[font-stretch:104%] [&_h1]:text-title [&_h1]:font-extrabold [&_h1]:text-ink',
  '[&_h2]:mt-8 [&_h2]:scroll-mt-[calc(72px+var(--safe-top))] [&_h2]:text-headline [&_h2]:text-ink',
  '[&_h3]:mt-5 [&_h3]:text-body [&_h3]:font-bold [&_h3]:leading-[1.3] [&_h3]:text-ink',
  '[&_p]:mt-2 [&_p]:text-body [&_p]:leading-[1.5] [&_p]:text-ink-80 sm:[&_p]:text-[17px]',
  '[&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-2.5 [&_li]:text-[16px] [&_li]:leading-[1.6] [&_li]:text-ink-80 [&_li]:marker:text-ink-35 sm:[&_li]:text-[17px]',
  '[&_a:not([data-action])]:font-semibold [&_a:not([data-action])]:text-ink [&_a:not([data-action])]:underline [&_a:not([data-action])]:decoration-ink-35 [&_a:not([data-action])]:underline-offset-4',
  // Inline links get 44 pt of tap height through padding, without changing the line box.
  '[&_a:not([data-action])]:py-[14px]',
].join(' ')

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <div className="mx-auto max-w-[36rem] px-5 pb-20">
        <PublicHeader />
        <div className={`page-in mt-1 ${PROSE}`}>{children}</div>
      </div>
    </div>
  )
}
