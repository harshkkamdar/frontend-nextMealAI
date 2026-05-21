import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { render, screen, fireEvent, createEvent, waitFor } from '@testing-library/react'

// FB-R6-02 — mock uploadChatAttachment so we can drive the two-step flow
// deterministically and assert what gets passed to onSend.
const mocks = vi.hoisted(() => ({
  upload: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock('@/lib/api/chat.api', () => ({
  uploadChatAttachment: (...args: unknown[]) => mocks.upload(...args),
}))

vi.mock('sonner', () => ({
  toast: { error: mocks.toastError, success: vi.fn() },
}))

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

})

// FB-R6-02 — Two-step image upload (replaces the old base64-in-JSON flow).
// The composer uploads the file the moment it's selected and sends the
// resulting storage_path through onSend as an AttachedImage. The legacy
// `image: base64` arg is gone.
describe('ChatInput — FB-R6-02 two-step image upload', () => {
  beforeEach(() => {
    mocks.upload.mockReset()
    mocks.toastError.mockReset()
  })

  function makeImageFile() {
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    return new File([pngBytes], 'photo.png', { type: 'image/png' })
  }

  async function selectFile(container: HTMLElement) {
    const input = getFileInput(container)
    const file = makeImageFile()
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    input.dispatchEvent(new Event('change', { bubbles: true }))
    return file
  }

  it('AC01: uploads the file the moment it is selected (no submit needed)', async () => {
    mocks.upload.mockResolvedValueOnce({ storage_path: 'u/123.png', expires_in_seconds: 3600 })
    const { container } = render(<ChatInput onSend={() => {}} showCamera />)
    await selectFile(container)
    await waitFor(() => expect(mocks.upload).toHaveBeenCalledTimes(1))
  })

  it('AC02: onSend receives an AttachedImage array carrying the storage_path (not base64)', async () => {
    mocks.upload.mockResolvedValueOnce({ storage_path: 'u/abc.png', expires_in_seconds: 3600 })
    const onSend = vi.fn()
    const { container } = render(<ChatInput onSend={onSend} showCamera />)

    await selectFile(container)
    await waitFor(() => expect(mocks.upload).toHaveBeenCalled())

    const sendButton = screen.getByRole('button', { name: /send message/i })
    sendButton.click()

    expect(onSend).toHaveBeenCalledTimes(1)
    const [, attachments] = onSend.mock.calls[0]
    expect(Array.isArray(attachments)).toBe(true)
    expect(attachments).toHaveLength(1)
    expect(attachments[0].storage_path).toBe('u/abc.png')
    expect(typeof attachments[0].preview_url).toBe('string')
    expect(attachments[0].file).toBeInstanceOf(File)
  })

  it('AC05: upload failure surfaces an error toast and DOES NOT attach', async () => {
    mocks.upload.mockRejectedValueOnce(new Error('413 too big'))
    const onSend = vi.fn()
    const { container } = render(<ChatInput onSend={onSend} showCamera />)

    await selectFile(container)
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalled())

    // Send button should be disabled because there's no attachment and no text
    const sendButton = screen.getByRole('button', { name: /send message/i }) as HTMLButtonElement
    expect(sendButton.disabled).toBe(true)
  })

  it('AC07: parallel file picks are blocked while upload is in flight', async () => {
    // Hold the first upload open so the second select hits the busy guard.
    let resolveFirst: ((v: { storage_path: string; expires_in_seconds: number }) => void) | null = null
    mocks.upload.mockReturnValueOnce(
      new Promise<{ storage_path: string; expires_in_seconds: number }>((res) => {
        resolveFirst = res
      })
    )
    const { container } = render(<ChatInput onSend={() => {}} showCamera />)

    await selectFile(container)
    expect(mocks.upload).toHaveBeenCalledTimes(1)

    // Second select while first is pending — should NOT trigger a second upload.
    await selectFile(container)
    expect(mocks.upload).toHaveBeenCalledTimes(1)

    // Resolve and confirm flow stabilizes.
    resolveFirst?.({ storage_path: 'u/1.png', expires_in_seconds: 3600 })
    await waitFor(() => {
      const sendBtn = screen.getByRole('button', { name: /send message/i }) as HTMLButtonElement
      expect(sendBtn.disabled).toBe(false)
    })
  })

  it('AC11: send is blocked while an upload is in flight (no half-attached submit)', async () => {
    let resolveUpload: ((v: { storage_path: string; expires_in_seconds: number }) => void) | null = null
    mocks.upload.mockReturnValueOnce(
      new Promise<{ storage_path: string; expires_in_seconds: number }>((res) => {
        resolveUpload = res
      })
    )
    const onSend = vi.fn()
    const { container } = render(<ChatInput onSend={onSend} showCamera />)
    const textarea = screen.getByLabelText(/type a message/i) as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'hello' } })

    await selectFile(container)

    // Even though there's text, send must be blocked because upload is pending.
    const sendButton = screen.getByRole('button', { name: /send message/i }) as HTMLButtonElement
    expect(sendButton.disabled).toBe(true)
    sendButton.click()
    expect(onSend).not.toHaveBeenCalled()

    // Try Cmd+Enter — should also be blocked while uploading.
    fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true })
    expect(onSend).not.toHaveBeenCalled()

    // After upload completes, send works.
    resolveUpload?.({ storage_path: 'u/2.png', expires_in_seconds: 3600 })
    await waitFor(() => expect(sendButton.disabled).toBe(false))
  })

  it('clearing the attachment after upload removes it from onSend', async () => {
    mocks.upload.mockResolvedValueOnce({ storage_path: 'u/3.png', expires_in_seconds: 3600 })
    const onSend = vi.fn()
    const { container } = render(<ChatInput onSend={onSend} showCamera />)

    await selectFile(container)
    await waitFor(() => expect(mocks.upload).toHaveBeenCalled())

    const remove = screen.getByRole('button', { name: /remove attached image/i })
    fireEvent.click(remove)

    const textarea = screen.getByLabelText(/type a message/i)
    fireEvent.change(textarea, { target: { value: 'just text' } })
    screen.getByRole('button', { name: /send message/i }).click()

    expect(onSend).toHaveBeenCalledTimes(1)
    const [, attachments] = onSend.mock.calls[0]
    expect(attachments).toBeUndefined()
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
