'use client'

import { useEffect, useMemo, useRef, useState, type ComponentType, type SVGProps } from 'react'
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
import { logWithUndo } from '@/components/dashboard/log-with-undo'
import { mealForTime } from '@/components/logs/log-math'
import { getPersonalFoods } from '@/lib/api/foods.api'
import { useSheetDepth } from '@/lib/depth'
import { formatMacroKcal } from '@/lib/macros'
import { reducedFade, spring } from '@/lib/motion'
import { haptic } from '@/lib/platform/app'
import { useOnline } from '@/lib/platform/network'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useUIStore } from '@/stores/ui.store'
import type { UserFood } from '@/types/foods.types'
import { LOG_SHEET, ORB_SURFACE } from './tab-bar'

const MENU_PROMPT = 'Scan this menu and suggest what fits my remaining macros'

type Method = { label: string; icon: ComponentType<SVGProps<SVGSVGElement>>; href: () => string; online?: boolean }

const PHOTO: Method = { label: 'Photo', icon: CameraFill, href: () => '/logs/new/food?photo=1', online: true }
const FOOD_METHODS: Method[] = [
  PHOTO,
  { label: 'Search', icon: SearchFill, href: () => '/logs/new/food' },
  { label: 'Menu', icon: MenuFill, href: () => `/chat/session?id=${crypto.randomUUID()}&prefill=${encodeURIComponent(MENU_PROMPT)}`, online: true },
]
const QUICK_METHODS: Method[] = [
  { label: 'Water', icon: WaterFill, href: () => '/logs/new/water' },
  { label: 'Weight', icon: WeightFill, href: () => '/logs/new/weight' },
  { label: 'Sleep', icon: SleepFill, href: () => '/logs/new/sleep' },
  { label: 'Mood', icon: MoodFill, href: () => '/logs/new/mood' },
  { label: 'Energy', icon: EnergyFill, href: () => '/logs/new/energy' },
  { label: 'Workout', icon: TrainFill, href: () => '/logs/new/workout' },
]

/** Recently used foods first, the "Log again" row (journey-log A2). */
const againFoods = (foods: UserFood[]) => foods
  .filter((food) => food.last_used_at)
  .sort((a, b) => new Date(b.last_used_at!).getTime() - new Date(a.last_used_at!).getTime())
  .slice(0, 8)

/**
 * The orb's sheet (journey-log A2): tell Geo in words, log a usual food again in one tap, or pick a way to log.
 * The panel morphs out of the orb on the lens spring and stays solid (a glass layer let Home's numbers show through
 * between the tiles). Drag down past a quarter of its height, or flick, to close.
 */
