'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Minus, Plus, RotateCcw, X } from 'lucide-react'
import { toast } from 'sonner'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { uploadChatAttachment } from '@/lib/api/chat.api'
import { estimateFoodFromPhoto, logFromEstimate, type FoodEstimate } from '@/lib/api/foods.api'
import { updateLog } from '@/lib/api/logs.api'
import { OfflineError } from '@/lib/api/client'
import { compressImage } from '@/lib/image/compress'
import { formatMacroKcal } from '@/lib/macros'
import { reducedFade, spring } from '@/lib/motion'
import { haptic } from '@/lib/platform/app'
import { useOnline } from '@/lib/platform/network'
import { useComposerStore } from '@/stores/composer.store'
import { cn } from '@/lib/utils'
import { ApiException } from '@/types/api.types'
import { CARD, FIELD, LIST } from './log-ui'
import { MacroDots } from './food-item-sheet'
import { editPhotoMacros, estimateEdits, photoItemMacros, photoItemsFrom, photoTotals, stepItem, UNSURE, type Meal, type PhotoItem } from './log-math'

type Phase = 'reading' | 'result' | 'nofood' | 'down' | 'expired' | 'offline'

const MUTED_BTN = 'flex h-11 w-full items-center justify-center rounded-full bg-ink-06 text-body-sm font-semibold text-ink transition-transform active:scale-[.97]'

/**
 * The photo result (journey-log C2): the backend's estimate as one row per item with its own grams stepper, and
 * "Not sure, check this" under any item the backend is unsure of. Logging sends the edits through log-from-estimate,
 * with the chosen meal and date. Reading, no food, reading down, expired and offline each get one card.
 */
