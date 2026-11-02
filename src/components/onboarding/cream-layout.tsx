import type { ReactNode } from 'react'

export function CreamLayout({ children }: { children: ReactNode }) {
  return <div className="relative min-h-dvh bg-cream">{children}</div>
}
