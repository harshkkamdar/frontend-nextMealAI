import { afterEach, describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Atmosphere } from '../atmosphere'

const root = document.documentElement
const setHidden = (hidden: boolean) => Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })

describe('Atmosphere', () => {
  afterEach(() => setHidden(false))

  it('flags the page while mounted and clears the flag on unmount', () => {
    const { container, unmount } = render(<Atmosphere />)
    expect(root.hasAttribute('data-atmosphere')).toBe(true)
    expect(container.querySelector('.atmosphere')?.getAttribute('aria-hidden')).toBe('true')
    expect(container.querySelectorAll('.atmo-field')).toHaveLength(2)
    unmount()
    expect(root.hasAttribute('data-atmosphere')).toBe(false)
  })

  it('pauses the ambient loop while the app is hidden', () => {
    const { unmount } = render(<Atmosphere />)
    setHidden(true)
    document.dispatchEvent(new Event('visibilitychange'))
    expect(root.hasAttribute('data-hidden')).toBe(true)
    setHidden(false)
    document.dispatchEvent(new Event('visibilitychange'))
    expect(root.hasAttribute('data-hidden')).toBe(false)
    unmount()
  })
})
