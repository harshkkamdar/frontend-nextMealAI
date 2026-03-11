'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('')

  function handleSend() {
    const msg = value.trim()
    if (!msg || disabled) return
    onSend(msg)
    setValue('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-border bg-background px-4 py-3">
      <div className="flex items-end gap-2 max-w-md mx-auto">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Geo..."
          rows={1}
          disabled={disabled}
          className="flex-1 resize-none bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand/50 disabled:opacity-50 max-h-32 overflow-y-auto"
          style={{ minHeight: '44px' }}
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          className="w-11 h-11 rounded-xl bg-brand flex items-center justify-center text-white disabled:opacity-40 hover:bg-brand/90 transition-colors flex-shrink-0"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
