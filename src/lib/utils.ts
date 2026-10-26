import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// The Spatial type scale (globals.css --text-*) must count as font sizes, or a following text colour drops them.
const twMerge = extendTailwindMerge({ extend: { theme: { text: ['title', 'hero', 'headline', 'body', 'body-sm', 'caption', 'label', 'tab'] } } })

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

/** `plural(1, 'exercise')` -> "1 exercise", `plural(5, 'exercise')` -> "5 exercises". */
export function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}
