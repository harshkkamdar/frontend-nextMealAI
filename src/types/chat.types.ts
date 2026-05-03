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
}

export interface ChatMessage {
  id?: string
  role: MessageRole
  content: string
  timestamp?: string
  tokens_used?: number
  image?: string // data URL or blob URL for local display
  metadata?: ChatMessageMetadata
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
}

export interface SendMessageInput {
  message: string
  session_id?: string
  image?: string // base64 encoded image
}
