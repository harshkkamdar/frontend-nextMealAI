export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  id?: string
  role: MessageRole
  content: string
  timestamp?: string
  tokens_used?: number
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
  }
  tools_used?: string[]
  actions_taken?: string[]
}

export interface SendMessageInput {
  message: string
  session_id: string
}
