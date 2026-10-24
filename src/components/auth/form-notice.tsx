import type { ReactNode } from 'react'

/** Form-level error above the CTA. Re-key it per attempt so the shake replays. */
export function FormNotice({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="shake mb-3 flex items-start gap-2.5 rounded-[var(--radius-row)] bg-card px-4 py-3 text-[15px] font-semibold leading-[1.4] text-ink outline outline-2 -outline-offset-2 outline-ink">
      <svg viewBox="0 0 20 20" className="mt-px size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="10" cy="10" r="8" /><path d="M10 6v5M10 14h.01" /></svg>
      {children}
    </p>
  )
}
