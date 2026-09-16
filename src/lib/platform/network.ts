import { useEffect, useState } from 'react'
import { isNative } from './index'

function webOnlineState(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}

function dispatchOnline(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('fiqr:online'))
  }
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(webOnlineState)

  useEffect(() => {
    let disposed = false
    let removeNativeListener: (() => Promise<void>) | undefined

    const update = (next: boolean) => {
      if (disposed) return
      setOnline((previous) => {
        if (!previous && next) dispatchOnline()
        return next
      })
    }

    if (isNative()) {
      void (async () => {
        const { Network } = await import('@capacitor/network')
        const status = await Network.getStatus()
        update(status.connected)
        const listener = await Network.addListener('networkStatusChange', (nextStatus) => {
          update(nextStatus.connected)
        })
        if (disposed) await listener.remove()
        else removeNativeListener = () => listener.remove()
      })()

      return () => {
        disposed = true
        void removeNativeListener?.()
      }
    }

    const handleOnline = () => update(true)
    const handleOffline = () => update(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    update(webOnlineState())

    return () => {
      disposed = true
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return online
}

export async function isOnline(): Promise<boolean> {
  if (!isNative()) return webOnlineState()
  const { Network } = await import('@capacitor/network')
  return (await Network.getStatus()).connected
}
