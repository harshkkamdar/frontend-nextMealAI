'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { OfflineError } from '@/lib/api/client'
import { recall, remember } from '@/lib/offline/cache'

interface CachedQueryResult<T> {
  data: T | null
  loading: boolean
  error: unknown
  stale: boolean
  savedAt: string | null
  refetch: () => Promise<void>
}

export function useCachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  deps: unknown[],
): CachedQueryResult<T> {
  const fetcherRef = useRef(fetcher)
  const mountedRef = useRef(true)
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [stale, setStale] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  useEffect(() => {
    fetcherRef.current = fetcher
  }, [fetcher])

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const fresh = await fetcherRef.current()
      const saved = new Date().toISOString()
      await remember(key, fresh)
      if (!mountedRef.current) return
      setData(fresh)
      setSavedAt(saved)
      setStale(false)
      setError(null)
    } catch (nextError) {
      if (!mountedRef.current) return
      if (nextError instanceof OfflineError) {
        setStale(true)
        setError(null)
      } else {
        setError(nextError)
      }
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [key])

  useEffect(() => {
    mountedRef.current = true
    let cancelled = false

    const load = async () => {
      const cached = await recall<T>(key)
      if (!cancelled && cached) {
        setData(cached.payload)
        setSavedAt(cached.savedAt)
        setStale(true)
      }
      if (!cancelled) await refetch()
    }
    void load()

    return () => {
      cancelled = true
      mountedRef.current = false
    }
    // The caller owns dependency identity, matching the useEffect API.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, refetch, ...deps])

  return { data, loading, error, stale, savedAt, refetch }
}
