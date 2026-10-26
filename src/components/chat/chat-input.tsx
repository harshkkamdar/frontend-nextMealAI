'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { ArrowUpIcon, CameraFill } from '@/components/ui/fiqr/icons'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { uploadChatAttachment } from '@/lib/api/chat.api'
import { useComposerStore } from '@/stores/composer.store'
import { compressImage } from '@/lib/image/compress'
import { isNative } from '@/lib/platform'
import { pickPhoto } from '@/lib/platform/camera'
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
  variant = 'floating',
  placeholder = 'Message Geo',
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
  /** `floating`: the glass capsule over the Geo tab (controls layer). `inline`: a white field inside a sheet. */
  variant?: 'floating' | 'inline'
  placeholder?: string
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
      const selected = files.slice(0, room)
      if (files.length > selected.length) {
        toast.error(
          `Only ${selected.length} of ${files.length} added (max ${MAX_IMAGES} per message)`
        )
      }
      if (storeMode && sessionId) incrementStoreUploading(sessionId, selected.length)
      else setLocalUploadingCount((c) => c + selected.length)
      const accepted = await Promise.all(selected.map(compressImage))

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

  const handleAttachPhoto = async () => {
    if (isNative()) {
      const file = await pickPhoto({ source: 'prompt' })
      if (file) await addImages([file])
      return
    }
    fileInputRef.current?.click()
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
    <div className={cn('rounded-[28px] p-1.5', variant === 'floating' ? 'glass' : 'bg-card shadow-[var(--shadow-card)]')}>
      {/* FB-R6-03: thumbnail strip + upload-in-flight placeholders + counter */}
      {(attached.length > 0 || uploadingCount > 0) && (
        <div className="px-2.5 pb-1 pt-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            {attached.map((a) => (
              <div key={a.storage_path} className="relative" data-testid="attached-thumb">
                <img src={a.preview_url} alt="Photo to send" className="size-14 rounded-[12px] bg-ink-06 object-cover" />
                <button
                  type="button"
                  onClick={() => removeAttachment(a.storage_path)}
                  aria-label="Remove attached image"
                  className="absolute -right-4 -top-4 grid size-11 place-items-center"
                >
                  <span className="grid size-[22px] place-items-center rounded-full bg-ink text-cream shadow-[var(--shadow-card)]">
                    <X className="size-3" strokeWidth={2.5} />
                  </span>
                </button>
              </div>
            ))}
            {Array.from({ length: uploadingCount }).map((_, i) => (
              <div
                key={`pending-${i}`}
                data-testid="attached-uploading"
                role="status"
                aria-label="Uploading photo"
                className="grid size-14 place-items-center rounded-[12px] bg-ink-06"
              >
                <Loader2 className="size-5 animate-spin text-ink-65" strokeWidth={1.75} />
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-[12px] font-medium text-ink-65 tabular-nums">
            {totalPending} of {MAX_IMAGES} photos{capReached ? ', that is the most per message' : ''}
          </p>
        </div>
      )}

      <div className="flex items-end gap-1">
        {showCamera && (
          <>
            <button
              type="button"
              onClick={() => void handleAttachPhoto()}
              disabled={disabled || capReached}
              className="grid size-11 shrink-0 place-items-center rounded-full text-ink transition-[transform,opacity] duration-150 active:scale-[.94] disabled:opacity-35"
              aria-label="Attach photo"
              title={capReached ? `Max ${MAX_IMAGES} images per message` : 'Attach photo'}
            >
              <CameraFill className="size-[22px]" />
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
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          aria-label="Type a message"
          className={cn('min-h-11 min-w-0 flex-1 resize-none bg-transparent py-[11px] text-[16px] leading-[22px] text-ink outline-none placeholder:text-ink-65 transition-opacity duration-150 disabled:opacity-60', !showCamera && 'pl-3.5')}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sendDisabled}
          className="group relative grid size-11 shrink-0 place-items-center rounded-full bg-ink-08 text-ink-35 transition-transform enabled:active:scale-[.94]"
          aria-label="Send message"
        >
          {/* Orange crossfades in over the grey (opacity, not background-color), so ready and sent never snap. */}
          <span aria-hidden="true" className="absolute inset-0 grid place-items-center rounded-full bg-accent text-cream opacity-100 transition-opacity duration-150 group-disabled:opacity-0">
            <ArrowUpIcon className="size-5" />
          </span>
          <ArrowUpIcon className="size-5" />
        </button>
      </div>
    </div>
  )
}
