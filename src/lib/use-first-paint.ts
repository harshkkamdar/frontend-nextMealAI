'use client'

import { useState } from 'react'

/** True on a screen's first paint in this session only; revisits paint at rest (motion-feel principle 7). */
export function useFirstPaint(screen: string): boolean {
  const [first] = useState(() => {
    try {
      const key = `fiqr:painted:${screen}`
      if (sessionStorage.getItem(key)) return false
      sessionStorage.setItem(key, '1')
      return true
    } catch {
      return true
    }
  })
  return first
}
