import type { ReactNode } from 'react'
import { GeoLine } from './geo-line'
import { SecondaryButton } from './secondary-button'

/** Load failure: Geo says what went wrong, one way to retry. Distinct from an empty state. */
export function ErrorState({ children, onRetry }: { children: ReactNode; onRetry?: () => void }) {
  return (
    <div role="alert" className="mt-2">
      <GeoLine>{children}</GeoLine>
      {onRetry ? <SecondaryButton type="button" onClick={onRetry}>Try again</SecondaryButton> : null}
    </div>
  )
}
