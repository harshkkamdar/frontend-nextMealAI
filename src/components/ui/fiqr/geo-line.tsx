import type { ReactNode } from 'react'
import { GeoAvatar } from '@/components/shared/geo-avatar'

/**
 * Geo's line (DESIGN.md component 2): the mark, then Geo's sentence in two lines at most. With `onOpen` the line is the
 * way into Geo; `action` sits under it as a text button.
 */
export function GeoLine({ children, onOpen, action, thinking = false }: { children: ReactNode; onOpen?: () => void; action?: ReactNode; thinking?: boolean }) {
  const line = (
    <span className="flex items-start gap-[11px]">
      <GeoAvatar size={24} state={thinking ? 'thinking' : 'default'} className="mt-[1px]" />
      <span className="line-clamp-2 text-[15.5px] font-medium leading-[1.4] text-ink-80">{children}</span>
    </span>
  )
  return (
    <div className="py-[14px]">
      {onOpen ? (
        <button type="button" onClick={onOpen} className="block w-full text-left transition-opacity active:opacity-60">{line}</button>
      ) : line}
      {action ? <div className="mt-1 pl-[35px]">{action}</div> : null}
    </div>
  )
}
