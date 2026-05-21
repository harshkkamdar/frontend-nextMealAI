'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowUp, Camera, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { uploadChatAttachment } from '@/lib/api/chat.api'
import type { AttachedImage } from '@/types/chat.types'

// FB-R6-03 — BE caps image_paths at 5 per message. Mirror that on the FE so
// users get a friendly toast instead of a 400 from the server.
const MAX_IMAGES = 5

export function ChatInput({
  onSend,
  disabled,
  showCamera = false,
  defaultValue = '',
}: {
  // FB-R6-02 — onSend carries an array of fully-uploaded AttachedImage entries.
  // FB-R6-03 — array length 1..MAX_IMAGES.
  onSend: (message: string, attachments?: AttachedImage[]) => void
  disabled?: boolean
  showCamera?: boolean
  defaultValue?: string
}) {
  const [value, setValue] = useState(defaultValue)
  const [attached, setAttached] = useState<AttachedImage[]>([])
  const [uploadingCount, setUploadingCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Revoke blob URLs on unmount to avoid leaking them.
  useEffect(() => {
    return () => {
      for (const a of attached) URL.revokeObjectURL(a.preview_url)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run cleanup with final value of `attached` at unmount only
  }, [])

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    const maxHeight = 120 // ~4 lines
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  const totalPending = attached.length + uploadingCount
  const capReached = totalPending >= MAX_IMAGES

  /**
   * Shared image-ingestion path used by the file picker AND the paste handler.
   * Caps at MAX_IMAGES total (attached + in-flight). Uploads run in parallel
   * so multiple selected/pasted images don't queue serially.
   */
  const addImages = useCallback(
    async (files: File[]) => {
      const room = MAX_IMAGES - (attached.length + uploadingCount)
      if (room <= 0) {
        toast.error(`Max ${MAX_IMAGES} images per message`)
        return
      }
      const accepted = files.slice(0, room)
      if (files.length > accepted.length) {
        toast.error(
          `Only ${accepted.length} of ${files.length} added (max ${MAX_IMAGES} per message)`
        )
      }
      setUploadingCount((c) => c + accepted.length)
      for (const file of accepted) {
        const preview_url = URL.createObjectURL(file)
        uploadChatAttachment(file)
          .then(({ storage_path }) => {
            setAttached((prev) => [...prev, { storage_path, preview_url, file }])
          })
          .catch((err) => {
            URL.revokeObjectURL(preview_url)
            toast.error(err instanceof Error ? err.message : 'Image upload failed')
          })
          .finally(() => {
            setUploadingCount((c) => c - 1)
          })
      }
    },
    [attached.length, uploadingCount]
  )

  const handleSend = () => {
    const trimmed = value.trim()
    const hasAttachment = attached.length > 0
    if ((!trimmed && !hasAttachment) || disabled || uploadingCount > 0) return
    onSend(trimmed || 'What is this?', hasAttachment ? attached : undefined)
    setValue('')
    setAttached([])
    // Note: NOT revoking blob URLs here — the optimistic ChatBubble uses the
    // first preview_url until the next history refresh. The cleanup effect
    // handles them on unmount.
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // FB-R6-FE-B: Slack-style binding (Ved-confirmed 2026-05-21).
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  // FB-R6-FE-C — Cmd+V paste image support.
  //
  // We pull image files out of clipboardData.files (populated for "paste an
  // image" from a screenshot tool, browser, or another app). Pure text pastes
  // have an empty .files list and fall through to the default handler.
  // Mixed clipboard (e.g. screenshot + caption) is handled too: we take the
  // image, and we DO NOT preventDefault so any text payload pastes normally.
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) =>
        f.type.startsWith('image/')
      )
      if (files.length === 0) return
      void addImages(files)
    },
    [addImages]
  )

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) void addImages(files)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeAttachment = (storage_path: string) => {
    setAttached((prev) => {
      const next = prev.filter((a) => a.storage_path !== storage_path)
      const removed = prev.find((a) => a.storage_path === storage_path)
      if (removed) URL.revokeObjectURL(removed.preview_url)
      return next
    })
  }

  const sendDisabled =
    disabled || uploadingCount > 0 || (!value.trim() && attached.length === 0)

  return (
    <div className="px-4 py-3 bg-background border-t border-border">
      {/* FB-R6-03 — thumbnail strip + upload-in-flight placeholders + counter */}
      {(attached.length > 0 || uploadingCount > 0) && (
        <div className="mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            {attached.map((a) => (
              <div key={a.storage_path} className="relative inline-block" data-testid="attached-thumb">
                <img
                  src={a.preview_url}
                  alt="Attached"
                  className="h-16 w-16 object-cover rounded-lg border border-border"
                />
                <button
                  onClick={() => removeAttachment(a.storage_path)}
                  aria-label="Remove attached image"
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-text-primary text-background flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {Array.from({ length: uploadingCount }).map((_, i) => (
              <div
                key={`pending-${i}`}
                data-testid="attached-uploading"
                className="h-16 w-16 flex items-center justify-center rounded-lg border border-border bg-surface"
              >
                <Loader2 className="w-5 h-5 text-text-secondary animate-spin" />
              </div>
            ))}
          </div>
          <p className="text-[10px] text-text-tertiary mt-1 tabular-nums">
            {totalPending} / {MAX_IMAGES} {capReached ? '· max reached' : ''}
          </p>
        </div>
      )}

      <div className="flex items-end gap-2 bg-surface border border-border rounded-2xl px-4 py-2">
        {/* Camera button */}
        {showCamera && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || capReached}
              className="p-1 mb-0.5 text-text-tertiary hover:text-accent transition-colors disabled:opacity-50 shrink-0"
              aria-label="Attach photo"
              title={capReached ? `Max ${MAX_IMAGES} images per message` : 'Attach photo'}
            >
              <Camera className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
          </>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={showCamera ? handlePaste : undefined}
          placeholder="Message Geo..."
          disabled={disabled}
          rows={1}
          aria-label="Type a message"
          className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none disabled:opacity-50 resize-none py-1 leading-5"
        />
        <button
          onClick={handleSend}
          disabled={sendDisabled}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-accent hover:bg-accent-hover text-white disabled:opacity-40 transition-opacity shrink-0 mb-0.5"
          aria-label="Send message"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