export function PhotoResult({ file, meal, localDate, onRetake, onSearch, onGeo, onLogged }: {
  file: File
  meal: Meal
  localDate?: string
  onRetake: () => void
  onSearch: () => void
  onGeo: () => void
  onLogged: () => void
}) {
  const router = useRouter()
  const reduce = useReducedMotion()
  const online = useOnline()
  // A data URL, not an object URL: nothing to revoke, so a remount (StrictMode) can't leave a dead thumbnail.
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    const reader = new FileReader()
    reader.onload = () => setUrl(String(reader.result))
    reader.readAsDataURL(file)
    return () => reader.abort()
  }, [file])
  const [phase, setPhase] = useState<Phase>(online ? 'reading' : 'offline')
  const [estimate, setEstimate] = useState<FoodEstimate | null>(null)
  const [items, setItems] = useState<PhotoItem[]>([])
  const [attempt, setAttempt] = useState(0)
  const [logging, setLogging] = useState(false)
  const [amountInputs, setAmountInputs] = useState<Record<number, string>>({})
  const [editingItems, setEditingItems] = useState<number[]>([])
  const [context, setContext] = useState('')
  const [askingGeo, setAskingGeo] = useState(false)

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
      const chosenMeal = meal.toLowerCase()
      const res = await logFromEstimate(
        estimate.estimate_id,
        estimateEdits(estimate, items),
        { meal_type: chosenMeal, local_date: localDate },
      ) as { log?: { id: string; payload?: { meal_type?: string } } } | undefined
      let filed = true
      if (res?.log?.id && res.log.payload?.meal_type !== chosenMeal) {
        try {
          await updateLog(res.log.id, { meal_type: chosenMeal })
        } catch {
          filed = false
        }
      }
      void haptic('success')
      if (filed) toast.success(`Logged ${kept.length === 1 ? kept[0].name : `${kept.length} items`} to ${meal}`)
      else toast.error(`Logged, but I couldn't file it under ${meal}. Move it from Food.`)
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
    setItems((current) => current.map((item, i) => (i === index ? next : item)))
  }

  const step = (index: number, item: PhotoItem, direction: 1 | -1) => {
    void haptic('selection')
    const next = stepItem(item, direction)
    set(index, next)
    setAmountInputs((current) => ({ ...current, [index]: String(next.amount) }))
  }

  const askGeo = async () => {
    const details = context.trim()
    if (!details || askingGeo) return
    setAskingGeo(true)
    try {
      const attachment = await compressImage(file)
      const { storage_path } = await uploadChatAttachment(attachment)
      const sessionId = crypto.randomUUID()
      const composer = useComposerStore.getState()
      composer.addAttached(sessionId, { storage_path, preview_url: URL.createObjectURL(attachment), file: attachment })
      composer.setText(sessionId, `Log this to ${meal}: ${details}`)
      router.push(`/chat/session?id=${sessionId}`) // the photo and text wait in the composer for one tap
    } catch {
      toast.error("Couldn't send that photo to Geo. Try again.")
    } finally {
      setAskingGeo(false)
    }
  }

  const enter = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: reducedFade }
    : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, transition: { duration: 0.12 } }, transition: spring.glide }

  const thumb = (size: string) => (url
    ? <img src={url} alt="Your photo" className={cn('shrink-0 rounded-[14px] object-cover', size)} />
    : <span aria-hidden="true" className={cn('shrink-0 rounded-[14px] bg-ink-06', size)} />)

  return (
    <div className="pb-[calc(96px+var(--safe-bottom))]">
      <AnimatePresence mode="popLayout" initial={false}>
        {phase === 'reading' ? (
          <motion.div key="reading" role="status" {...enter} className="space-y-3 pt-4">
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
          <motion.div key="result" {...enter} className="pt-4" data-testid="photo-result">
            <div className={cn(CARD, 'flex items-center gap-3 p-3')}>
              {thumb('size-16')}
              <div>
                <p className="text-caption text-ink-65">About</p>
                <p className="text-ink tabular-nums"><b className="text-hero">{formatMacroKcal(totals.calories)}</b> <span className="text-caption text-ink-65">kcal</span></p>
              </div>
            </div>
            <MacroDots macros={totals} className="mt-3 px-1" />
            {estimate && estimate.confidence < UNSURE ? (
              <p role="note" className="mt-3 rounded-[16px] bg-macro-ochre/15 px-4 py-3 text-body-sm leading-[1.35] text-ink">
                <b className="font-semibold">I&apos;m not sure about this plate.</b> Check the items marked below before you log.
              </p>
            ) : null}
            <p className="mb-2 mt-4 px-1 text-[11.5px] font-semibold uppercase tracking-[1.8px] text-ink-62">{kept.length} item{kept.length === 1 ? '' : 's'} I can see · tap − or + to match what you ate</p>
            <ul className={LIST} aria-label="Items in your photo">
              {items.map((item, index) => {
                const m = photoItemMacros(item)
                return (
                  <li key={`${item.name}-${index}`} className="border-b border-ink-06 px-4 pb-2 pt-3 last:border-b-0">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className={`text-body-sm font-semibold leading-snug ${item.removed ? 'text-ink-65 line-through' : 'text-ink'}`}>{item.name}</p>
                        {item.confidence < UNSURE && !item.removed ? <p className="mt-0.5 flex items-center gap-1.5 text-label font-bold text-ink-80"><span aria-hidden="true" className="size-1.5 rounded-full bg-macro-ochre" />Not sure, check this</p> : null}
                      </div>
                      <p className={`shrink-0 text-body-sm font-bold tabular-nums ${item.removed ? 'text-ink-65' : 'text-ink'}`}>{formatMacroKcal(m.calories)} <span className="text-label font-medium text-ink-65">kcal</span></p>
                    </div>
                    <div className="mt-1 flex items-center">
                      {item.removed ? (
                        <span className="flex-1 text-caption text-ink-65">Left out</span>
                      ) : (
                        <div className="flex flex-1 items-center gap-1">
                          <button type="button" aria-label={`Less ${item.name}`} onClick={() => step(index, item, -1)} className="grid size-11 place-items-center rounded-full bg-ink-06 text-ink transition-transform active:scale-[.92]"><Minus className="size-4" /></button>
                          {item.baseG ? (
                            <label className="flex min-w-16 items-center justify-center gap-1 text-body-sm font-bold text-ink tabular-nums">
                              <input
                                type="number"
                                inputMode="decimal"
                                aria-label={`${item.name}, grams`}
                                value={amountInputs[index] ?? String(item.amount)}
                                onChange={(event) => {
                                  const value = event.target.value
                                  setAmountInputs((current) => ({ ...current, [index]: value }))
                                  const amount = Number(value)
                                  if (amount > 0) set(index, { ...item, amount })
                                }}
                                onBlur={() => {
                                  if (!(Number(amountInputs[index] ?? item.amount) > 0)) {
                                    setAmountInputs((current) => ({ ...current, [index]: String(item.amount) }))
                                  }
                                }}
                                className="w-[5ch] bg-transparent text-right text-body-sm font-bold text-ink outline-none tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span>g</span>
                            </label>
                          ) : (
                            <span aria-live="polite" className="min-w-16 text-center text-body-sm font-bold text-ink tabular-nums">{item.amount}×</span>
                          )}
                          <button type="button" aria-label={`More ${item.name}`} onClick={() => step(index, item, 1)} className="grid size-11 place-items-center rounded-full bg-ink-06 text-ink transition-transform active:scale-[.92]"><Plus className="size-4" /></button>
                        </div>
                      )}
                      <button
                        type="button"
                        aria-label={item.removed ? `Put ${item.name} back` : `Leave out ${item.name}`}
                        onClick={() => { void haptic('selection'); set(index, { ...item, removed: !item.removed }) }}
                        className="-mr-2 grid size-11 place-items-center rounded-full text-ink-65 transition-transform active:scale-[.92]"
                      >
                        {item.removed ? <RotateCcw className="size-4" /> : <X className="size-4" />}
                      </button>
                    </div>
                    {!item.removed && editingItems.includes(index) ? (
                      <div className="mt-2 grid grid-cols-4 gap-2">
                        {(['calories', 'protein', 'carbs', 'fat'] as const).map((key) => (
                          <label key={key} className="rounded-[14px] bg-ink-04 px-2 pb-0.5 pt-2 text-center focus-within:outline focus-within:outline-[1.5px] focus-within:outline-ink">
                            <span className="block text-label text-ink-65">{key === 'calories' ? 'Calories' : `${key.charAt(0).toUpperCase()}${key.slice(1)} g`}</span>
                            <input
                              type="number"
                              inputMode="decimal"
                              aria-label={key === 'calories' ? 'Calories' : `${key.charAt(0).toUpperCase()}${key.slice(1)} g`}
                              value={m[key]}
                              onChange={(event) => set(index, editPhotoMacros(item, { ...m, [key]: Number(event.target.value) || 0 }))}
                              className="h-11 w-full bg-transparent text-center text-body font-bold text-ink outline-none tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </label>
                        ))}
                      </div>
                    ) : !item.removed ? (
                      <button type="button" onClick={() => setEditingItems((current) => [...current, index])} className="-ml-1 min-h-11 px-1 text-body-sm font-semibold text-ink-80 underline decoration-ink-35 underline-offset-4">
                        Edit numbers
                      </button>
                    ) : null}
                  </li>
                )
              })}
            </ul>
            <div className="mt-4">
              <input
                type="text"
                value={context}
                onChange={(event) => setContext(event.target.value)}
                placeholder="Anything Geo should know? Half the plate, cooked in butter"
                aria-label="Add details for Geo"
                className={cn(FIELD, 'h-14')}
              />
              {context.trim() ? (
                <button type="button" onClick={() => void askGeo()} disabled={askingGeo} className="min-h-11 px-1 text-body-sm font-semibold text-ink underline decoration-ink-35 underline-offset-4 disabled:opacity-40">
                  Ask Geo with this photo
                </button>
              ) : null}
            </div>
          </motion.div>
        ) : (
          <motion.div key={phase} {...enter} className="pt-4">
            <div role="status" className={cn(CARD, 'p-4')}>
              {phase === 'nofood' ? thumb('mb-3 size-16') : null}
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

      <AnimatePresence>
      {phase === 'result' ? (
        // Rises in with the result instead of appearing in one frame.
        <motion.div
          key="log"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={reduce ? reducedFade : spring.sheet}
          className="fixed inset-x-0 bottom-0 z-30 pb-[calc(12px+var(--safe-bottom))] pt-3"
        >
          <div className="mx-auto w-full max-w-md px-gutter">
            <PrimaryButton type="button" onClick={() => void log()} disabled={logging || kept.length === 0} aria-busy={logging} className="shadow-[var(--shadow-action)]">
              {logging ? 'Logging…' : kept.length === 0 ? 'Nothing left to log' : `Log ${kept.length} item${kept.length === 1 ? '' : 's'} to ${meal}`}
            </PrimaryButton>
          </div>
        </motion.div>
      ) : null}
      </AnimatePresence>
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
