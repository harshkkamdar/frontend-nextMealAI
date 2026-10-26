import { afterEach, describe, expect, it, vi } from 'vitest'
import { leaveThen } from '../page-transition'

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('leaveThen', () => {
  it('navigates at once when there is no page to cross-fade', () => {
    const go = vi.fn()
    leaveThen(go)
    expect(go).toHaveBeenCalledOnce()
  })

  it('navigates at once and holds a frozen copy of the old page until the next page replaces it, then fades the copy', async () => {
    const frames: FrameRequestCallback[] = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { frames.push(cb); return frames.length })
    const tick = () => frames.splice(0).forEach((cb) => cb(0))
    let finish = () => {}
    const animate = vi.fn(() => ({ finished: new Promise<void>((r) => { finish = r }) }))
    Object.defineProperty(HTMLElement.prototype, 'animate', { value: animate, configurable: true })

    document.body.innerHTML = '<div data-page class="page-in"><input value="" /></div>'
    const old = document.querySelector<HTMLElement>('[data-page]')!
    old.querySelector('input')!.value = 'sam@example.com'
    const go = vi.fn()
    leaveThen(go)

    // No fade-out first: navigation starts in the same task (no dead cream frame).
    expect(go).toHaveBeenCalledOnce()
    const ghost = document.body.lastElementChild as HTMLElement
    expect(ghost).not.toBe(old)
    expect(ghost.hasAttribute('data-page')).toBe(false)
    expect(ghost.getAttribute('aria-hidden')).toBe('true')
    expect(ghost.style.pointerEvents).toBe('none')
    expect(ghost.style.animation).toBe('none')
    expect(ghost.querySelector('input')!.value).toBe('sam@example.com')

    // Old page still mounted: the copy waits instead of fading over an empty screen.
    tick(); tick()
    expect(animate).not.toHaveBeenCalled()

    // The next page replaces the old one: the copy fades on the next frame and is removed when done.
    old.remove()
    document.body.insertAdjacentHTML('afterbegin', '<div data-page></div>')
    tick(); tick()
    expect(animate).toHaveBeenCalledOnce()
    finish()
    await Promise.resolve(); await Promise.resolve()
    expect(ghost.isConnected).toBe(false)
  })
})
