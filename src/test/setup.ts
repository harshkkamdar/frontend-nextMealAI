import '@testing-library/jest-dom/vitest'

// jsdom with its default opaque origin (about:blank) does NOT expose
// window.localStorage / sessionStorage, so any test that touches them (e.g.
// the companion-session-persistence suite calling localStorage.clear() in
// beforeEach) throws "Cannot read properties of undefined (reading 'clear')".
// Provide a Map-backed Storage polyfill when the environment lacks one. The
// guard keeps jsdom's real implementation if a future config sets a concrete
// origin via environmentOptions.
class MemoryStorage implements Storage {
  private store = new Map<string, string>()
  get length(): number {
    return this.store.size
  }
  clear(): void {
    this.store.clear()
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }
  removeItem(key: string): void {
    this.store.delete(key)
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }
}

if (typeof window !== 'undefined') {
  for (const prop of ['localStorage', 'sessionStorage'] as const) {
    let ok = false
    try {
      ok = !!(window as unknown as Record<string, Storage>)[prop]
    } catch {
      ok = false
    }
    if (!ok) {
      Object.defineProperty(window, prop, { value: new MemoryStorage(), configurable: true })
    }
  }
}