export function LogSheet() {
  const router = useRouter()
  const reduce = useReducedMotion()
  const open = useUIStore((state) => state.activeSheet === LOG_SHEET)
  const [text, setText] = useState('')
  const panel = useRef<HTMLDivElement>(null)
  // The screen behind steps back while the sheet is up and follows a drag down (the route frame moves it).
  const depth = useSheetDepth(open)
  const online = useOnline()
  const [foods, setFoods] = useState<UserFood[] | null>(null)
  const again = useMemo(() => againFoods(foods ?? []), [foods])
  // eslint-disable-next-line react-hooks/exhaustive-deps -- the meal is read again each time the sheet opens
  const meal = useMemo(() => mealForTime(new Date()), [open])

  // Fresh foods and meal each time the sheet opens; the last list stays up meanwhile (and offline).
  useEffect(() => {
    if (!open) return
    let alive = true
    getPersonalFoods().then((next) => { if (alive) setFoods(next) }, () => { if (alive) setFoods((current) => current ?? []) })
    return () => { alive = false }
  }, [open])

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

  // One tap logs one serving of a usual food to the current meal, with Undo (journey-log A2).
  const logAgain = (food: UserFood) => {
    void haptic('selection')
    close()
    void logWithUndo(
      {
        type: 'food',
        source: 'manual',
        payload: {
          food_name: food.name,
          quantity_g: food.serving_size_g || undefined,
          est_macros: food.macros_per_serving,
          meal_type: meal.toLowerCase(),
          user_food_id: food.id,
        },
      },
      `Logged ${food.name} to ${meal}`,
      () => {},
      () => {},
    )
  }

  const onDrag = (_: unknown, info: PanInfo) => {
    const height = panel.current?.offsetHeight ?? 600
    depth.drag(1 - Math.max(0, info.offset.y) / height)
  }
  const onDragEnd = (_: unknown, info: PanInfo) => {
    const height = panel.current?.offsetHeight ?? 600
    if (info.offset.y > height * 0.25 || info.velocity.y > 400) close()
    else depth.settle(true, -info.velocity.y / height)
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
            onDrag={onDrag}
            onDragEnd={onDragEnd}
            style={{ borderRadius: 38 }}
            className="fixed inset-x-2 z-[70] mx-auto max-w-[calc(28rem-16px)] overflow-hidden bg-[rgba(253,246,236,.98)] shadow-[var(--shadow-glass)] outline-none bottom-[var(--nav-clearance)]"
          >
            <div className="relative px-4 pb-[88px] pt-3">
              <span aria-hidden="true" className="mx-auto mb-3 block h-[5px] w-9 rounded-full bg-ink-20" />
              {!online ? (
                <p role="status" className="mb-3 flex min-h-11 items-center gap-2.5 rounded-[14px] bg-ink px-4 py-2.5 text-[14px] font-medium leading-snug text-cream">
                  <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-cream/60" />
                  Offline. Logs save here and send when you are back.
                </p>
              ) : null}
              <motion.div {...item(0.08)} className="origin-top">
                <form
                  className="flex h-field items-center gap-1 rounded-full bg-[var(--surface-card)] pl-[18px] pr-2 shadow-[0_0_0_1px_rgba(17,28,53,.1)] focus-within:shadow-[0_0_0_1.5px_var(--color-ink)]"
                  onSubmit={(event) => { event.preventDefault(); tellGeo() }}
                >
                  <input
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="What did you eat?"
                    aria-label="Tell Geo what you ate or did"
                    enterKeyHint="send"
                    className="h-full min-w-0 flex-1 bg-transparent text-body font-medium text-ink caret-accent outline-none placeholder:text-ink-65"
                  />
                  {text.trim() ? (
                    <button type="submit" aria-label="Send to Geo" className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-cream transition-transform active:scale-[.94]">
                      <ArrowUpIcon className="size-5" />
                    </button>
                  ) : (
                    <button type="button" aria-label="Log with a photo" disabled={!online} onClick={() => go(PHOTO.href())} className="grid size-11 shrink-0 place-items-center rounded-full bg-ink-06 text-ink transition-transform active:scale-[.94] disabled:text-ink-35">
                      <CameraFill className="size-5" />
                    </button>
                  )}
                </form>
              </motion.div>

              <motion.div {...item(0.1)} className="origin-top">
                <p className="mb-2 mt-4 px-1 text-label text-ink-65">{again.length ? `Log again · ${meal}` : 'Log again'}</p>
                {again.length ? (
                  // The row scrolls sideways from the sheet edge, so it opts out of swipe-back.
                  <ul data-no-swipe-back aria-label={`Log again to ${meal}`} className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 pt-0.5">
                    {again.map((food) => (
                      <li key={food.id} className="shrink-0 snap-start">
                        <button
                          type="button"
                          onClick={() => logAgain(food)}
                          aria-label={`Log ${food.name} again, ${formatMacroKcal(food.macros_per_serving.calories)} kcal`}
                          className="flex min-h-[72px] w-[156px] flex-col justify-between gap-1 rounded-bento card-glass px-3 py-2.5 text-left transition-transform active:scale-[.96]"
                        >
                          <b className="line-clamp-2 text-body-sm font-semibold leading-[1.2] text-ink">{food.name}</b>
                          <span className="text-caption text-ink-65 tabular-nums">{food.serving_size_g || 100} g · {formatMacroKcal(food.macros_per_serving.calories)} kcal</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : foods ? (
                  <p className="px-1 text-caption text-ink-65">Foods you log land here, so a usual {meal.toLowerCase()} is one tap.</p>
                ) : (
                  <div aria-hidden="true" className="flex gap-2">{[0, 1].map((n) => <span key={n} className="h-[72px] w-[156px] animate-pulse rounded-bento bg-ink-06 [animation-duration:1.2s]" />)}</div>
                )}
              </motion.div>

              <ul className="mt-4 grid grid-cols-3 gap-2">
                {FOOD_METHODS.map(({ label, icon: Icon, href, online: needsNet }, index) => {
                  const off = needsNet && !online
                  return (
                    <motion.li key={label} {...item(0.12 + index * 0.025)}>
                      <button
                        type="button"
                        aria-disabled={off || undefined}
                        onClick={() => {
                          if (off) { toast(`${label} needs a connection`); return }
                          void haptic('selection')
                          go(href())
                        }}
                        className={cn('flex h-[72px] w-full flex-col items-center justify-center gap-1.5 rounded-bento bg-ink-04 text-[13px] font-semibold transition-transform active:scale-[.95]', off ? 'text-ink-35' : 'text-ink')}
                      >
                        <Icon aria-hidden="true" className="size-5" />
                        {label}
                      </button>
                    </motion.li>
                  )
                })}
              </ul>
              <ul className="mt-2 grid grid-cols-3 gap-2">
                {QUICK_METHODS.map(({ label, icon: Icon, href }, index) => (
                  <motion.li key={label} {...item(0.2 + index * 0.02)}>
                    <button
                      type="button"
                      onClick={() => { void haptic('selection'); go(href()) }}
                      className="flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-ink-04 text-[13px] font-semibold text-ink transition-transform active:scale-[.95]"
                    >
                      <Icon aria-hidden="true" className="size-[18px]" />
                      {label}
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
