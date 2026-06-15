/**
 * FE-RCA F5 — Forgot-password chain probe.
 *
 * The reset-password page has a correct conditional handler — but when the
 * email's redirect target is misconfigured (BE env var `PASSWORD_RESET_REDIRECT_URL`
 * missing or Supabase's "Redirect URLs" allowlist not including the host),
 * the link 404s and the FE has zero telemetry to surface that the chain
 * broke. Harsh hit this twice (2026-04-23, 2026-05-15) with no observability.
 *
 * This helper emits a fire-and-forget telemetry beacon on every link-load
 * outcome (valid token / invalid / missing) so a future BE probe endpoint
 * can correlate "user clicked the link" with "user got the form."
 *
 * Implementation notes:
 * - Uses navigator.sendBeacon when available (survives navigation away).
 * - Falls back to fetch with keepalive.
 * - Posts to `/api/telemetry/auth-flow` — BE endpoint is a follow-up; if it
 *   doesn't exist, the beacon silently 404s without affecting the user flow.
 * - Captures referrer + UA + outcome, NEVER the token. Privacy-safe.
 */

export type ResetPasswordLinkOutcome =
  | 'valid'      // token present, type=recovery|magiclink
  | 'invalid'    // token present but type wrong, or token malformed
  | 'missing'    // no token in URL at all → likely BE redirect misconfig

interface ResetPasswordLinkProbeEvent {
  event: 'reset_password_link_loaded'
  outcome: ResetPasswordLinkOutcome
  /** True when neither hash nor query carried `access_token` — strongest
   *  signal of a BE-side redirect misconfig (the user clicked an email link
   *  that didn't include the recovery tokens). */
  no_token_at_all: boolean
  referrer: string
  has_hash: boolean
  has_query: boolean
  /** Browser timezone offset — useful when correlating with deploy regions. */
  tz_offset_min: number
  ts: string
}

const ENDPOINT = '/api/telemetry/auth-flow'

export function probeResetPasswordLinkLoad(input: {
  outcome: ResetPasswordLinkOutcome
  noTokenAtAll: boolean
  hasHash: boolean
  hasQuery: boolean
}): void {
  if (typeof window === 'undefined') return

  const payload: ResetPasswordLinkProbeEvent = {
    event: 'reset_password_link_loaded',
    outcome: input.outcome,
    no_token_at_all: input.noTokenAtAll,
    referrer: document.referrer || '(none)',
    has_hash: input.hasHash,
    has_query: input.hasQuery,
    tz_offset_min: new Date().getTimezoneOffset(),
    ts: new Date().toISOString(),
  }

  try {
    const body = JSON.stringify(payload)
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' })
      // sendBeacon returns false if the browser refused (e.g. payload too
      // large) — we don't retry, the next link click will probe again.
      navigator.sendBeacon(ENDPOINT, blob)
      return
    }
    // Fallback: fire-and-forget fetch with keepalive so the request
    // survives the user navigating away to /login on success.
    void fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {
      // Silent — the probe is observability, not user-blocking.
    })
  } catch {
    // Defensive: never let telemetry crash the reset-password flow.
  }
}
