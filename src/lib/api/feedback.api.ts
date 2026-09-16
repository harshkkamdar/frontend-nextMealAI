import { apiFetch } from './client'

export type ReportReason = 'wrong' | 'unsafe' | 'offensive' | 'other'

export interface ReportResponseInput {
  session_id?: string
  message_id?: string
  reason: ReportReason
  note?: string
}

export async function reportResponse(input: ReportResponseInput): Promise<{ id: string }> {
  return apiFetch('/v1/feedback/response-report', {
    method: 'POST',
    body: input,
  })
}
