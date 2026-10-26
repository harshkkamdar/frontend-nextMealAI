'use client'

import { useDrawn } from './parts'

interface SegmentsBarProps {
  total: 7
  filled: number
  label: string
}

/** Seven day segments; filled ones grow in from the left, 40 ms apart, once per visit (motion-feel 3f). */
export function SegmentsBar({ total, filled, label }: SegmentsBarProps) {
  const drawn = useDrawn()
  const filledCount = Math.max(0, Math.min(total, filled))

  return (
    <div className="flex gap-1" role="img" aria-label={label}>
      {Array.from({ length: total }, (_, index) => (
        <span key={index} aria-hidden="true" className="relative h-[6px] flex-1 overflow-hidden rounded-full bg-ink-06">
          {index < filledCount ? (
            <span
              className="absolute inset-0 origin-left rounded-full bg-ink transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)]"
              style={{ transform: `scaleX(${drawn ? 1 : 0})`, transitionDelay: `${200 + index * 40}ms` }}
            />
          ) : null}
        </span>
      ))}
    </div>
  )
}
