import { parseLoggedFoods, type LoggedFood } from '@/components/chat/logged-foods'
import type { ChatMessage } from '@/types/chat.types'

/**
 * Action cards (Geo pick A2, 26 Oct 2026): each thing Geo did in a reply becomes one card with its own actions.
 * The reply carries no structured log or plan data, so the card is read from what the API already returns:
 * the "Logged ..." receipt lines, `actions_taken`, and the [[choices]] chips Geo offers after a log
 * (Undo | Adjust) or a draft plan (Use this plan | Change something). Undo stays a chat turn, as today.
 */
export type ActionCardKind = 'logged' | 'draft' | 'saved'

export interface ActionCardModel {
  kind: ActionCardKind
  /** Foods from the receipt lines (logged cards). */
  foods: LoggedFood[]
  /** A non-food log with no receipt line ("water", "sleep"), named on the card instead of rows. */
  logType: string | null
  /** Undo was sent right after this reply and Geo's next reply deleted the log. */
  undone: boolean
  /** "Use this plan" was sent right after this draft and Geo's next reply saved it. */
  accepted: boolean
  /** The chips this card's buttons take over, in Geo's order. Only the newest reply keeps them. */
  actions: string[]
}

const UNDO = /^undo$/i
const ADJUST = /^adjust$/i
const USE_PLAN = /^use this plan$/i
const CHANGE = /^change( something)?$/i

export const chipsOf = (message: ChatMessage): string[] => message.suggestedReplies ?? message.metadata?.suggested_replies ?? []

const did = (message: ChatMessage | undefined, ...types: string[]) =>
  (message?.metadata?.actions_taken ?? []).some((action) => types.includes(action.type))

const loggedType = (message: ChatMessage): string | null => {
  const action = message.metadata?.actions_taken?.find((a) => a.type === 'log_created')
  const type = (action?.details as { logType?: unknown } | undefined)?.logType
  return typeof type === 'string' ? type : null
}

/** The user's next turn after `index`, and Geo's reply to it. */
function followUp(messages: ChatMessage[], index: number) {
  const user = messages.findIndex((m, i) => i > index && m.role === 'user')
  if (user < 0) return { said: '', reply: undefined }
  return { said: messages[user].content.trim(), reply: messages.slice(user + 1).find((m) => m.role === 'assistant') }
}

/** One card per assistant message (or null), aligned with `messages`. */
export function describeThread(messages: ChatMessage[]): (ActionCardModel | null)[] {
  return messages.map((message, index) => {
    if (message.role !== 'assistant') return null
    const chips = chipsOf(message)
    const newest = index === messages.length - 1
    const next = followUp(messages, index)
    const base = { foods: [] as LoggedFood[], logType: null, undone: false, accepted: false }

    if (chips.some((c) => USE_PLAN.test(c))) {
      return {
        ...base,
        kind: 'draft',
        accepted: USE_PLAN.test(next.said) && did(next.reply, 'plan_created', 'plan_updated'),
        actions: newest ? chips.filter((c) => USE_PLAN.test(c) || CHANGE.test(c)) : [],
      }
    }

    const { foods } = parseLoggedFoods(message.content)
    const logType = foods.length ? null : loggedType(message)
    if (foods.length > 0 || (logType && chips.some((c) => UNDO.test(c)))) {
      return {
        ...base,
        kind: 'logged',
        foods,
        logType,
        undone: UNDO.test(next.said) && did(next.reply, 'log_deleted'),
        actions: newest ? chips.filter((c) => UNDO.test(c) || ADJUST.test(c)) : [],
      }
    }

    // A plan saved straight away gets its own card; one saved from a draft is shown on the draft card instead.
    if (did(message, 'plan_created')) {
      const prevUser = messages.slice(0, index).reverse().find((m) => m.role === 'user')
      if (!USE_PLAN.test(prevUser?.content.trim() ?? '')) return { ...base, kind: 'saved', actions: [] }
    }
    return null
  })
}
