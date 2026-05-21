import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { render, screen, fireEvent, createEvent } from '@testing-library/react'
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

// FB-R6-FE-B — Slack-style keybinding (Ved 2026-05-21):
// Plain Enter = newline. Cmd/Ctrl+Enter = send. Replaces today's ChatGPT-style
// binding where Enter sends and Shift+Enter inserts a newline. George wrote
// many multi-line messages that got sent half-typed under the old behavior.
describe('ChatInput — FB-R6-FE-B Slack-style keybinding', () => {
  function getTextarea(): HTMLTextAreaElement {
    return screen.getByLabelText(/type a message/i) as HTMLTextAreaElement
  }

  it('AC01: plain Enter does NOT send and does NOT preventDefault (lets browser insert newline)', () => {
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} />)
    const textarea = getTextarea()
    fireEvent.change(textarea, { target: { value: 'hello' } })

    const event = createEvent.keyDown(textarea, { key: 'Enter' })
    fireEvent(textarea, event)

    expect(onSend).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('AC02 (macOS): Cmd+Enter sends the message and clears the composer', () => {
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} />)
    const textarea = getTextarea()
    fireEvent.change(textarea, { target: { value: 'hello' } })

    fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true })

    expect(onSend).toHaveBeenCalledTimes(1)
    expect(onSend).toHaveBeenCalledWith('hello', undefined)
    expect(textarea.value).toBe('')
  })

  it('AC02 (Win/Linux): Ctrl+Enter sends the message', () => {
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} />)
    const textarea = getTextarea()
    fireEvent.change(textarea, { target: { value: 'hello' } })

    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true })

    expect(onSend).toHaveBeenCalledTimes(1)
    expect(onSend).toHaveBeenCalledWith('hello', undefined)
  })

  it('AC03: Cmd+Enter on an empty composer does NOT send', () => {
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} />)
    const textarea = getTextarea()

    fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true })

    expect(onSend).not.toHaveBeenCalled()
  })

  it('AC07: Cmd+Enter on whitespace-only composer does NOT send', () => {
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} />)
    const textarea = getTextarea()
    fireEvent.change(textarea, { target: { value: '   ' } })

    fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true })

    expect(onSend).not.toHaveBeenCalled()
  })

  it('AC11: Cmd+Enter while disabled does NOT send', () => {
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} disabled />)
    const textarea = getTextarea()
    fireEvent.change(textarea, { target: { value: 'hello' } })

    fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true })

    expect(onSend).not.toHaveBeenCalled()
  })

  it('AC02b: send preventsDefault so the textarea does not also insert a newline', () => {
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} />)
    const textarea = getTextarea()
    fireEvent.change(textarea, { target: { value: 'hello' } })

    const event = createEvent.keyDown(textarea, { key: 'Enter', metaKey: true })
    fireEvent(textarea, event)

    expect(event.defaultPrevented).toBe(true)
  })
})
