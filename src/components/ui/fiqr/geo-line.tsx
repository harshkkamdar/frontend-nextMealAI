import type { ReactNode } from 'react'
import { GeoMark } from '@/components/shared/geo-avatar'

/**
 * Geo's line (DESIGN.md component 2): Geo speaking, in Geo's voice. The bare mark turns its bar toward the sentence as
 * the screen opens; two lines at most. With `onOpen` the line is the way into Geo; `action` sits under it as a text button.
 */
export function GeoLine({ children, onOpen, action, thinking = false }: { children: ReactNode; onOpen?: () => void; action?: ReactNode; thinking?: boolean }) {
  const line = (
    <span className="flex items-start gap-3">
      <span role="img" aria-label="Geo" className="-mt-px"><GeoMark size={26} done={!thinking} working={thinking} /></span>
      <span className="line-clamp-2 text-[17px] font-medium leading-[1.42] tracking-[-0.2px] text-ink">{children}</span>
    </span>
  )
  return (
    <div className="py-4">
      {onOpen ? (
        <button type="button" onClick={onOpen} className="block w-full text-left transition-opacity active:opacity-60">{line}</button>
      ) : line}
      {action ? <div className="mt-1 pl-[38px]">{action}</div> : null}
    </div>
  )
}
