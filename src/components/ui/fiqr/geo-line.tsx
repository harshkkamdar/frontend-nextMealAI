import type { ReactNode } from 'react'
import { GeoMark, type GeoPose } from '@/components/shared/geo-avatar'

/**
 * Geo's line (DESIGN.md component 2): Geo speaking, in Geo's voice, beside its avatar (the app icon in miniature) so the
 * expression reads at a glance. `pose` is what the line means (speak, up for a good week or a best, down for a miss);
 * the bar makes one turn into it as the screen opens, `nudge` steps out and back for something new, `thinking` orbits.
 * Two lines at most. With `onOpen` the line is the way into Geo; `action` sits under it as a text button.
 */
export function GeoLine({ children, onOpen, action, thinking = false, pose = 'speak', nudge = false }: { children: ReactNode; onOpen?: () => void; action?: ReactNode; thinking?: boolean; pose?: GeoPose; nudge?: boolean }) {
  const line = (
    <span className="flex items-center gap-3">
      <span role="img" aria-label="Geo" className="grid size-9 shrink-0 place-items-center rounded-full bg-ink">
        <GeoMark size={26} tone="cream" pose={pose} working={thinking} nudge={nudge} done={!thinking && !nudge} />
      </span>
      <span className="line-clamp-2 text-[17px] font-medium leading-[1.42] tracking-[-0.2px] text-ink">{children}</span>
    </span>
  )
  return (
    <div className="py-4">
      {onOpen ? (
        <button type="button" onClick={onOpen} className="block w-full text-left transition-opacity active:opacity-60">{line}</button>
      ) : line}
      {action ? <div className="mt-1 pl-12">{action}</div> : null}
    </div>
  )
}
