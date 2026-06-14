/**
 * FE-RCA F5 — Forgot-password chain probe regression lock.
 *
 * The probe is the FE's only signal that the email link landed correctly.
 * It must:
 *   - prefer navigator.sendBeacon when available (survives navigation)
 *   - fall back to fetch with keepalive
 *   - NEVER throw — telemetry must not break the reset-password flow
 *   - NEVER include the access token in the payload (privacy)
 *   - emit a `no_token_at_all` boolean that the BE can pivot on to detect
 *     the silent-redirect-misconfig failure mode
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { probeResetPasswordLinkLoad } from '@/lib/auth-telemetry'

type SendBeaconMock = ReturnType<typeof vi.fn<(url: string, data?: BodyInit) => boolean>>
type FetchMock = ReturnType<typeof vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>>

describe('FE-RCA F5 — probeResetPasswordLinkLoad', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('uses navigator.sendBeacon when available, posting to /api/telemetry/auth-flow', () => {
    const sendBeacon = vi.fn(() => true) as SendBeaconMock
    vi.stubGlobal('navigator', { ...navigator, sendBeacon })

    probeResetPasswordLinkLoad({
      outcome: 'missing',
      noTokenAtAll: true,
      hasHash: false,
      hasQuery: false,
    })

    expect(sendBeacon).toHaveBeenCalledOnce()
    const call = sendBeacon.mock.calls[0]
    expect(call[0]).toBe('/api/telemetry/auth-flow')
    expect(call[1]).toBeInstanceOf(Blob)
  })

  it('falls back to fetch with keepalive when sendBeacon is unavailable', async () => {
    vi.stubGlobal('navigator', { ...navigator, sendBeacon: undefined })
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 })) as FetchMock
    vi.stubGlobal('fetch', fetchMock)

    probeResetPasswordLinkLoad({
      outcome: 'valid',
      noTokenAtAll: false,
      hasHash: true,
      hasQuery: false,
    })

    expect(fetchMock).toHaveBeenCalledOnce()
    const call = fetchMock.mock.calls[0]
    expect(call[0]).toBe('/api/telemetry/auth-flow')
    const init = call[1] as RequestInit
    expect(init.method).toBe('POST')
    expect(init.keepalive).toBe(true)
  })

  it('serializes the outcome shape — never the token', async () => {
    const sendBeacon = vi.fn(() => true) as SendBeaconMock
    vi.stubGlobal('navigator', { ...navigator, sendBeacon })

    probeResetPasswordLinkLoad({
      outcome: 'invalid',
      noTokenAtAll: false,
      hasHash: true,
      hasQuery: true,
    })

    const call = sendBeacon.mock.calls[0]
    const blob = call[1] as Blob
    const text = await blob.text()
    const payload = JSON.parse(text)

    expect(payload.event).toBe('reset_password_link_loaded')
    expect(payload.outcome).toBe('invalid')
    expect(payload.no_token_at_all).toBe(false)
    expect(payload.has_hash).toBe(true)
    expect(payload.has_query).toBe(true)
    // Privacy: never leak token-like fields
    expect(JSON.stringify(payload)).not.toMatch(/access_token|recovery|magiclink/)
  })

  it('emits no_token_at_all=true on the missing case (BE-misconfig signal)', async () => {
    const sendBeacon = vi.fn(() => true) as SendBeaconMock
    vi.stubGlobal('navigator', { ...navigator, sendBeacon })

    probeResetPasswordLinkLoad({
      outcome: 'missing',
      noTokenAtAll: true,
      hasHash: false,
      hasQuery: false,
    })
    const call = sendBeacon.mock.calls[0]
    const blob = call[1] as Blob
    const text = await blob.text()
    const payload = JSON.parse(text)
    expect(payload.no_token_at_all).toBe(true)
    expect(payload.outcome).toBe('missing')
  })

  it('never throws when both sendBeacon and fetch blow up', () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      sendBeacon: () => { throw new Error('quota') },
    })
    const fetchMock = vi.fn(() => { throw new Error('offline') })
    vi.stubGlobal('fetch', fetchMock)

    expect(() =>
      probeResetPasswordLinkLoad({
        outcome: 'missing',
        noTokenAtAll: true,
        hasHash: false,
        hasQuery: false,
      }),
    ).not.toThrow()
  })
})
