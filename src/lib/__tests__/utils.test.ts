import { describe, it, expect } from 'vitest'
import { safeImageUrl } from '@/lib/utils'

describe('safeImageUrl — defense-in-depth on <img src>', () => {
  it('allows https URLs', () => {
    expect(safeImageUrl('https://example.com/x.jpg')).toBe('https://example.com/x.jpg')
  })

  it('allows http URLs', () => {
    expect(safeImageUrl('http://example.com/x.jpg')).toBe('http://example.com/x.jpg')
  })

  it('allows blob URLs (optimistic local previews)', () => {
    const blob = 'blob:http://localhost:3010/abc-123'
    expect(safeImageUrl(blob)).toBe(blob)
  })

  it('allows protocol-relative URLs', () => {
    expect(safeImageUrl('//cdn.example.com/x.jpg')).toBe('//cdn.example.com/x.jpg')
  })

  it('rejects javascript: URLs (the actual XSS vector)', () => {
    expect(safeImageUrl('javascript:alert(1)')).toBeNull()
    expect(safeImageUrl('JAVASCRIPT:alert(1)')).toBeNull()
    expect(safeImageUrl('  javascript:alert(1)')).toBeNull()
  })

  it('rejects data: URLs (SVG-based XSS vector)', () => {
    expect(safeImageUrl('data:image/svg+xml;base64,PHN2Zy8+')).toBeNull()
  })

  it('rejects unknown schemes', () => {
    expect(safeImageUrl('file:///etc/passwd')).toBeNull()
    expect(safeImageUrl('vbscript:alert(1)')).toBeNull()
  })

  it('rejects null and undefined and empty string', () => {
    expect(safeImageUrl(null)).toBeNull()
    expect(safeImageUrl(undefined)).toBeNull()
    expect(safeImageUrl('')).toBeNull()
  })
})
