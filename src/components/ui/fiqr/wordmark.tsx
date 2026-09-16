export function Wordmark({ size = 30, reversed = false }: { size?: number; reversed?: boolean }) {
  const markColor = reversed ? '#FDF6EC' : '#111C35'

  return (
    <div className="flex items-center gap-[9px]">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width={size} aria-hidden="true">
        <circle cx="50" cy="50" r="41" fill="none" stroke={markColor} strokeWidth="9" />
        <line x1="67" y1="67" x2="91" y2="91" stroke="#E8622A" strokeWidth="9" strokeLinecap="round" />
      </svg>
      <span className={`text-[15px] font-bold tracking-[2.2px] ${reversed ? 'text-cream' : 'text-ink'}`}>
        FIQR
      </span>
    </div>
  )
}
