import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn', () => {
  it('keeps a Spatial type-scale size when a text colour follows', () => {
    expect(cn('text-title', 'text-ink')).toBe('text-title text-ink')
    expect(cn('text-body-sm text-ink-65')).toBe('text-body-sm text-ink-65')
  })

  it('still lets a later size win over an earlier one', () => {
    expect(cn('text-body', 'text-caption')).toBe('text-caption')
    expect(cn('text-[15px]', 'text-title')).toBe('text-title')
  })
})
