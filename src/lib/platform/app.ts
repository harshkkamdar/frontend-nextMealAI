import { isNative } from './index'

interface NativeShellHandlers {
  onBack: () => boolean
  onResume: () => void
  onUrl: (url: URL) => void
}

export function initNativeShell(handlers: NativeShellHandlers): () => void {
  if (!isNative()) return () => {}

  let disposed = false
  const removers: Array<() => Promise<void>> = []

  void (async () => {
    const [{ App }, { SplashScreen }] = await Promise.all([
      import('@capacitor/app'),
      import('@capacitor/splash-screen'),
    ])

    const listenerHandles = await Promise.all([
      App.addListener('backButton', ({ canGoBack }) => {
        if (!handlers.onBack()) {
          if (canGoBack) window.history.back()
          else void App.exitApp()
        }
      }),
      App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) return
        handlers.onResume()
        window.dispatchEvent(new CustomEvent('fiqr:resume'))
      }),
      App.addListener('appUrlOpen', ({ url }) => {
        handlers.onUrl(new URL(url))
      }),
    ])

    for (const handle of listenerHandles) removers.push(() => handle.remove())
    if (disposed) {
      await Promise.all(removers.map((remove) => remove()))
      return
    }

    requestAnimationFrame(() => {
      void SplashScreen.hide()
    })
  })()

  return () => {
    disposed = true
    for (const remove of removers) void remove()
    removers.length = 0
  }
}

export async function haptic(kind: 'light' | 'success' | 'warning'): Promise<void> {
  if (!isNative()) return
  const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics')
  if (kind === 'light') {
    await Haptics.impact({ style: ImpactStyle.Light })
    return
  }
  await Haptics.notification({
    type: kind === 'success' ? NotificationType.Success : NotificationType.Warning,
  })
}
