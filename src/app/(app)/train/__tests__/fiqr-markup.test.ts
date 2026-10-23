import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const trainPage = readFileSync(join(process.cwd(), 'src/app/(app)/train/page.tsx'), 'utf8')
const sessionPage = readFileSync(join(process.cwd(), 'src/app/(app)/train/session/page.tsx'), 'utf8')
const restTimer = readFileSync(join(process.cwd(), 'src/components/workout/rest-timer.tsx'), 'utf8')

describe('FIQR train markup contract', () => {
  it('uses the cached train query, offline band, calendar sheet, and one primary action', () => {
    expect(trainPage).toContain("useCachedQuery('train', fetchData, [])")
    expect(trainPage).toContain('<OfflineBand />')
    expect(trainPage).toContain('<BottomSheet open={calendarOpen}')
    expect(trainPage).toContain('Log a freestyle session')
    expect(trainPage.match(/PrimaryButton/g)).toHaveLength(1)
  })

  it('renders the specified workout hierarchy and preserves train test ids', () => {
    expect(trainPage).toContain('This week')
    expect(trainPage).toContain('Program')
    expect(trainPage).toContain('History')
    expect(trainPage).toContain('activity-next-up-card')
    expect(trainPage).toContain('activity-start-workout-button')
    expect(trainPage).toContain('activity-last-session')
    expect(trainPage).toContain('activity-program-overview')
  })
})

describe('FIQR live-session markup contract', () => {
  it('uses the set-progress bar, horizontal pager, five-column set table, and fixed nav', () => {
    expect(sessionPage).toContain('completedSets / totalSets')
    expect(sessionPage).toContain('snap-x snap-mandatory')
    expect(sessionPage).toContain('grid-cols-[32px_1fr_1fr_1fr_44px]')
    expect(sessionPage).toContain('fixed inset-x-0 bottom-0')
  })

  it('keeps the add, finish, discard, Geo, and exit-sheet actions available', () => {
    expect(sessionPage).toContain('Add exercise')
    expect(sessionPage).toContain('Finish workout')
    expect(sessionPage).toContain('Discard workout')
    expect(sessionPage).toContain('Ask Geo')
    expect(sessionPage).toContain('Save &amp; exit')
  })

  it('uses the pinned FIQR rest card and compact minimised pill', () => {
    expect(restTimer).toContain('<FeatureCard')
    expect(restTimer).toContain('−15')
    expect(restTimer).toContain('+15')
    expect(restTimer).toContain('Rest timer (minimised)')
  })
})
