export type MessageRole = 'user' | 'assistant'

export interface ActionFailure {
  tool: string
  error: string
  details?: unknown
}

export interface ChatMessageMetadata {
  tools_used?: string[]
  actions_taken?: Array<{ type: string; details: unknown }>
  actions_failed?: ActionFailure[]
  // R6-10 — tappable option chips Geo offered with this message (persisted).
  suggested_replies?: string[]
}

// FB-R6-02 — chat image attachments persisted via the BE message_attachments
// table. Each message comes back with a `signed_url` good for 1 hour.
export interface ChatAttachment {
  id: string
  signed_url: string | null
  mime_type: string
  width: number | null
  height: number | null
}

export interface ChatMessage {
  id?: string
  role: MessageRole
  content: string
  timestamp?: string
  tokens_used?: number
  /**
   * Local-only image for the optimistic user-message bubble between submit
   * and the next history refetch. Blob URL or data URL.
   * Persisted attachments live in `attachments[]` instead.
   */
  image?: string
  /**
   * Server-persisted attachments from message_attachments. Empty array when
   * the message has no attachments.
   */
  attachments?: ChatAttachment[]
  metadata?: ChatMessageMetadata
  // R6-10 — tappable option chips for this assistant message (from the reply).
  suggestedReplies?: string[]
}

export interface ChatSession {
  id: string
  session_id: string
  user_id: string
  title?: string
  message_count?: number
  last_message?: string
  created_at: string
  updated_at: string
}

export interface ChatResponse {
  session_id: string
  response: {
    content: string
    role: MessageRole
    tokens_used?: number
    metadata?: ChatMessageMetadata
  }
  tools_used?: string[]
  actions_taken?: Array<{ type: string; details: unknown }>
  actions_failed?: ActionFailure[]
  // R6-10 — top-level convenience copy of the message's option chips.
  suggested_replies?: string[]
}

export interface SendMessageInput {
  message: string
  session_id?: string
  /**
   * @deprecated FB-R6-02 — use `image_paths` instead. The BE still accepts
   * this base64 field for backwards compat, but it does NOT persist the
   * image. Kept only for the FB-15 program-extraction fallback during
   * the transition.
   */
  image?: string
  /**
   * FB-R6-02 — array of storage paths returned from
   * POST /v1/chat/attachments/upload. BE enforces 0–5 entries.
   */
  image_paths?: string[]
}

// FB-R6-02 — chat-input emits this when an image is attached. The composer
// uploads the file the moment it's selected (separating bytes from message)
// so the user can compose / retry / multi-attach without re-uploading.
export interface AttachedImage {
  storage_path: string
  preview_url: string // browser blob URL for thumbnail
  file: File          // kept so the chat page can convert to base64 for FB-15
  width?: number
  height?: number
}
