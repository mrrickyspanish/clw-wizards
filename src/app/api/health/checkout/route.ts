import { NextResponse } from 'next/server'

import { getStripeClient } from '@/lib/stripe'
import { missingCoreVariables } from '@/lib/alerts'
import { resolveSiteOrigin } from '@/lib/site-origin'

export const dynamic = 'force-dynamic'

/**
 * Synthetic check of the payment path.
 *
 * The production monitor already sweeps the public pages and the auth entry
 * points, but it has never touched checkout — it loads /sponsorship/donate and
 * sees a rendered donate form, which proves the page works and proves nothing
 * at all about whether pressing the button can create a Stripe session. So the
 * club's first notice of broken payments has been a parent texting to say the
 * payment link does not work, which is both the slowest possible signal and the
 * least specific.
 *
 * Nothing here charges, creates or mutates anything. `balance.retrieve` is a
 * read that every standard secret key can perform, and it is the cheapest call
 * that actually proves the credential is live, accepted and pointed at the
 * account we think it is. The amounts it returns are deliberately discarded.
 *
 * Answers `{ ok, reason }` only. No keys, no balances, no account identifiers —
 * the URL is public so an outside monitor can reach it without a secret.
 */
export async function GET(request: Request) {
  // Same guard as the password-recovery check: no query variants, so the stable
  // URL cannot be used to fan out arbitrary calls and can be briefly cached.
  if (new URL(request.url).search) return NextResponse.json({ ok: false }, { status: 400 })

  const fail = (reason: string) => {
    console.error('[checkout-health] failed', { reason })
    return NextResponse.json({ ok: false, reason }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  const missingCore = missingCoreVariables()
  if (missingCore.length > 0) return fail('core-env-missing')

  const site = resolveSiteOrigin()
  if (!site.ok) return fail(`site-url-${site.reason}`)

  if (!process.env.STRIPE_SECRET_KEY?.trim()) return fail('stripe-secret-key-missing')

  // Without this the webhook rejects every Stripe callback, so payments succeed
  // on the card and never post back to the dues record. The parent is charged
  // and the balance still reads as owed, which reaches the club as "the payment
  // did not work" even though the money moved.
  if (!process.env.STRIPE_WEBHOOK_SECRET?.trim()) return fail('stripe-webhook-secret-missing')

  let livemode: boolean
  try {
    const balance = await getStripeClient().balance.retrieve()
    livemode = balance.livemode
  } catch (error) {
    const type = (error as { type?: string } | null)?.type
    if (type === 'StripeAuthenticationError') return fail('stripe-key-rejected')
    if (type === 'StripePermissionError') return fail('stripe-key-insufficient-scope')
    if (type === 'StripeConnectionError') return fail('stripe-unreachable')
    console.error('[checkout-health] unexpected Stripe error', type ?? 'unknown')
    return fail('stripe-error')
  }

  // A test key on the production deployment renders a perfectly normal checkout
  // page that declines every real card. It looks like a card problem to the
  // parent and like nothing at all to the club.
  if (process.env.VERCEL_ENV === 'production' && !livemode) return fail('stripe-test-key-in-production')

  return NextResponse.json({ ok: true, mode: livemode ? 'live' : 'test' }, {
    status: 200,
    headers: { 'Cache-Control': 'public, s-maxage=120' },
  })
}
