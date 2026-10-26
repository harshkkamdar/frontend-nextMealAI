'use client'

import { useState, type ComponentType, type SVGProps } from 'react'
import { useRouter } from 'next/navigation'
import { BottomSheet } from '@/components/ui/bottom-sheet'
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
import { haptic } from '@/lib/platform/app'
import { useUIStore } from '@/stores/ui.store'
import { LOG_SHEET } from './tab-bar'

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

/** The orb's sheet (Q9, D4): tell Geo in words, or pick one of the existing log methods. */
export function LogSheet() {
  const router = useRouter()
  const open = useUIStore((state) => state.activeSheet === LOG_SHEET)
  const [text, setText] = useState('')

  const close = () => useUIStore.getState().closeSheet()
  const go = (href: string) => {
    close()
    router.push(href)
  }

  const tellGeo = () => {
    const message = text.trim()
    if (!message) return
    void haptic('light')
    setText('')
    go(`/chat/session?id=${crypto.randomUUID()}&prefill=${encodeURIComponent(message)}&send=1`)
  }

  return (
    <BottomSheet open={open} onClose={close} ariaLabel="Log something">
      <div className="px-5 pb-[88px] pt-3">
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

        <ul className="mt-6 grid grid-cols-3 gap-x-3 gap-y-5">
          {METHODS.map(({ label, icon: Icon, href }, index) => (
            <li key={label} className="rise" style={{ ['--i' as string]: index }}>
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
            </li>
          ))}
        </ul>
      </div>
    </BottomSheet>
  )
}
