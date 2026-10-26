'use client'

import { Drawer } from 'vaul'
import { type ReactNode } from 'react'

export interface BottomSheetProps {
  open: boolean
  onClose: () => void
  /** Kept for API compatibility — sheets are content-sized; not used. */
  snapPoints?: (number | string)[]
  defaultSnapIndex?: number
  /** When false, drag/backdrop/Esc can't close it (use the X button). Default true. */
  dismissible?: boolean
  /** Extra classes on the sheet container. */
  className?: string
  ariaLabel?: string
  children: ReactNode
}

/**
 * The single bottom-sheet primitive for the whole app, built on `vaul`.
 *
 * FIQR v2 inset sheet (design-system.md): floats 8 pt in from the screen edges, 38 pt corners, glass
 * material on the controls layer. It covers the tab bar (overlay z 60, sheet z 70; the bar is z 50), so
 * nothing peeks between the sheet and the nav.
 *
 * Sizing: CONTENT-SIZED (grows to fit, capped at 92% of the viewport, then the body scrolls). No snap
 * detents. Drag the handle down to dismiss.
 *
 * Layout contract: the sheet is a `flex flex-col`. Pass a header and a body; a scrollable body must be
 * `flex-1 min-h-0 overflow-y-auto`.
 */
export function BottomSheet({
  open,
  onClose,
  dismissible = true,
  className = '',
  ariaLabel,
  children,
}: BottomSheetProps) {
  return (
    <Drawer.Root
      open={open}
      onOpenChange={(o) => { if (!o) onClose() }}
      dismissible={dismissible}
      repositionInputs
      modal
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[60] bg-ink/30 data-[state=open]:animate-[fiqr-fade-in_280ms_ease-out]" />
        <Drawer.Content
          aria-label={ariaLabel}
          className={`glass-cream fixed inset-x-2 z-[70] mx-auto flex max-w-[calc(28rem-16px)] flex-col rounded-[38px] outline-none bottom-[var(--nav-clearance)] max-h-[calc(92vh-var(--nav-clearance)-var(--safe-top))] ${className}`}
        >
          <Drawer.Handle className="!mx-auto !mt-2.5 !mb-1 !h-[5px] !w-9 shrink-0 !bg-ink-20" />
          {/* Radix/vaul require an accessible title; visually hidden. */}
          <Drawer.Title className="sr-only">{ariaLabel ?? 'Sheet'}</Drawer.Title>
          {children}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
