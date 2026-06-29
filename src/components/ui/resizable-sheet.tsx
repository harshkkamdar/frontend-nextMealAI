'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react'

/** Bottom-nav bar height (safe-area added in CSS). The sheet rests ABOVE this. */
const NAV_PX = 56

export interface ResizableSheetProps {
  open: boolean
  onClose: () => void
  /**
   * Snap heights as fractions of the area ABOVE the nav, least → most visible
   * (e.g. [0.4, 0.7, 0.94]). Drag the handle to resize; on release the sheet
   * snaps to the nearest. Dragging below the smallest dismisses.
   */
  levels?: number[]
  /** Which level to open at (index into `levels`). Default 0. */
  defaultLevelIndex?: number
  ariaLabel?: string
  children: ReactNode
}

/**
 * Draggable, snap-to-levels bottom sheet.
 *
 * Unlike a translate-based sheet (vaul), this resizes by HEIGHT and is anchored
 * just ABOVE the bottom nav — so (a) the nav (z-[100]) stays the top-most layer
 * and is never covered, (b) the sheet never draws behind the nav at any level,
 * and (c) a pinned footer (e.g. "Log Food") is always visible because the
 * sheet's bottom edge is always at the nav top. Drag the handle up/down to lock
 * it at a level; drag below the smallest level to dismiss.
 */
export function ResizableSheet({
  open,
  onClose,
  levels = [0.5, 0.92],
  defaultLevelIndex = 0,
  ariaLabel,
  children,
}: ResizableSheetProps) {
  const [render, setRender] = useState(false)
  const [shown, setShown] = useState(false)
  const [heightPx, setHeightPx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef({ startY: 0, startH: 0 })

  const avail = useCallback(
    () => (typeof window !== 'undefined' ? window.innerHeight - NAV_PX : 800),
    [],
  )
  const levelsPx = useCallback(() => levels.map((f) => Math.round(f * avail())), [levels, avail])

  useEffect(() => {
    if (open) {
      setRender(true)
      setHeightPx(Math.round((levels[defaultLevelIndex] ?? levels[0]) * avail()))
      requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)))
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
    setShown(false)
    document.body.style.overflow = ''
    const t = setTimeout(() => setRender(false), 260)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!render) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [render, onClose])

  const onPointerDown = (e: ReactPointerEvent) => {
    dragRef.current = { startY: e.clientY, startH: heightPx }
    setDragging(true)
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) } catch { /* noop */ }
  }
  const onPointerMove = (e: ReactPointerEvent) => {
    if (!dragging) return
    const dy = dragRef.current.startY - e.clientY // drag up → taller
    const next = dragRef.current.startH + dy
    setHeightPx(Math.max(40, Math.min(next, Math.round(0.96 * avail()))))
  }
  const endDrag = () => {
    if (!dragging) return
    setDragging(false)
    const pts = levelsPx()
    if (heightPx < pts[0] * 0.55) { onClose(); return }
    const nearest = pts.reduce((a, b) => (Math.abs(b - heightPx) < Math.abs(a - heightPx) ? b : a), pts[0])
    setHeightPx(nearest)
  }

  if (!render) return null

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop stops at the nav top so the nav (z-[100]) stays fully visible. */}
      <div
        onClick={onClose}
        className={`absolute inset-x-0 top-0 bottom-[calc(56px+env(safe-area-inset-bottom,0px))] bg-black/40 transition-opacity duration-200 ${shown ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        style={{ height: heightPx }}
        className={`absolute left-0 right-0 z-[70] bottom-[calc(56px+env(safe-area-inset-bottom,0px))] flex flex-col bg-background rounded-t-3xl shadow-2xl will-change-transform ${dragging ? '' : 'transition-[height,transform] duration-200'} ${shown ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="flex justify-center pt-3 pb-2 shrink-0 cursor-grab active:cursor-grabbing touch-none"
          aria-label="Drag to resize"
        >
          <div className="w-10 h-1.5 rounded-full bg-border" />
        </div>
        {children}
      </div>
    </div>
  )
}
