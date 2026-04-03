'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowUp, Camera, X } from 'lucide-react'

export function ChatInput({
  onSend,
  disabled,
  showCamera = false,
  defaultValue = '',
}: {
  onSend: (message: string, image?: string) => void
  disabled?: boolean
  showCamera?: boolean
  defaultValue?: string
}) {
  const [value, setValue] = useState(defaultValue)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  const handleSend = () => {
    const trimmed = value.trim()
    if ((!trimmed && !imageBase64) || disabled) return
    onSend(trimmed || 'What is this?', imageBase64 || undefined)
    setValue('')
    setImagePreview(null)
    setImageBase64(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview
    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)

    // Base64
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip data URL prefix to get raw base64
      const base64 = result.split(',')[1]
      setImageBase64(base64)
    }
    reader.readAsDataURL(file)

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    setImageBase64(null)
  }

  return (
    <div className="px-4 py-3 bg-background border-t border-border">
      {/* Image preview */}
      {imagePreview && (
        <div className="relative inline-block mb-2">
          <img
            src={imagePreview}
            alt="Attached"
            className="h-16 w-16 object-cover rounded-lg border border-border"
          />
          <button
            onClick={clearImage}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-text-primary text-background flex items-center justify-center"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-2">
        {/* Camera button */}
        {showCamera && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="p-1 text-text-tertiary hover:text-accent transition-colors disabled:opacity-50 shrink-0"
              aria-label="Take or attach a photo for Geo to analyze"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              className="hidden"
            />
          </>
        )}

        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Geo..."
          disabled={disabled}
          className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={disabled || (!value.trim() && !imageBase64)}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-accent to-accent-hover text-white disabled:opacity-40 transition-opacity shrink-0"
          aria-label="Send message"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
