import { describe, expect, it } from 'vitest'
import { describeThread } from '@/components/chat/thread-actions'
import type { ChatMessage } from '@/types/chat.types'

const user = (content: string): ChatMessage => ({ role: 'user', content })
const geo = (content: string, chips: string[] = [], actions: string[] = []): ChatMessage => ({
  role: 'assistant',
  content,
  metadata: { suggested_replies: chips, actions_taken: actions.map((type) => ({ type, details: { logType: 'water' } })) },
})
const BANANA = 'Logged banana to breakfast · 105 cal · 1.3g P · 27g C · 0.4g F\nBreakfast is 537 kcal now.'

describe('describeThread', () => {
  it('turns a food log into a logged card whose buttons take the Undo and Adjust chips', () => {
    const [, card] = describeThread([user('a banana'), geo(BANANA, ['Undo', 'Adjust', 'Log a coffee'], ['log_created'])])
    expect(card).toMatchObject({ kind: 'logged', undone: false, actions: ['Undo', 'Adjust'] })
    expect(card?.foods[0]).toMatchObject({ name: 'Banana', kcal: 105, meal: 'Breakfast' })
  })

  it('keeps buttons on the newest reply only', () => {
    const cards = describeThread([geo(BANANA, ['Undo', 'Adjust'], ['log_created']), user('thanks'), geo('Any time.')])
    expect(cards[0]?.actions).toEqual([])
  })

  it('strikes a log through once Undo was sent and Geo deleted it', () => {
    const cards = describeThread([geo(BANANA, ['Undo', 'Adjust'], ['log_created']), user('Undo'), geo('Removed the banana.', [], ['log_deleted'])])
    expect(cards[0]?.undone).toBe(true)
    const kept = describeThread([geo(BANANA, ['Undo'], ['log_created']), user('Undo'), geo("I couldn't find it.")])
    expect(kept[0]?.undone).toBe(false)
  })

  it('cards a non-food log only when Geo offers Undo for it', () => {
    expect(describeThread([geo('Two glasses of water, done.', ['Undo', 'Adjust'], ['log_created'])])[0]).toMatchObject({ kind: 'logged', logType: 'water' })
    expect(describeThread([geo('Two glasses of water, done.', [], ['log_created'])])[0]).toBeNull()
  })

  it('marks a draft accepted when Use this plan was sent and the plan saved, without a second card', () => {
    const cards = describeThread([geo("Here's a draft.", ['Use this plan', 'Change something']), user('Use this plan'), geo('Done.', [], ['plan_created'])])
    expect(cards[0]).toMatchObject({ kind: 'draft', accepted: true, actions: [] })
    expect(cards[2]).toBeNull()
  })

  it('gives a plan saved straight away its own card, and plain replies none', () => {
    expect(describeThread([user('make me a plan'), geo('Saved it.', [], ['plan_created'])])[1]).toMatchObject({ kind: 'saved' })
    expect(describeThread([geo('Hello.', ['Yes', 'No'])])[0]).toBeNull()
  })
})
