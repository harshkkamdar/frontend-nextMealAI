'use client'

import { Drawer } from 'vaul'
import { useEffect, useState, type ReactNode } from 'react'

export interface BottomSheetProps {
  open: boolean
  onClose: () => void
  /**
   * Resting heights as fractions of the screen, least → most visible
   * (e.g. [0.5, 0.92]). The sheet snaps to the nearest on release, velocity-aware.
   * Omit for a content-sized sheet (just drag-down-to-dismiss) — good for small
   * forms (quick-log, month-view, macro breakdown).
   */
  snapPoints?: (number | string)[]
  /** Which snapPoint to open at (index into snapPoints). Default 0 (smallest). */
  defaultSnapIndex?: number
  /** When false, drag/backdrop/Esc can't close it (use the X button). Default true. */
  dismissible?: boolean
  /** Extra classes on the sheet container. */
  className?: string
  ariaLabel?: string
  children: ReactNode
}

/**
 * The single bottom-sheet primitive for the whole app — built on `vaul`, which
 * handles the hard parts: snap detents, velocity-based snapping, nested
 * scroll-vs-drag coordination, on-screen-keyboard repositioning, focus trap,
 * Escape/backdrop dismiss, and accessibility. Every sheet (food search, Geo
 * chat, quick-log, macro breakdown, month view) renders through this so they all
 * feel identical and live above the bottom nav.
 *
 * Layout contract: the sheet is a `flex flex-col`. Pass a header and a body; the
 * body that should scroll must be `flex-1 min-h-0 overflow-y-auto`.
 */
export function BottomSheet({
  open,
  onClose,
  snapPoints,
  defaultSnapIndex = 0,
  dismissible = true,
  className = '',
  ariaLabel,
  children,
}: BottomSheetProps) {
  const initial = snapPoints ? snapPoints[defaultSnapIndex] : null
  const [snap, setSnap] = useState<number | string | null>(initial)

  // Reset to the default detent each time it opens.
  useEffect(() => {
    if (open && snapPoints) setSnap(snapPoints[defaultSnapIndex])
  }, [open, snapPoints, defaultSnapIndex])

  const hasSnaps = !!snapPoints && snapPoints.length > 0

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(o) => { if (!o) onClose() }}
      snapPoints={snapPoints}
      activeSnapPoint={hasSnaps ? snap : undefined}
      setActiveSnapPoint={hasSnaps ? setSnap : undefined}
      dismissible={dismissible}
      repositionInputs
      modal
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[60] bg-black/40" />
        <Drawer.Content
          aria-label={ariaLabel}
          className={`fixed bottom-0 left-0 right-0 z-[70] flex flex-col bg-background rounded-t-3xl outline-none ${hasSnaps ? 'h-full max-h-[97%]' : 'max-h-[92%]'} ${className}`}
        >
          <Drawer.Handle className="!w-10 !h-1.5 !bg-border !mt-3 !mb-1 shrink-0" />
          {children}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
