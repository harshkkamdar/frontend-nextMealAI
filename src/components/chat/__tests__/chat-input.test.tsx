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

  it('AC11: send is blocked while an upload is in flight (no half-attached submit)', async () => {
    type Resolver = (v: { storage_path: string; expires_in_seconds: number }) => void
    let resolveUpload: Resolver = () => {}
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
    resolveUpload({ storage_path: 'u/2.png', expires_in_seconds: 3600 })
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

// FB-R6-03 — Multi-image picker (cap 5)
// FB-R6-FE-C — Cmd+V paste image into composer
//
// One refactor, two AC sets. After R6-02 landed, attached state is array
// shaped, the file input gets `multiple`, the paste handler intercepts image
// items from the clipboard, and both paths share the same cap (5) and the
// same upload pipeline.
describe('ChatInput — FB-R6-03 multi-image + FB-R6-FE-C paste', () => {
  beforeEach(() => {
    mocks.upload.mockReset()
    mocks.toastError.mockReset()
  })

  function makeImageFile(name = 'photo.png') {
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    return new File([pngBytes], name, { type: 'image/png' })
  }

  it('R6-03 AC03: file input has the `multiple` attribute (gallery picker accepts multi-select)', () => {
    const { container } = render(<ChatInput onSend={() => {}} showCamera />)
    const input = getFileInput(container)
    expect(input.multiple).toBe(true)
  })

  it('R6-03 AC01: selecting 3 files uploads all 3 and onSend carries 3 attachments', async () => {
    mocks.upload
      .mockResolvedValueOnce({ storage_path: 'u/a.png', expires_in_seconds: 3600 })
      .mockResolvedValueOnce({ storage_path: 'u/b.png', expires_in_seconds: 3600 })
      .mockResolvedValueOnce({ storage_path: 'u/c.png', expires_in_seconds: 3600 })
    const onSend = vi.fn()
    const { container } = render(<ChatInput onSend={onSend} showCamera />)
    const input = getFileInput(container)
    const files = [makeImageFile('a.png'), makeImageFile('b.png'), makeImageFile('c.png')]

    Object.defineProperty(input, 'files', { value: files, configurable: true })
    input.dispatchEvent(new Event('change', { bubbles: true }))

    await waitFor(() => expect(mocks.upload).toHaveBeenCalledTimes(3))
    await waitFor(() => expect(screen.getAllByTestId('attached-thumb')).toHaveLength(3))

    screen.getByRole('button', { name: /send message/i }).click()
    expect(onSend).toHaveBeenCalledTimes(1)
    const [, attachments] = onSend.mock.calls[0]
    expect(attachments).toHaveLength(3)
    expect(attachments.map((a: { storage_path: string }) => a.storage_path).sort()).toEqual(
      ['u/a.png', 'u/b.png', 'u/c.png']
    )
  })

  it('R6-03 AC02: selecting 7 files attaches only 5 and surfaces a cap toast', async () => {
    mocks.upload.mockResolvedValue({ storage_path: 'u/x.png', expires_in_seconds: 3600 })
    const onSend = vi.fn()
    const { container } = render(<ChatInput onSend={onSend} showCamera />)
    const input = getFileInput(container)
    const files = Array.from({ length: 7 }, (_, i) => makeImageFile(`f${i}.png`))

    Object.defineProperty(input, 'files', { value: files, configurable: true })
    input.dispatchEvent(new Event('change', { bubbles: true }))

    await waitFor(() => expect(mocks.upload).toHaveBeenCalledTimes(5))
    expect(mocks.toastError).toHaveBeenCalled()
    await waitFor(() => expect(screen.getAllByTestId('attached-thumb')).toHaveLength(5))
  })

  it('R6-03: camera button disables when 5 images are attached', async () => {
    mocks.upload.mockResolvedValue({ storage_path: 'u/x.png', expires_in_seconds: 3600 })
    const { container } = render(<ChatInput onSend={() => {}} showCamera />)
    const input = getFileInput(container)
    const files = Array.from({ length: 5 }, (_, i) => makeImageFile(`f${i}.png`))

    Object.defineProperty(input, 'files', { value: files, configurable: true })
    input.dispatchEvent(new Event('change', { bubbles: true }))

    await waitFor(() => expect(screen.getAllByTestId('attached-thumb')).toHaveLength(5))
    const cameraBtn = screen.getByRole('button', { name: /attach photo|max .* images/i }) as HTMLButtonElement
    expect(cameraBtn.disabled).toBe(true)
  })

  it('FE-C AC01: pasting an image into the composer triggers upload', async () => {
    mocks.upload.mockResolvedValueOnce({ storage_path: 'u/pasted.png', expires_in_seconds: 3600 })
    render(<ChatInput onSend={() => {}} showCamera />)
    const textarea = screen.getByLabelText(/type a message/i)
    const file = makeImageFile('pasted.png')

    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true }) as Event & {
      clipboardData: DataTransfer
    }
    // Synthesize a minimal clipboardData with .files; jsdom DataTransfer is thin
    // so we attach a hand-rolled object with the shape the handler reads.
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: { files: [file], items: [], getData: () => '' },
    })
    textarea.dispatchEvent(pasteEvent)

    await waitFor(() => expect(mocks.upload).toHaveBeenCalledTimes(1))
    expect(mocks.upload.mock.calls[0][0]).toBeInstanceOf(File)
  })

  it('FE-C AC02: pasting plain text only does NOT trigger upload', () => {
    render(<ChatInput onSend={() => {}} showCamera />)
    const textarea = screen.getByLabelText(/type a message/i)

    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: { files: [], items: [], getData: () => 'hello world' },
    })
    textarea.dispatchEvent(pasteEvent)

    expect(mocks.upload).not.toHaveBeenCalled()
  })

  it('FE-C AC03: pasting multiple images uploads all (up to cap)', async () => {
    mocks.upload
      .mockResolvedValueOnce({ storage_path: 'u/p1.png', expires_in_seconds: 3600 })
      .mockResolvedValueOnce({ storage_path: 'u/p2.png', expires_in_seconds: 3600 })
    render(<ChatInput onSend={() => {}} showCamera />)
    const textarea = screen.getByLabelText(/type a message/i)
    const files = [makeImageFile('p1.png'), makeImageFile('p2.png')]

    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: { files, items: [], getData: () => '' },
    })
    textarea.dispatchEvent(pasteEvent)

    await waitFor(() => expect(mocks.upload).toHaveBeenCalledTimes(2))
  })

  it('FE-C: pasting an image when cap is full surfaces the cap toast and does not upload', async () => {
    // Fill the composer to the cap first.
    mocks.upload.mockResolvedValue({ storage_path: 'u/x.png', expires_in_seconds: 3600 })
    const { container } = render(<ChatInput onSend={() => {}} showCamera />)
    const input = getFileInput(container)
    const fillFiles = Array.from({ length: 5 }, (_, i) => makeImageFile(`fill${i}.png`))
    Object.defineProperty(input, 'files', { value: fillFiles, configurable: true })
    input.dispatchEvent(new Event('change', { bubbles: true }))
    await waitFor(() => expect(screen.getAllByTestId('attached-thumb')).toHaveLength(5))

    mocks.upload.mockClear()
    mocks.toastError.mockClear()

    // Now paste one more — should be rejected.
    const textarea = screen.getByLabelText(/type a message/i)
    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: { files: [makeImageFile('overflow.png')], items: [], getData: () => '' },
    })
    textarea.dispatchEvent(pasteEvent)

    expect(mocks.toastError).toHaveBeenCalled()
    expect(mocks.upload).not.toHaveBeenCalled()
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
