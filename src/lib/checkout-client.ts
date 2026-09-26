/**
 * The single browser-side entry point for every "start a payment" button on
 * this site: season dues, club dues, one-time donations, monthly boosters and
 * corporate sponsorships.
 *
 * It exists because all four call sites had independently written this:
 *
 *   const data = await response.json()
 *   if (!response.ok || !data.url) setError(data.error ?? 'Unable to start checkout.')
 *
 * That looks fine and hides the exact failure we care about. When a route
 * handler throws before it can build its own JSON body, the platform answers
 * with a plain-text or HTML error page. `response.json()` then throws, control
 * jumps to the `catch`, and the parent is told "Network error. Please try
 * again." — the one message that is guaranteed to be wrong. Their network is
 * fine; the server is misconfigured. Everyone then spends a day looking at wifi
 * and phones instead of at the env vars.
 *
 * So: read the body as text first, parse it only if it actually parses, and
 * keep the server's own words when it managed to send any. A reference code is
 * appended when the server supplied one, so a screenshot from a parent is
 * enough to tell which failure it was without asking them to reproduce it.
 */

export interface CheckoutRequest {
  flow: 'dues' | 'donation' | 'sponsor'
  [key: string]: unknown
}

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; message: string }

const FALLBACK = 'Unable to start checkout. Please try again, or contact the club if it keeps happening.'

function withReference(message: string, code: unknown) {
  return typeof code === 'string' && code.length > 0 && code.length < 40
    ? `${message} (ref: ${code})`
    : message
}

export async function startCheckout(body: CheckoutRequest): Promise<CheckoutResult> {
  let response: Response
  try {
    response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    // The only branch that is genuinely the visitor's connection.
    return { ok: false, message: 'Could not reach the site. Check your connection and try again.' }
  }

  const raw = await response.text().catch(() => '')
  let data: Record<string, unknown> = {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === 'object') data = parsed as Record<string, unknown>
  } catch {
    // Not JSON: an unhandled server error, a proxy page, or an auth redirect.
    // Deliberately not surfaced to the visitor, but logged so it is visible in
    // the browser console of anyone the club asks to check.
    console.error('[checkout] Non-JSON response from /api/checkout', {
      status: response.status,
      bodyStart: raw.slice(0, 200),
    })
  }

  if (!response.ok) {
    const message = typeof data.error === 'string' && data.error ? data.error : FALLBACK
    return { ok: false, message: withReference(message, data.code) }
  }

  if (typeof data.url !== 'string' || !data.url) {
    console.error('[checkout] 200 response carried no checkout URL', { status: response.status })
    return { ok: false, message: withReference(FALLBACK, 'NO-SESSION-URL') }
  }

  return { ok: true, url: data.url }
}
