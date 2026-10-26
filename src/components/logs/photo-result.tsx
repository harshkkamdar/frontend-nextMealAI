'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Minus, Plus, RotateCcw, X } from 'lucide-react'
import { toast } from 'sonner'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { estimateFoodFromPhoto, logFromEstimate, type FoodEstimate } from '@/lib/api/foods.api'
import { updateLog } from '@/lib/api/logs.api'
import { OfflineError } from '@/lib/api/client'
import { compressImage } from '@/lib/image/compress'
import { formatMacroKcal } from '@/lib/macros'
import { reducedFade, spring } from '@/lib/motion'
import { haptic } from '@/lib/platform/app'
import { useOnline } from '@/lib/platform/network'
import { cn } from '@/lib/utils'
import { ApiException } from '@/types/api.types'
import type { Log } from '@/types/logs.types'
import { CARD, LIST } from './log-ui'
import { MacroDots } from './food-item-sheet'
import { estimateEdits, photoItemMacros, photoItemsFrom, photoTotals, stepItem, UNSURE, type Meal, type PhotoItem } from './log-math'

type Phase = 'reading' | 'result' | 'nofood' | 'down' | 'expired' | 'offline'

const MUTED_BTN = 'flex h-11 w-full items-center justify-center rounded-full bg-ink-06 text-body-sm font-semibold text-ink transition-transform active:scale-[.97]'

/**
 * The photo result (journey-log C2): the backend's estimate as one row per item with its own grams stepper, and
 * "Not sure, check this" under any item the backend is unsure of. Logging sends the edits through log-from-estimate,
 * then files the log under the chosen meal. Reading, no food, reading down, expired and offline each get one card.
 */
