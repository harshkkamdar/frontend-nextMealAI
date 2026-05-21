'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowUp, Camera, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { uploadChatAttachment } from '@/lib/api/chat.api'
import type { AttachedImage } from '@/types/chat.types'

export function ChatInput({
  onSend,
  disabled,
  showCamera = false,
  defaultValue = '',
}: {
  // FB-R6-02 — onSend now carries an array of fully-uploaded AttachedImage
  // entries instead of an inline base64 string. The composer uploads each
  // file the moment it's selected so the user can compose / retry / submit
  // without re-uploading bytes.
  onSend: (message: string, attachments?: AttachedImage[]) => void
  disabled?: boolean
  showCamera?: boolean
  defaultValue?: string
}) {
  const [value, setValue] = useState(defaultValue)
  const [attached, setAttached] = useState<AttachedImage | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    return () => {
      if (attached?.preview_url) URL.revokeObjectURL(attached.preview_url)
    }
  }, [attached])

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

  const handleSend = () => {
    const trimmed = value.trim()
    if ((!trimmed && !attached) || disabled || uploading) return
    onSend(trimmed || 'What is this?', attached ? [attached] : undefined)
    setValue('')
    setAttached(null)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // FB-R6-FE-B: Slack-style binding (Ved-confirmed 2026-05-21).
    // Plain Enter inserts a newline (browser default). Cmd+Enter (macOS) or
    // Ctrl+Enter (Win/Linux) sends.
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // FB-R6-02 — block parallel uploads to keep the composer state coherent.
    if (uploading) {
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Optimistic preview from a blob URL — visible before the upload finishes.
    const preview_url = URL.createObjectURL(file)
    setUploading(true)
    try {
      const { storage_path } = await uploadChatAttachment(file)
      setAttached({ storage_path, preview_url, file })
    } catch (err) {
      // Upload failed — revoke the preview so we don't leak a blob URL, and
      // do not attach. User can retry by re-selecting.
      URL.revokeObjectURL(preview_url)
      toast.error(err instanceof Error ? err.message : 'Image upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const clearImage = () => {
    if (attached?.preview_url) URL.revokeObjectURL(attached.preview_url)
    setAttached(null)
  }

  const sendDisabled = disabled || uploading || (!value.trim() && !attached)

  return (
    <div className="px-4 py-3 bg-background border-t border-border">
      {/* Image preview (or uploading placeholder) */}
      {(attached || uploading) && (
        <div className="relative inline-block mb-2">
          {attached ? (
            <img
              src={attached.preview_url}
              alt="Attached"
              className="h-16 w-16 object-cover rounded-lg border border-border"
            />
          ) : (
            <div className="h-16 w-16 flex items-center justify-center rounded-lg border border-border bg-surface">
              <Loader2 className="w-5 h-5 text-text-secondary animate-spin" />
            </div>
          )}
          {attached && (
            <button
              onClick={clearImage}
              aria-label="Remove attached image"
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-text-primary text-background flex items-center justify-center"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      <div className="flex items-end gap-2 bg-surface border border-border rounded-2xl px-4 py-2">
        {/* Camera button */}
        {showCamera && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
              className="p-1 mb-0.5 text-text-tertiary hover:text-accent transition-colors disabled:opacity-50 shrink-0"
              aria-label="Attach photo"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
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
