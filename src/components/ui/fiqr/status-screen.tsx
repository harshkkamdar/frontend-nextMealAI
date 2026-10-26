import type { ReactNode } from 'react'
import { GeoAvatar } from '@/components/shared/geo-avatar'

/** Full-screen calm state (404, crash): Geo, one short title, one plain line, one ink action. */
export function StatusScreen({ title, children, action }: { title: string; children: ReactNode; action: ReactNode }) {
  return (
    <main
      className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-center px-6"
      style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'calc(24px + var(--safe-bottom))' }}
    >
      <div className="page-in">
        <GeoAvatar size={48} />
        <h1 className="font-wide mt-6 text-[28px] font-bold leading-[1.12] tracking-[-0.5px] text-ink">{title}</h1>
        <p className="mt-3 max-w-[32ch] text-[16px] leading-[1.5] text-ink-65">{children}</p>
        <div className="mt-8">{action}</div>
      </div>
    </main>
  )
}

/** The one action on a status screen (a Link or a button): ink, full width, 56 pt. */
export const statusActionClass = 'flex h-14 w-full items-center justify-center rounded-[18px] bg-ink text-[17px] font-bold text-cream transition-transform duration-100 active:scale-[.97]'
