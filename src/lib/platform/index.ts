import { Capacitor } from '@capacitor/core'

export function isNative(): boolean {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform()
}

export function platform(): 'ios' | 'android' | 'web' {
  if (!isNative()) return 'web'
  const current = Capacitor.getPlatform()
  return current === 'ios' || current === 'android' ? current : 'web'
}

export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0'
