'use client'

import { useEffect, useState, useCallback } from 'react'
import { Star, X, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { getFavourites, logFavourite, deleteFavourite, type Favourite } from '@/lib/api/favourites.api'

/**
 * Horizontal row of the user's favourite meals. Tap a chip to one-tap log it
 * (today, the favourite's saved meal); the × removes it. Renders nothing when
 * there are no favourites (or the endpoint isn't available yet).
 *
 * `reloadSignal` — bump from the parent (e.g. after "save as favourite") to refetch.
 */
export function FavouritesRow({ reloadSignal = 0, onLogged }: { reloadSignal?: number; onLogged?: () => void }) {
  const [favs, setFavs] = useState<Favourite[]>([])
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const load = useCallback(async () => {
    try { setFavs(await getFavourites()) } catch { /* endpoint unavailable — stay hidden */ } finally { setLoaded(true) }
  }, [])
  useEffect(() => { load() }, [load, reloadSignal])

  if (!loaded || favs.length === 0) return null

  const handleLog = async (f: Favourite) => {
    setBusy(f.id)
    try {
      const r = await logFavourite(f.id)
      toast.success(`Logged ${f.name} — ${r.logged} item${r.logged === 1 ? '' : 's'}`)
      onLogged?.()
    } catch { toast.error('Failed to log favourite') } finally { setBusy(null) }
  }
  const handleDelete = async (f: Favourite) => {
    try {
      await deleteFavourite(f.id)
      setFavs((prev) => prev.filter((x) => x.id !== f.id))
      toast.success(`Removed ${f.name}`)
    } catch { toast.error('Failed to remove') } finally { setConfirmDelete(null) }
  }

  return (
    <div data-testid="favourites-row">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary mb-2 flex items-center gap-1">
        <Star className="w-3 h-3 text-accent fill-accent" /> Favourites
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {favs.map((f) => (
          <div key={f.id} className="shrink-0 flex items-center bg-surface border border-border rounded-full pl-3 pr-1 py-1">
            <button
              onClick={() => handleLog(f)}
              disabled={busy === f.id}
              className="flex items-center gap-1.5 text-xs text-text-primary disabled:opacity-50"
              aria-label={`Log favourite ${f.name}`}
            >
              <Plus className="w-3 h-3 text-accent" />
              <span className="font-medium whitespace-nowrap">{f.name}</span>
              <span className="text-text-tertiary tabular-nums">{f.items.length}</span>
            </button>
            {confirmDelete === f.id ? (
              <button
                onClick={() => handleDelete(f)}
                className="ml-1 text-[10px] text-destructive font-medium px-1.5"
                aria-label={`Confirm remove ${f.name}`}
              >
                Remove?
              </button>
            ) : (
              <button
                onClick={() => setConfirmDelete(f.id)}
                aria-label={`Remove ${f.name}`}
                className="ml-0.5 w-5 h-5 flex items-center justify-center rounded-full text-text-tertiary hover:text-destructive hover:bg-surface-hover transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
