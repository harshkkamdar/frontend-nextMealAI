'use client'

import { useState, type ReactNode } from 'react'
import { Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { PrimaryButton } from '@/components/ui/fiqr/primary-button'
import { createLog } from '@/lib/api/logs.api'
import { haptic } from '@/lib/platform/app'
import { cn } from '@/lib/utils'

export type QuickLogType = 'water' | 'mood' | 'sleep' | 'energy' | 'weight' | null

function Title({ children }: { children: ReactNode }) {
  return <h2 className="font-wide text-[22px] font-bold leading-tight text-ink">{children}</h2>
}

function Stepper({ value, unit, onChange, step = 1, min = 0, max = 99, format = String }: {
  value: number
  unit: string
  onChange: (next: number) => void
  step?: number
  min?: number
  max?: number
  format?: (n: number) => string
}) {
  const set = (next: number) => {
    const clamped = Math.min(max, Math.max(min, Math.round(next * 10) / 10))
    if (clamped !== value) void haptic('selection')
    onChange(clamped)
  }
  const button = 'grid size-14 place-items-center rounded-full bg-card text-ink shadow-[var(--shadow-card)] transition-transform active:scale-[.94] disabled:opacity-40'
  return (
    <div className="flex items-center justify-center gap-8 py-2">
      <button type="button" aria-label={`Less ${unit}`} disabled={value <= min} onClick={() => set(value - step)} className={button}><Minus className="size-5" /></button>
      <div className="min-w-24 text-center">
        <span className="font-wide text-[40px] font-[750] leading-none text-ink tabular-nums" aria-live="polite">{format(value)}</span>
        <p className="mt-1 text-[13px] font-semibold text-ink-65">{unit}</p>
      </div>
      <button type="button" aria-label={`More ${unit}`} disabled={value >= max} onClick={() => set(value + step)} className={button}><Plus className="size-5" /></button>
    </div>
  )
}

function Scale({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-5 gap-2">
      {Array.from({ length: 10 }, (_, index) => index + 1).map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={n === value}
          onClick={() => { void haptic('selection'); onChange(n) }}
          className={cn('h-12 rounded-[14px] text-[16px] font-semibold tabular-nums transition-transform active:scale-[.94]', n === value ? 'bg-ink text-cream' : 'bg-card text-ink shadow-[var(--shadow-card)]')}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

function useSave(onDone: () => void) {
  const [saving, setSaving] = useState(false)
  const save = async (input: Parameters<typeof createLog>[0], success: string, failure: string) => {
    setSaving(true)
    try {
      await createLog(input)
      void haptic('success')
      toast.success(success)
      onDone()
    } catch {
      toast.error(failure)
    } finally {
      setSaving(false)
    }
  }
  return { saving, save }
}

function SaveButton({ saving, disabled, onClick }: { saving: boolean; disabled?: boolean; onClick: () => void }) {
  return <PrimaryButton type="button" disabled={saving || disabled} onClick={onClick} className="justify-center">{saving ? 'Saving…' : 'Save'}</PrimaryButton>
}

function WaterSheet({ onDone }: { onDone: () => void }) {
  const [glasses, setGlasses] = useState(1)
  const { saving, save } = useSave(onDone)
  return (
    <>
      <Title>Water</Title>
      <Stepper value={glasses} unit={glasses === 1 ? 'glass' : 'glasses'} min={1} max={20} onChange={setGlasses} />
      <SaveButton saving={saving} onClick={() => void save({ type: 'water', payload: { glasses }, source: 'manual' }, 'Water logged', "Couldn't log water. Try again.")} />
    </>
  )
}

function MoodEnergySheet({ type, onDone }: { type: 'mood' | 'energy'; onDone: () => void }) {
  const [rating, setRating] = useState(0)
  const { saving, save } = useSave(onDone)
  const title = type === 'mood' ? 'Mood' : 'Energy'
  return (
    <>
      <Title>{title}</Title>
      <p className="-mt-2 text-[15px] text-ink-65">{type === 'mood' ? 'How are you feeling, 1 to 10?' : 'How much energy do you have, 1 to 10?'}</p>
      <Scale value={rating} onChange={setRating} label={`${title} from 1 to 10`} />
      <SaveButton saving={saving} disabled={!rating} onClick={() => void save({ type, payload: { rating }, source: 'manual' }, `${title} logged`, `Couldn't log ${title.toLowerCase()}. Try again.`)} />
    </>
  )
}

function SleepSheet({ onDone }: { onDone: () => void }) {
  const [hours, setHours] = useState(7.5)
  const [quality, setQuality] = useState(0)
  const { saving, save } = useSave(onDone)
  return (
    <>
      <Title>Last night</Title>
      <Stepper value={hours} unit="hours asleep" step={0.5} min={0.5} max={16} onChange={setHours} format={(n) => n.toFixed(1)} />
      <div>
        <p className="mb-2 text-[13px] font-semibold text-ink-65">How well did you sleep?</p>
        <Scale value={quality} onChange={setQuality} label="Sleep quality from 1 to 10" />
      </div>
      <SaveButton saving={saving} disabled={!quality} onClick={() => void save({ type: 'sleep', payload: { hours, quality_rating: quality }, source: 'manual' }, 'Sleep logged', "Couldn't log sleep. Try again.")} />
    </>
  )
}

function WeightSheet({ currentWeight, onDone }: { currentWeight?: number; onDone: () => void }) {
  const [kg, setKg] = useState(currentWeight ? String(currentWeight) : '')
  const { saving, save } = useSave(onDone)
  const value = Number(kg)
  const valid = Number.isFinite(value) && value >= 20 && value <= 400
  return (
    <>
      <Title>Weight</Title>
      <label className="flex h-16 items-center gap-2 rounded-[18px] bg-card px-5 shadow-[var(--shadow-card)]">
        <span className="sr-only">Weight in kilograms</span>
        <input
          inputMode="decimal"
          autoFocus
          placeholder="75.0"
          value={kg}
          onChange={(event) => setKg(event.target.value.replace(',', '.'))}
          className="font-wide h-full min-w-0 flex-1 bg-transparent text-[28px] font-bold text-ink outline-none placeholder:text-ink-35 tabular-nums"
        />
        <span className="text-[15px] font-semibold text-ink-65">kg</span>
      </label>
      <SaveButton saving={saving} disabled={!valid} onClick={() => void save({ type: 'weight', payload: { weight_kg: value }, source: 'manual' }, 'Weight logged', "Couldn't log weight. Try again.")} />
    </>
  )
}

/** Home's one-tap logs for the tiles (water, weight, sleep) and mood or energy. */
export function QuickLogSheet({ type, onDone, onClose, currentWeight }: {
  type: QuickLogType
  onDone: () => void
  onClose: () => void
  currentWeight?: number
}) {
  return (
    <BottomSheet open={type !== null} onClose={onClose} ariaLabel={type ? `Log ${type}` : 'Quick log'}>
      <div className="flex flex-col gap-5 px-5 pb-5 pt-3">
        {type === 'water' ? <WaterSheet onDone={onDone} /> : null}
        {type === 'mood' || type === 'energy' ? <MoodEnergySheet type={type} onDone={onDone} /> : null}
        {type === 'sleep' ? <SleepSheet onDone={onDone} /> : null}
        {type === 'weight' ? <WeightSheet currentWeight={currentWeight} onDone={onDone} /> : null}
      </div>
    </BottomSheet>
  )
}