export function PhotoResult({ file, meal, onRetake, onSearch, onGeo, onLogged }: {
  file: File
  meal: Meal
  onRetake: () => void
  onSearch: () => void
  onGeo: () => void
  onLogged: () => void
}) {
  const reduce = useReducedMotion()
  const online = useOnline()
  const url = useMemo(() => URL.createObjectURL(file), [file])
  useEffect(() => () => URL.revokeObjectURL(url), [url])
  const [phase, setPhase] = useState<Phase>(online ? 'reading' : 'offline')
  const [estimate, setEstimate] = useState<FoodEstimate | null>(null)
  const [items, setItems] = useState<PhotoItem[]>([])
  const [attempt, setAttempt] = useState(0)
  const [logging, setLogging] = useState(false)

  useEffect(() => {
    if (phase !== 'reading') return
    let alive = true
    ;(async () => {
      try {
        const next = await estimateFoodFromPhoto(await compressImage(file))
        if (!alive) return
        if (next.error === 'no_food_identified' || next.items.length === 0) { setPhase('nofood'); return }
        setEstimate(next)
        setItems(photoItemsFrom(next))
        setPhase('result')
      } catch (error) {
        if (alive) setPhase(error instanceof OfflineError ? 'offline' : 'down')
      }
    })()
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reads once per attempt
  }, [attempt])

  const kept = items.filter((item) => !item.removed)
  const totals = photoTotals(items)

  const log = async () => {
    if (!estimate || kept.length === 0 || logging) return
    if (estimate.expires_at && Date.parse(estimate.expires_at) < Date.now()) { setPhase('expired'); return }
    setLogging(true)
    try {
      const res = await logFromEstimate(estimate.estimate_id, estimateEdits(estimate, items)) as { log?: Log } | undefined
      // log-from-estimate takes no meal; file it under the chosen one (a failure here leaves the log in place).
      if (res?.log?.id) await updateLog(res.log.id, { meal_type: meal.toLowerCase() }).catch(() => {})
      void haptic('success')
      toast.success(`Logged ${kept.length === 1 ? kept[0].name : `${kept.length} items`} to ${meal}`)
      onLogged()
    } catch (error) {
      if (error instanceof ApiException && error.error === 'estimate_expired') setPhase('expired')
      else if (error instanceof ApiException && error.error === 'estimate_already_used') { toast.success('Already logged'); onLogged() }
      else toast.error("Couldn't log that. Check your connection and try again.")
    } finally {
      setLogging(false)
    }
  }

  const set = (index: number, next: PhotoItem) => {
    void haptic('selection')
    setItems((current) => current.map((item, i) => (i === index ? next : item)))
  }

  const enter = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: reducedFade }
    : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, transition: { duration: 0.12 } }, transition: spring.glide }

  const thumb = (size: string) => <img src={url} alt="Your photo" className={cn('shrink-0 rounded-[14px] object-cover', size)} />

  return (
    <div className="pb-[calc(96px+var(--safe-bottom))]">
      <AnimatePresence mode="popLayout" initial={false}>
        {phase === 'reading' ? (
          <motion.div key="reading" role="status" {...enter} className="space-y-3 pt-2">
            <div className={cn(CARD, 'flex items-center gap-3 p-3')}>
              {thumb('size-16')}
              <div className="min-w-0">
                <p className="text-body font-bold text-ink">Reading your photo</p>
                <p className="text-caption text-ink-65">A few seconds. I&apos;ll fill in what I can see.</p>
              </div>
            </div>
            <div aria-hidden="true" className={LIST}>
              {[62, 48, 54, 44].map((w) => (
                <div key={w} className="flex min-h-row items-center gap-3 border-b border-ink-06 px-4 last:border-b-0">
                  <span className="flex-1 space-y-2">
                    <span className="block h-3 animate-pulse rounded-full bg-ink-06 [animation-duration:1.2s]" style={{ width: `${w}%` }} />
                    <span className="block h-2.5 w-1/3 animate-pulse rounded-full bg-ink-06 [animation-duration:1.2s]" />
                  </span>
                  <span className="h-3 w-10 animate-pulse rounded-full bg-ink-06 [animation-duration:1.2s]" />
                </div>
              ))}
            </div>
          </motion.div>
        ) : phase === 'result' ? (
          <motion.div key="result" {...enter} className="pt-2" data-testid="photo-result">
            <div className={cn(CARD, 'flex items-center gap-3 p-3')}>
              {thumb('size-16')}
              <div>
                <p className="text-caption text-ink-65">About</p>
                <p className="text-ink tabular-nums"><b className="font-display text-hero">{formatMacroKcal(totals.calories)}</b> <span className="text-caption text-ink-65">kcal</span></p>
              </div>
            </div>
            <MacroDots macros={totals} className="mt-3 px-1" />
            {estimate && estimate.confidence < UNSURE ? (
              <p role="note" className="mt-3 rounded-[16px] bg-macro-ochre/15 px-4 py-3 text-body-sm leading-[1.35] text-ink">
                <b className="font-semibold">I&apos;m not sure about this plate.</b> Check the items marked below before you log.
              </p>
            ) : null}
            <p className="mb-2 mt-4 px-1 text-label text-ink-65">{kept.length} item{kept.length === 1 ? '' : 's'} I can see · tap − or + to match what you ate</p>
            <ul className={LIST} aria-label="Items in your photo">
              {items.map((item, index) => {
                const m = photoItemMacros(item)
                const amount = item.baseG ? `${item.amount} g` : `${item.amount}×`
                return (
                  <li key={`${item.name}-${index}`} className="border-b border-ink-06 px-4 pb-2 pt-3 last:border-b-0">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className={`text-body-sm font-semibold leading-snug ${item.removed ? 'text-ink-35 line-through' : 'text-ink'}`}>{item.name}</p>
                        {item.confidence < UNSURE && !item.removed ? <p className="mt-0.5 flex items-center gap-1.5 text-label text-ink-80"><span aria-hidden="true" className="size-1.5 rounded-full bg-macro-ochre" />Not sure, check this</p> : null}
                      </div>
                      <p className={`shrink-0 text-body-sm font-bold tabular-nums ${item.removed ? 'text-ink-35' : 'text-ink'}`}>{formatMacroKcal(m.calories)} <span className="text-label font-medium text-ink-65">kcal</span></p>
                    </div>
                    <div className="mt-1 flex items-center">
                      {item.removed ? (
                        <span className="flex-1 text-caption text-ink-65">Left out</span>
                      ) : (
                        <div className="flex flex-1 items-center gap-1">
                          <button type="button" aria-label={`Less ${item.name}`} onClick={() => set(index, stepItem(item, -1))} className="grid size-11 place-items-center rounded-full bg-ink-06 text-ink transition-transform active:scale-[.92]"><Minus className="size-4" /></button>
                          <span aria-live="polite" className="min-w-16 text-center text-body-sm font-bold text-ink tabular-nums">{amount}</span>
                          <button type="button" aria-label={`More ${item.name}`} onClick={() => set(index, stepItem(item, 1))} className="grid size-11 place-items-center rounded-full bg-ink-06 text-ink transition-transform active:scale-[.92]"><Plus className="size-4" /></button>
                        </div>
                      )}
                      <button
                        type="button"
                        aria-label={item.removed ? `Put ${item.name} back` : `Leave out ${item.name}`}
                        onClick={() => set(index, { ...item, removed: !item.removed })}
                        className="-mr-2 grid size-11 place-items-center rounded-full text-ink-65 transition-transform active:scale-[.92]"
                      >
                        {item.removed ? <RotateCcw className="size-4" /> : <X className="size-4" />}
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </motion.div>
        ) : (
          <motion.div key={phase} {...enter} className="pt-2">
            <div role="status" className={cn(CARD, 'p-4')}>
              {phase === 'nofood' ? thumb('mb-3 size-12') : null}
              <p className="text-headline text-ink">{TITLES[phase]}</p>
              <p className="mt-1 text-caption leading-[1.4] text-ink-65">{BODIES[phase]}</p>
              <div className="mt-4 space-y-2">
                {phase === 'nofood' ? (
                  <>
                    <PrimaryButton type="button" onClick={onRetake}>Take another photo</PrimaryButton>
                    <button type="button" onClick={onSearch} className={MUTED_BTN}>Search instead</button>
                  </>
                ) : phase === 'down' ? (
                  <>
                    <PrimaryButton type="button" onClick={() => { setPhase('reading'); setAttempt((n) => n + 1) }}>Try again</PrimaryButton>
                    <button type="button" onClick={onGeo} className={MUTED_BTN}>Tell Geo instead</button>
                  </>
                ) : phase === 'expired' ? (
                  <PrimaryButton type="button" onClick={onRetake}>Take the photo again</PrimaryButton>
                ) : (
                  <button type="button" onClick={onSearch} className={MUTED_BTN}>Search my foods</button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {phase === 'result' ? (
        <div className="fixed inset-x-0 bottom-0 z-30 pb-[calc(12px+var(--safe-bottom))] pt-3">
          <div className="mx-auto w-full max-w-md px-4">
            <PrimaryButton type="button" onClick={() => void log()} disabled={logging || kept.length === 0} aria-busy={logging} className="shadow-[var(--shadow-action)]">
              {logging ? 'Logging…' : kept.length === 0 ? 'Nothing left to log' : `Log ${kept.length} item${kept.length === 1 ? '' : 's'} to ${meal}`}
            </PrimaryButton>
          </div>
        </div>
      ) : null}
    </div>
  )
}

const TITLES: Record<Exclude<Phase, 'reading' | 'result'>, string> = {
  nofood: 'I can’t see food in this one',
  down: 'Photo reading is down for a minute',
  expired: 'This estimate is over an hour old',
  offline: 'Photos need a connection',
}
const BODIES: Record<Exclude<Phase, 'reading' | 'result'>, string> = {
  nofood: 'Try again with the whole plate in frame and some light on it, or search instead.',
  down: 'Your photo is kept. Try again shortly, or tell Geo what is on the plate.',
  expired: 'Estimates last one hour so old guesses never land in your diary. Take the photo again to log it.',
  // Fallback: the app cannot queue a photo for reading later, so offline points to your saved foods.
  offline: 'Search your own foods now, and take the photo again when you are back online.',
}
