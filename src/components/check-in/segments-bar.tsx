interface SegmentsBarProps {
  total: 7
  filled: number
  tone: 'ink' | 'muted'
}

export function SegmentsBar({ total, filled, tone }: SegmentsBarProps) {
  const filledCount = Math.max(0, Math.min(total, filled))

  return (
    <div className="flex gap-1" aria-label={`${filledCount} of ${total} segments filled`}>
      {Array.from({ length: total }, (_, index) => (
        <span
          aria-hidden="true"
          className={`h-[5px] flex-1 rounded-[3px] ${
            index < filledCount
              ? tone === 'ink' ? 'bg-ink' : 'bg-ink-35'
              : 'bg-ink-10'
          }`}
          key={index}
        />
      ))}
    </div>
  )
}
