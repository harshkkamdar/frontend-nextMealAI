import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChatInput } from '@/components/chat/chat-input'

// FB-01 — Gallery picker alongside camera
//
// The chat composer must let users pick an existing image from their device
// library, not just capture a new photo. On iOS/Android, a standard
// <input type="file" accept="image/*"> without a `capture` attribute triggers
// the native "Photo Library / Take Photo / Choose File" sheet. Adding
// capture="environment" (or similar) would force camera-only and regress FB-01.
//
// These tests regression-lock the file input attributes so any future edit
// that would break gallery selection fails loudly in CI.

function getFileInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector('input[type="file"]')
  if (!input) throw new Error('file input not found in ChatInput')
  return input as HTMLInputElement
}

// jsdom lacks URL.createObjectURL/revokeObjectURL. The component uses them
// for the preview thumbnail and its effect cleanup — install stubs at the
// describe level so React's passive cleanup (which fires after test teardown)
// still has a function to call.
const originalCreateObjectURL = URL.createObjectURL
const originalRevokeObjectURL = URL.revokeObjectURL
beforeAll(() => {
  URL.createObjectURL = vi.fn(() => 'blob:mock-preview')
  URL.revokeObjectURL = vi.fn()
})
afterAll(() => {
  URL.createObjectURL = originalCreateObjectURL
  URL.revokeObjectURL = originalRevokeObjectURL
})

describe('ChatInput — FB-01 gallery picker', () => {
  it('renders an attach-photo button when showCamera is enabled', () => {
    render(<ChatInput onSend={() => {}} showCamera />)
    expect(screen.getByRole('button', { name: /attach photo/i })).toBeInTheDocument()
  })

  it('exposes a hidden file input that accepts any image type', () => {
    const { container } = render(<ChatInput onSend={() => {}} showCamera />)
    const input = getFileInput(container)
    expect(input.accept).toBe('image/*')
  })

  it('does NOT set a capture attribute so the native sheet offers library + camera', () => {
    const { container } = render(<ChatInput onSend={() => {}} showCamera />)
    const input = getFileInput(container)
    // `hasAttribute` is the tight assertion — any capture value (e.g.
    // "environment" or "user") would force a camera-only picker on mobile.
    expect(input.hasAttribute('capture')).toBe(false)
  })

  it('sends selected image bytes through onSend as a base64 payload', async () => {
    const onSend = vi.fn()
    const { container } = render(<ChatInput onSend={onSend} showCamera />)
    const input = getFileInput(container)

    const pngBytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk header
    ])
    const file = new File([pngBytes], 'library-photo.png', { type: 'image/png' })

    // Mock FileReader so we don't depend on jsdom's async Blob reader stability.
    const originalFileReader = globalThis.FileReader
    class MockFileReader {
      public result: string | null = null
      public onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null
      readAsDataURL(_blob: Blob) {
        this.result = 'data:image/png;base64,AAEC'
        this.onload?.call(this as unknown as FileReader, new ProgressEvent('load') as ProgressEvent<FileReader>)
      }
    }
    // @ts-expect-error — test-only override
    globalThis.FileReader = MockFileReader

    try {
      Object.defineProperty(input, 'files', { value: [file], configurable: true })
      input.dispatchEvent(new Event('change', { bubbles: true }))

      const sendButton = screen.getByRole('button', { name: /send message/i })
      sendButton.click()

      expect(onSend).toHaveBeenCalledTimes(1)
      const [, imagePayload] = onSend.mock.calls[0]
      expect(imagePayload).toBe('AAEC')
    } finally {
      globalThis.FileReader = originalFileReader
    }
  })
})
