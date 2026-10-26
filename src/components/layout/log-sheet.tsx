'use client'

import { useEffect, useRef, useState, type ComponentType, type SVGProps } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'framer-motion'
import {
  ArrowUpIcon,
  CameraFill,
  EnergyFill,
  MenuFill,
  MoodFill,
  SearchFill,
  SleepFill,
  TrainFill,
  WaterFill,
  WeightFill,
} from '@/components/ui/fiqr/icons'
import { reducedFade, spring } from '@/lib/motion'
import { haptic } from '@/lib/platform/app'
import { useUIStore } from '@/stores/ui.store'
import { LOG_SHEET, ORB_SURFACE } from './tab-bar'

const MENU_PROMPT = 'Scan this menu and suggest what fits my remaining macros'

type Method = { label: string; icon: ComponentType<SVGProps<SVGSVGElement>>; href: () => string }

const METHODS: Method[] = [
  { label: 'Photo', icon: CameraFill, href: () => '/logs/new/food?photo=1' },
  { label: 'Menu', icon: MenuFill, href: () => `/chat/session?id=${crypto.randomUUID()}&prefill=${encodeURIComponent(MENU_PROMPT)}` },
  { label: 'Search', icon: SearchFill, href: () => '/logs/new/food' },
  { label: 'Weight', icon: WeightFill, href: () => '/logs/new/weight' },
  { label: 'Water', icon: WaterFill, href: () => '/logs/new/water' },
  { label: 'Sleep', icon: SleepFill, href: () => '/logs/new/sleep' },
  { label: 'Mood', icon: MoodFill, href: () => '/logs/new/mood' },
  { label: 'Energy', icon: EnergyFill, href: () => '/logs/new/energy' },
  { label: 'Workout', icon: TrainFill, href: () => '/logs/new/workout' },
]

/**
 * The orb's sheet (Q9, D4): tell Geo in words, or pick one of the existing log methods.
 * The panel morphs out of the orb on the lens spring and stays solid (a glass layer let Home's numbers show through
 * between the tiles). Drag down past a quarter of its height, or flick, to close.
 */
export function LogSheet() {
  const router = useRouter()
  const reduce = useReducedMotion()
  const open = useUIStore((state) => state.activeSheet === LOG_SHEET)
  const [text, setText] = useState('')
  const panel = useRef<HTMLDivElement>(null)

  const close = () => useUIStore.getState().closeSheet()
  const go = (href: string) => {
    close()
    router.push(href)
  }

  useEffect(() => {
    if (!open) return
    panel.current?.focus({ preventScroll: true })
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const tellGeo = () => {
    const message = text.trim()
    if (!message) return
    void haptic('light')
    setText('')
    go(`/chat/session?id=${crypto.randomUUID()}&prefill=${encodeURIComponent(message)}&send=1`)
  }

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const height = panel.current?.offsetHeight ?? 600
    if (info.offset.y > height * 0.25 || info.velocity.y > 400) close()
  }

  // Content enters after the surface starts to grow: field at 80 ms, grid from 110 ms at 25 ms apart.
  const item = (delay: number) => (reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: reducedFade }
    : { initial: { opacity: 0, scale: 0.92 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, transition: { duration: 0.1 } }, transition: { ...spring.glide, delay } })

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            key="dim"
            aria-hidden="true"
            className="fixed inset-0 z-[60] bg-ink/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
          />
          <motion.div
            key="panel"
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label="Log something"
            tabIndex={-1}
            layoutId={reduce ? undefined : ORB_SURFACE}
            transition={spring.lens}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.08, bottom: 0.6 }}
            onDragEnd={onDragEnd}
            style={{ borderRadius: 38 }}
            className="fixed inset-x-2 z-[70] mx-auto max-w-[calc(28rem-16px)] overflow-hidden bg-[rgba(253,246,236,.98)] shadow-[var(--shadow-glass)] outline-none bottom-[var(--nav-clearance)]"
          >
            <div className="relative px-5 pb-[88px] pt-3">
              <span aria-hidden="true" className="mx-auto mb-3 block h-[5px] w-9 rounded-full bg-ink-20" />
              <motion.div {...item(0.08)} className="origin-top">
                <p className="text-[15px] font-semibold text-ink-65">Tell Geo, or pick one</p>
                <form
                  className="mt-3 flex h-14 items-center gap-1.5 rounded-full bg-card pl-5 pr-1.5 shadow-[var(--shadow-card)]"
                  onSubmit={(event) => { event.preventDefault(); tellGeo() }}
                >
                  <input
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="What did you eat?"
                    aria-label="Tell Geo what you ate or did"
                    enterKeyHint="send"
                    className="h-full min-w-0 flex-1 bg-transparent text-[17px] text-ink outline-none placeholder:text-ink-65"
                  />
                  {text.trim() ? (
                    <button type="submit" aria-label="Send to Geo" className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-cream transition-transform active:scale-[.94]">
                      <ArrowUpIcon className="size-5" />
                    </button>
                  ) : (
                    <button type="button" aria-label="Log with a photo" onClick={() => go(METHODS[0].href())} className="grid size-11 shrink-0 place-items-center rounded-full bg-ink-06 text-ink transition-transform active:scale-[.94]">
                      <CameraFill className="size-5" />
                    </button>
                  )}
                </form>
              </motion.div>

              <ul className="mt-6 grid grid-cols-3 gap-x-3 gap-y-5">
                {METHODS.map(({ label, icon: Icon, href }, index) => (
                  <motion.li key={label} {...item(0.11 + index * 0.025)}>
                    <button
                      type="button"
                      onClick={() => { void haptic('selection'); go(href()) }}
                      className="group flex w-full flex-col items-center gap-2"
                    >
                      <span className="grid size-[60px] place-items-center rounded-full bg-card text-ink shadow-[var(--shadow-card)] transition-transform group-active:scale-[.94]">
                        <Icon className="size-6" />
                      </span>
                      <span className="text-[14px] font-medium text-ink">{label}</span>
                    </button>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
