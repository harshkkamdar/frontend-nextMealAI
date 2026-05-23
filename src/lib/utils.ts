import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

/** @deprecated FB-R5-02: prefer todayLocalISO(tz) from @/lib/timezone for any
 * user-visible date. Kept for callers that genuinely want UTC (none should). */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Defense-in-depth guard for `<img src={url}>` when `url` comes from outside
 * the renderer (BE-signed URLs, attachments, etc). React does NOT block
 * `javascript:` URLs in `src` (only in `href`), so a compromised BE could
 * serve `javascript:alert(1)` and the browser would execute it.
 *
 * Allowlist the schemes we actually use:
 *   - https:/http: for BE-signed Storage URLs
 *   - blob: for optimistic local previews
 *   - // (protocol-relative) — browser resolves to the page's scheme
 *
 * Returns the URL if safe, or `null` if the caller should skip rendering.
 */
export function safeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  return /^(https?:\/\/|blob:|\/\/)/i.test(url) ? url : null
}
