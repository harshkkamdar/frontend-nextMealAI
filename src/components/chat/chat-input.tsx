'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { ArrowUp, Camera, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { uploadChatAttachment } from '@/lib/api/chat.api'
import { useComposerStore } from '@/stores/composer.store'
import type { AttachedImage } from '@/types/chat.types'

// FB-R6-03 — BE caps image_paths at 5 per message. Mirror that on the FE so
// users get a friendly toast instead of a 400 from the server.
const MAX_IMAGES = 5

export function ChatInput({
  onSend,
  disabled,
  showCamera = false,
  defaultValue = '',
  sessionId,
}: {
  // FB-R6-02 — onSend carries an array of fully-uploaded AttachedImage entries.
  // FB-R6-03 — array length 1..MAX_IMAGES.
  onSend: (message: string, attachments?: AttachedImage[]) => void
  disabled?: boolean
  showCamera?: boolean
  defaultValue?: string
  /**
   * FB-R6-FE-D — when provided, draft state (text + attachments) syncs to
   * the shared composer store so the same draft persists when the user
   * navigates from the floating Geo widget to the full chat page. Without
   * a sessionId, the composer keeps state locally (current default).
   */
  sessionId?: string
}) {
  const storeMode = Boolean(sessionId)

  // Store-backed slices (read only when sessionId is set).
  const storeDraft = useComposerStore((s) => (sessionId ? s.drafts[sessionId] : undefined))
  const setStoreText = useComposerStore((s) => s.setText)
  const addStoreAttached = useComposerStore((s) => s.addAttached)
  const removeStoreAttached = useComposerStore((s) => s.removeAttached)
  const incrementStoreUploading = useComposerStore((s) => s.incrementUploading)
  const decrementStoreUploading = useComposerStore((s) => s.decrementUploading)
  const clearStoreDraft = useComposerStore((s) => s.clearDraft)

  // Local fallback when no sessionId — preserves behavior for tests + any
  // future consumer that doesn't want to opt into the shared store.
  const [localValue, setLocalValue] = useState(defaultValue)
  const [localAttached, setLocalAttached] = useState<AttachedImage[]>([])
  const [localUploadingCount, setLocalUploadingCount] = useState(0)

  const value = storeMode ? (storeDraft?.text ?? defaultValue) : localValue
  const attached = storeMode ? (storeDraft?.attached ?? []) : localAttached
  const uploadingCount = storeMode
    ? (storeDraft?.uploadingCount ?? 0)
    : localUploadingCount

  const setValue = useCallback(
    (next: string) => {
      if (storeMode && sessionId) setStoreText(sessionId, next)
      else setLocalValue(next)
    },
    [storeMode, sessionId, setStoreText]
  )

  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Cleanup blob URLs at unmount for the LOCAL state path. Store path is
  // owned by the store and intentionally outlives this component.
  useEffect(() => {
    return () => {
      if (storeMode) return
      for (const a of localAttached) {
        try {
          URL.revokeObjectURL(a.preview_url)
        } catch {
          /* noop */
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: cleanup with final value
  }, [])

  // Seed initial defaultValue → local state (one-time).
  useEffect(() => {
    if (storeMode) return
    if (defaultValue && localValue === '') setLocalValue(defaultValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once at mount
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
      if (storeMode && sessionId) incrementStoreUploading(sessionId, accepted.length)
      else setLocalUploadingCount((c) => c + accepted.length)

      for (const file of accepted) {
        const preview_url = URL.createObjectURL(file)
        uploadChatAttachment(file)
          .then(({ storage_path }) => {
            const item: AttachedImage = { storage_path, preview_url, file }
            if (storeMode && sessionId) addStoreAttached(sessionId, item)
            else setLocalAttached((prev) => [...prev, item])
          })
          .catch((err) => {
            try {
              URL.revokeObjectURL(preview_url)
            } catch {
              /* noop */
            }
            toast.error(err instanceof Error ? err.message : 'Image upload failed')
          })
          .finally(() => {
            if (storeMode && sessionId) decrementStoreUploading(sessionId)
            else setLocalUploadingCount((c) => Math.max(0, c - 1))
          })
      }
    },
    [
      attached.length,
      uploadingCount,
      storeMode,
      sessionId,
      addStoreAttached,
      incrementStoreUploading,
      decrementStoreUploading,
    ]
  )

  const handleSend = () => {
    const trimmed = value.trim()
    const hasAttachment = attached.length > 0
    if ((!trimmed && !hasAttachment) || disabled || uploadingCount > 0) return
    onSend(trimmed || 'What is this?', hasAttachment ? attached : undefined)
    if (storeMode && sessionId) {
      clearStoreDraft(sessionId)
    } else {
      setLocalValue('')
      setLocalAttached([])
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // FB-R6-FE-B: Slack-style binding.
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  // FB-R6-FE-C — Cmd+V paste image support.
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
    if (storeMode && sessionId) {
      removeStoreAttached(sessionId, storage_path)
    } else {
      setLocalAttached((prev) => {
        const target = prev.find((a) => a.storage_path === storage_path)
        if (target) {
          try {
            URL.revokeObjectURL(target.preview_url)
          } catch {
            /* noop */
          }
        }
        return prev.filter((a) => a.storage_path !== storage_path)
      })
    }
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
