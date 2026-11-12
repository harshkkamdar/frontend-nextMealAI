import { MarkShapes } from './mark'

export function Wordmark({ size = 30, reversed = false }: { size?: number; reversed?: boolean }) {
  const markColor = reversed ? '#FDF6EC' : '#111C35'

  return (
    <div className="flex items-center gap-[9px]">
      {/* Boxed to the ring, the bar hanging outside it, so the ring centres on the word as in the logo lockup. */}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="14 14 72 72" width={size} height={size} overflow="visible" aria-hidden="true">
        <MarkShapes ring={markColor} />
      </svg>
      <span className={`text-[15px] font-bold tracking-[2.2px] ${reversed ? 'text-cream' : 'text-ink'}`}>
        FIQR
      </span>
    </div>
  )
}
