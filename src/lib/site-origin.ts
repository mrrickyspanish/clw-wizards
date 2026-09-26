/**
 * Resolves the public origin this deployment builds absolute URLs from.
 *
 * Every Stripe Checkout session must carry an absolute `success_url` and
 * `cancel_url`, and those are built from NEXT_PUBLIC_SITE_URL. That makes this
 * one variable a silent single point of failure for payments specifically: if
 * it is set to `www.clwizards.com` with no `https://`, `new URL(path, origin)`
 * throws, every checkout call 500s, and the entire rest of the site keeps
 * working perfectly — pages render, logins succeed, emails send. The symptom
 * reaching the club is "the payment links are broken" with nothing else wrong,
 * which reads like a Stripe outage and is not one.
 *
 * So the scheme is checked explicitly rather than left to throw deep inside a
 * checkout handler, and the failure is named.
 */

export type SiteOriginResult =
  | { ok: true; origin: string }
  | { ok: false; reason: 'missing' | 'no-scheme' | 'invalid' }

export function resolveSiteOrigin(fallback?: string): SiteOriginResult {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()

  if (!configured) {
    if (!fallback) return { ok: false, reason: 'missing' }
    return { ok: true, origin: fallback.replace(/\/$/, '') }
  }

  // Caught before `new URL` so the two cases stay distinguishable: a value
  // pasted without a scheme is a different fix from a genuinely malformed one.
  if (!/^https?:\/\//i.test(configured)) return { ok: false, reason: 'no-scheme' }

  try {
    const parsed = new URL(configured)
    return { ok: true, origin: parsed.origin }
  } catch {
    return { ok: false, reason: 'invalid' }
  }
}

/** Human-readable repair instruction for an unusable NEXT_PUBLIC_SITE_URL. */
export function siteOriginFixHint(reason: 'missing' | 'no-scheme' | 'invalid') {
  if (reason === 'missing') {
    return 'NEXT_PUBLIC_SITE_URL is not set. Set it to the full public site address, then redeploy.'
  }
  if (reason === 'no-scheme') {
    return 'NEXT_PUBLIC_SITE_URL is missing its https:// prefix. Set the full address (https://www.example.com), then redeploy.'
  }
  return 'NEXT_PUBLIC_SITE_URL is not a valid URL. Set the full public site address, then redeploy.'
}
