'use client'

import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { deleteFavourite, getFavourites, logFavouriteWithStatus, type Favourite } from '@/lib/api/favourites.api'
import { haptic } from '@/lib/platform/app'
import { ApiException } from '@/types/api.types'
import { toastLogged } from './diet-warning'
import { LIST, SectionTitle } from './log-ui'

/**
 * The meals saved with the diary's "Save as meal": one tap logs the whole meal onto the day and meal being logged.
 * Hidden until there is one. Meals saved for the current meal come first.
 */
export function SavedMeals({ meal, logDate, onLogged, className }: {
  /** "Breakfast" etc., the meal the screen is set to. */
  meal: string
  logDate?: string
  onLogged: () => void
  className?: string
}) {
  const [favourites, setFavourites] = useState<Favourite[]>([])
  const [logging, setLogging] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    getFavourites().then((list) => { if (alive) setFavourites(list) }, () => { /* the section stays hidden */ })
    return () => { alive = false }
  }, [])

  const log = async (f: Favourite) => {
    setLogging(f.id)
    try {
      const result = await logFavouriteWithStatus(f.id, { target_date: logDate, target_meal_type: meal.toLowerCase() })
      void haptic('success')
      if (result.queued) toast.success(`Logged ${f.name}. Saved on your phone, syncs when you're back online`)
      else toastLogged(`Logged ${f.name}, ${result.data.logged} item${result.data.logged === 1 ? '' : 's'}`, [result.data.diet_warning])
      onLogged()
    } catch (error) {
      // Nothing logged (every item refused) is a 400 with the reason.
      toast.error(error instanceof ApiException && error.statusCode < 500 && error.details ? error.details : 'Failed to log meal')
    } finally {
      setLogging(null)
    }
  }

  const remove = async (f: Favourite) => {
    try {
      await deleteFavourite(f.id)
      setFavourites((current) => current.filter((x) => x.id !== f.id))
      toast.success(`Removed ${f.name}`)
    } catch {
      toast.error('Failed to remove meal')
    } finally {
      setConfirmRemove(null)
    }
  }

  if (favourites.length === 0) return null
  const key = meal.toLowerCase()
  const shown = [...favourites].sort((a, b) => Number(b.default_meal_type === key) - Number(a.default_meal_type === key))

  return (
    <section className={className} aria-label="Meals">
      <SectionTitle>Meals</SectionTitle>
      <ul className={LIST}>
        {shown.map((f) => (
          <li key={f.id} className="flex min-h-row items-center border-b border-ink-06 last:border-b-0">
            <button
              type="button"
              onClick={() => void log(f)}
              disabled={logging !== null}
              aria-label={`Log ${f.name}`}
              className="flex min-h-row min-w-0 flex-1 items-center gap-3 py-2 pl-4 pr-1 text-left transition-colors active:bg-ink-04 disabled:opacity-50"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body-sm font-semibold text-ink">{f.name}</span>
                <span className="block truncate text-caption text-ink-65">
                  {f.items.length} item{f.items.length === 1 ? '' : 's'}
                  {f.items.length > 0 ? ` · ${f.items.map((it) => it.food_name).slice(0, 3).join(', ')}${f.items.length > 3 ? '…' : ''}` : ''}
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-caption font-semibold text-ink">
                <Plus aria-hidden="true" className="size-4" />
                {logging === f.id ? 'Logging…' : 'Log'}
              </span>
            </button>
            {confirmRemove === f.id ? (
              <button type="button" onClick={() => void remove(f)} aria-label={`Confirm remove ${f.name}`} className="h-11 shrink-0 rounded-full px-3 text-caption font-semibold text-ink">Remove?</button>
            ) : (
              <button type="button" onClick={() => setConfirmRemove(f.id)} aria-label={`Remove ${f.name}`} className="grid size-11 shrink-0 place-items-center rounded-full text-ink-65">
                <X aria-hidden="true" className="size-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
