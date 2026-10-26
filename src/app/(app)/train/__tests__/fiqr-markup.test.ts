import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')
const trainPage = read('src/app/(app)/train/page.tsx')
const trainCards = read('src/components/workout/train-cards.tsx')
const sessionPage = read('src/app/(app)/train/session/page.tsx')
const sessionCards = read('src/components/workout/session-cards.tsx')
const restTimer = read('src/components/workout/rest-timer.tsx')

describe('FIQR train markup contract', () => {
  it('uses the cached train query, large-title header, week strip, offline band, calendar sheet, and one primary action', () => {
    expect(trainPage).toContain("useCachedQuery('train', fetchData, [])")
    expect(trainPage).toContain('<LargeTitleHeader')
    expect(trainPage).toContain('<WeekStrip')
    expect(trainPage).toContain('<OfflineBand />')
    expect(trainPage).toContain('<BottomSheet open={calendarOpen}')
    expect(trainPage).not.toContain('CalendarStrip')
    expect(trainPage).toContain('Log a freestyle session')
    // One orange action: whichever hero state renders, exactly one PrimaryButton shows.
    expect(trainPage).not.toContain('SecondaryButton')
  })

  it('renders the workout hierarchy and preserves train test ids', () => {
    expect(trainPage).toContain('This week')
    expect(trainPage).toContain('Program')
    expect(trainPage).toContain('History')
    expect(trainCards).toContain('activity-next-up-card')
    expect(trainPage).toContain('activity-start-workout-button')
    expect(trainCards).toContain('activity-last-session')
    expect(trainCards).toContain('activity-program-overview')
  })

  it('animates the weekly volume bars with transforms only', () => {
    expect(trainCards).toContain('origin-bottom')
    expect(trainCards).toContain('scaleY')
    expect(trainCards).not.toMatch(/transition-\[width|transition-all|animate=\{\{\s*(width|height)/)
  })
})

describe('FIQR live-session markup contract', () => {
  it('uses the pushed header, digit-tile timer, segmented set progress, pager, five-column set table, and fixed nav', () => {
    expect(sessionPage).toContain('<PushedHeader')
    expect(sessionCards).toContain('<DigitTiles')
    expect(sessionCards).toContain('completedSets / totalSets')
    expect(sessionPage).toContain('snap-x snap-mandatory')
    expect(sessionPage).toContain('grid-cols-[32px_1fr_1fr_1fr_44px]')
    expect(sessionPage).toContain('fixed inset-x-0 bottom-0')
    expect(sessionPage).toContain('<ExerciseVisual')
    expect(sessionPage).toContain("haptic('success')")
  })

  it('keeps the add, finish, discard, Geo, and exit-sheet actions available', () => {
    expect(sessionPage).toContain('Add exercise')
    expect(sessionPage).toContain('Finish workout')
    expect(sessionPage).toContain('Discard workout')
    expect(sessionPage).toContain('Ask Geo')
    expect(sessionPage).toContain('Save and exit')
  })

  it('uses the pinned rest card with digit tiles and the compact minimised pill', () => {
    expect(restTimer).toContain('<DigitTiles')
    expect(restTimer).toContain('−15')
    expect(restTimer).toContain('+15')
    expect(restTimer).toContain('Rest timer (minimised)')
    expect(restTimer).not.toContain('transition-[width]')
  })
})
