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
 * The single bottom-sheet primitive for the whole app — built on `vaul`.
 *
 * Layering (CRITICAL): the bottom nav (z-[100]) is the TOP-MOST layer of the
 * app and is never covered. So this sheet sits BELOW it (overlay z-[60], sheet
 * z-[70]) and is lifted to rest just ABOVE the nav (bottom inset = nav height) —
 * it never draws over or behind the nav.
 *
 * Sizing: the sheet is CONTENT-SIZED (grows to fit its content, capped at 88vh
 * then the body scrolls). No fixed-height empty space, no snap detents — snap
 * detents make vaul translate the sheet down to the viewport bottom, which puts
 * its content behind the nav. Drag the handle DOWN to dismiss.
 *
 * Layout contract: the sheet is a `flex flex-col`. Pass a header and a body; a
 * scrollable body must be `flex-1 min-h-0 overflow-y-auto`.
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
        {/* Overlay stops at the nav top, so the nav is never dimmed and stays
            fully on top. */}
        <Drawer.Overlay className="fixed inset-x-0 top-0 z-[60] bg-black/40 bottom-[calc(56px+env(safe-area-inset-bottom,0px))]" />
        <Drawer.Content
          aria-label={ariaLabel}
          className={`fixed left-0 right-0 z-[70] flex flex-col bg-background rounded-t-3xl outline-none bottom-[calc(56px+env(safe-area-inset-bottom,0px))] max-h-[calc(88vh-56px)] ${className}`}
        >
          <Drawer.Handle className="!w-10 !h-1.5 !bg-border !mt-3 !mb-1 shrink-0" />
          {/* Radix/vaul require an accessible title; visually hidden. */}
          <Drawer.Title className="sr-only">{ariaLabel ?? 'Sheet'}</Drawer.Title>
          {children}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
