import type { StateStorage } from 'zustand/middleware'
import { isNative } from './index'

export function createPlatformStorage(): StateStorage {
  if (isNative()) {
    return {
      async getItem(name) {
        const { Preferences } = await import('@capacitor/preferences')
        const { value } = await Preferences.get({ key: name })
        return value
      },
      async setItem(name, value) {
        const { Preferences } = await import('@capacitor/preferences')
        await Preferences.set({ key: name, value })
      },
      async removeItem(name) {
        const { Preferences } = await import('@capacitor/preferences')
        await Preferences.remove({ key: name })
      },
    }
  }

  return {
    getItem(name) {
      try {
        return localStorage.getItem(name)
      } catch {
        return null
      }
    },
    setItem(name, value) {
      try {
        localStorage.setItem(name, value)
      } catch {
        // Storage can be unavailable in private browsing or restricted contexts.
      }
    },
    removeItem(name) {
      try {
        localStorage.removeItem(name)
      } catch {
        // Storage can be unavailable in private browsing or restricted contexts.
      }
    },
  }
}

export async function kvGet(key: string): Promise<string | null> {
  return await createPlatformStorage().getItem(key)
}

export async function kvSet(key: string, value: string): Promise<void> {
  await createPlatformStorage().setItem(key, value)
}

export async function kvRemove(key: string): Promise<void> {
  await createPlatformStorage().removeItem(key)
}
