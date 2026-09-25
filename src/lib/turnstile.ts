import { readCredential } from '@/lib/env'

export type TurnstileResult =
  | { ok: true }
  | { ok: false; reason: 'not-configured' | 'rejected'; errorCodes: string[] }

/**
 * Server-side Cloudflare Turnstile verification.
 *
 * Until this existed, nothing in the app verified a Turnstile token itself:
 * every auth form handed its token to Supabase via `captchaToken` and let
 * Supabase call siteverify with the secret stored in ITS dashboard. That
 * means TURNSTILE_SECRET_KEY in the hosting environment had never actually
 * been exercised by a live request, so nothing would have caught it being
 * wrong, stale, or (as QSTASH_TOKEN turned out to be) carrying a trailing
 * newline from being pasted into a dashboard field. readCredential trims it
 * for the same reason every other credential read in this app does.
 *
 * Returns the reason and Cloudflare's own error codes rather than a bare
 * boolean: "invalid-input-secret" (wrong key) and "timeout-or-duplicate"
 * (token reused or expired) need completely different fixes, and collapsing
 * them into false makes a misconfiguration look identical to a user who
 * simply didn't tick the box.
 */
export async function verifyTurnstileToken(token: string): Promise<TurnstileResult> {
  const secret = readCredential('TURNSTILE_SECRET_KEY')
  if (!secret) {
    console.error('[turnstile] TURNSTILE_SECRET_KEY is not set — cannot verify.')
    return { ok: false, reason: 'not-configured', errorCodes: [] }
  }

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token }),
      signal: AbortSignal.timeout(10_000),
    })
    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] }

    if (data?.success) return { ok: true }

    const errorCodes = data?.['error-codes'] ?? []
    console.error('[turnstile] verification rejected:', errorCodes.join(', ') || '(no error codes returned)')
    return { ok: false, reason: 'rejected', errorCodes }
  } catch (err) {
    console.error('[turnstile] siteverify request threw:', err)
    return { ok: false, reason: 'rejected', errorCodes: ['request-failed'] }
  }
}
