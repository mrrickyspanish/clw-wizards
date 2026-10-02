import { NextResponse } from 'next/server'
import type Stripe from 'stripe'

import { getStripeClient } from '@/lib/stripe'
import { resolveSiteOrigin, siteOriginFixHint } from '@/lib/site-origin'
import { sendAlert } from '@/lib/alerts'
import { createServerSupabase } from '@/lib/supabase/server'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { ORG } from '@/config/org.config'
import { DONATIONS_ENABLED, DONATIONS_COMING_SOON_BODY } from '@/config/donations'
import type { SponsorTier } from '@/types/database'

interface DuesCheckoutBody {
  flow: 'dues'
  duesId: string
  amountCents?: number
  returnPath?: string
}

interface DonationCheckoutBody {
  flow: 'donation'
  amountCents: number
  recurring?: boolean
  donorEmail?: string
  donorName?: string
  returnPath?: string
}

interface SponsorCheckoutBody {
  flow: 'sponsor'
  sponsorId?: string
  sponsorName?: string
  contactName?: string
  contactEmail?: string
  websiteUrl?: string
  tier?: string
  returnPath?: string
}

type CheckoutBody = DuesCheckoutBody | DonationCheckoutBody | SponsorCheckoutBody

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function clean(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function safeReturnPath(value: string | undefined, fallback: string) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback
  try {
    const parsed = new URL(value, 'https://example.com')
    return parsed.pathname
  } catch {
    return fallback
  }
}

function returnUrl(siteOrigin: string, path: string, key: string, value: string) {
  const url = new URL(path, siteOrigin)
  url.searchParams.set(key, value)
  return url.toString()
}

/**
 * Where a completed public checkout lands. Stripe substitutes the real session
 * id into {CHECKOUT_SESSION_ID} before redirecting, which is what lets the
 * thank-you page state the actual amount.
 *
 * Built by concatenation rather than through URLSearchParams on purpose: that
 * would percent-encode the braces, Stripe would not recognise the placeholder,
 * and the visitor would arrive with the literal text in the query string.
 */
function thankYouUrl(siteOrigin: string) {
  return `${new URL('/sponsorship/thank-you', siteOrigin).toString()}?session_id={CHECKOUT_SESSION_ID}`
}

function safeWebsiteUrl(value: string | undefined) {
  const cleaned = clean(value, 300)
  if (!cleaned) return null
  try {
    const url = new URL(cleaned)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

/**
 * The visitor never needs to know which credential is wrong, but the club does.
 * Every failure answer carries a short `code` that the browser surfaces in the
 * message, so a screenshot from a parent identifies the fault on its own —
 * without a reproduction, a log search, or a second parent to test on.
 */
function checkoutError(message: string, code: string, status: number) {
  return NextResponse.json({ error: message, code }, { status })
}

const GENERIC_FAILURE = 'Unable to start checkout. Please try again, or contact the club if it keeps happening.'

export async function POST(request: Request) {
  // Trimmed to match lib/stripe.ts. Checking the raw value here while the
  // client trims meant a whitespace-only key passed this gate and then threw
  // deeper in, as an unhandled 500 with no JSON body at all.
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim()
  if (!stripeKey) {
    console.error('[checkout] STRIPE_SECRET_KEY is not set on this deployment.')
    await sendAlert('Checkout refused: Stripe is not configured', {
      detail: 'STRIPE_SECRET_KEY is missing or blank on the production deployment.',
    })
    return checkoutError('Online payment is not available right now.', 'STRIPE-UNCONFIGURED', 503)
  }

  let body: CheckoutBody
  try {
    body = (await request.json()) as CheckoutBody
  } catch {
    return checkoutError('Invalid checkout request.', 'BAD-REQUEST', 400)
  }

  // Stripe requires absolute return URLs. Resolved and validated up front so a
  // mis-set NEXT_PUBLIC_SITE_URL names itself instead of throwing from inside a
  // flow handler as an anonymous 500.
  const site = resolveSiteOrigin(new URL(request.url).origin)
  if (!site.ok) {
    console.error(`[checkout] ${siteOriginFixHint(site.reason)}`)
    await sendAlert('Checkout blocked by an unusable NEXT_PUBLIC_SITE_URL', {
      reason: site.reason,
      fix: siteOriginFixHint(site.reason),
    })
    return checkoutError(GENERIC_FAILURE, `SITE-URL-${site.reason.toUpperCase()}`, 500)
  }
  const siteOrigin = site.origin

  // Hiding the buttons is not the same as closing the door: this endpoint is
  // reachable directly, and a stale tab still holds a working form. Refuse the
  // flow here too, so no card is charged before the club can be paid out.
  if (body.flow === 'donation' && !DONATIONS_ENABLED) {
    return checkoutError(DONATIONS_COMING_SOON_BODY, 'DONATIONS-OFF', 503)
  }

  try {
    // Inside the try on purpose. This constructs the Stripe client and runs the
    // environment readiness check, both of which can throw — and when they did
    // so from above the try, the handler crashed before it could answer with
    // JSON at all. The browser then failed to parse the response and told the
    // parent it was a network error, which it never was.
    const stripe = getStripeClient()

    if (body.flow === 'dues') return await checkoutDues(stripe, body, siteOrigin)
    if (body.flow === 'donation') return await checkoutDonation(stripe, body, siteOrigin)
    if (body.flow === 'sponsor') return await checkoutSponsor(stripe, body, siteOrigin)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    // A rotated, revoked or test-mode key is the single most common reason a
    // checkout that worked last week stops working, and Stripe reports it as an
    // authentication error rather than anything resembling a payment problem.
    const type = (err as { type?: string } | null)?.type
    const code = type === 'StripeAuthenticationError' ? 'STRIPE-AUTH'
      : type === 'StripePermissionError' ? 'STRIPE-PERMISSION'
      : type === 'StripeConnectionError' ? 'STRIPE-UNREACHABLE'
      : 'CHECKOUT-FAILED'

    console.error(`[checkout] session creation failed (${code}):`, err)
    await sendAlert('Stripe checkout session creation failed', {
      flow: (body as CheckoutBody).flow,
      code,
      error: message,
    })
    return checkoutError(GENERIC_FAILURE, code, 500)
  }

  return checkoutError('Unknown checkout flow.', 'UNKNOWN-FLOW', 400)
}

async function checkoutDues(stripe: Stripe, body: DuesCheckoutBody, siteOrigin: string) {
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) {
    return NextResponse.json({ error: 'You must be signed in to pay dues.' }, { status: 401 })
  }

  const admin = createAdminSupabase()
  const { data: dues, error } = await admin
    .from('dues_payments')
    .select('id, parent_id, athlete_id, amount_cents, amount_paid_cents, season')
    .eq('id', body.duesId)
    .single()

  if (error || !dues) {
    return NextResponse.json({ error: 'Dues record not found.' }, { status: 404 })
  }
  // The billed parent, or a co-guardian of that family, may pay these dues. A
  // co-guardian limited to certain wrestlers may pay only those wrestlers' dues.
  if (dues.parent_id !== auth.user.id) {
    const { data: link } = await admin
      .from('family_guardians')
      .select('id, athlete_ids')
      .eq('owner_id', dues.parent_id)
      .eq('guardian_id', auth.user.id)
      .maybeSingle()
    const covered = link && (link.athlete_ids === null || (!!dues.athlete_id && link.athlete_ids.includes(dues.athlete_id)))
    if (!covered) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const remainingCents = dues.amount_cents - dues.amount_paid_cents
  if (remainingCents <= 0) {
    return NextResponse.json({ error: 'These dues are already paid in full.' }, { status: 400 })
  }

  const amountCents = Math.min(remainingCents, Math.max(1, body.amountCents ?? remainingCents))
  const returnPath = safeReturnPath(body.returnPath, '/dues')

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: auth.user.email,
    success_url: returnUrl(siteOrigin, returnPath, 'checkout', 'success'),
    cancel_url: returnUrl(siteOrigin, returnPath, 'checkout', 'cancelled'),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: amountCents,
          product_data: { name: `${ORG.shortName} Club Dues: ${dues.season}` },
        },
      },
    ],
    metadata: { flow: 'dues', dues_id: dues.id },
  })

  return NextResponse.json({ url: session.url })
}

async function checkoutDonation(stripe: Stripe, body: DonationCheckoutBody, siteOrigin: string) {
  if (!Number.isFinite(body.amountCents)) {
    return NextResponse.json({ error: 'Enter a valid donation amount.' }, { status: 400 })
  }

  const amountCents = Math.max(100, Math.round(body.amountCents))
  const returnPath = safeReturnPath(body.returnPath, '/')

  const session = await stripe.checkout.sessions.create({
    mode: body.recurring ? 'subscription' : 'payment',
    customer_email: clean(body.donorEmail, 180) || undefined,
    success_url: thankYouUrl(siteOrigin),
    cancel_url: returnUrl(siteOrigin, returnPath, 'donation', 'cancelled'),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: amountCents,
          product_data: {
            name: body.recurring ? `Monthly booster gift to ${ORG.name}` : `Donation to ${ORG.name}`,
          },
          ...(body.recurring ? { recurring: { interval: 'month' as const } } : {}),
        },
      },
    ],
    metadata: {
      flow: 'donation',
      donor_name: clean(body.donorName, 160),
      recurring: body.recurring ? 'true' : 'false',
    },
  })

  return NextResponse.json({ url: session.url })
}

async function checkoutSponsor(stripe: Stripe, body: SponsorCheckoutBody, siteOrigin: string) {
  const admin = createAdminSupabase()
  const returnPath = safeReturnPath(body.returnPath, '/sponsorship')

  if (body.sponsorId) {
    const { data: sponsor, error } = await admin
      .from('sponsors')
      .select('id, name, tier, amount_cents, recurring, contact_email')
      .eq('id', body.sponsorId)
      .single()

    if (error || !sponsor) {
      return NextResponse.json({ error: 'Sponsor record not found.' }, { status: 404 })
    }
    if (!sponsor.amount_cents) {
      return NextResponse.json({ error: 'Sponsorship amount has not been set yet.' }, { status: 400 })
    }

    const tierLabel = sponsor.tier === 'yellow' ? 'Gold' : sponsor.tier.replaceAll('_', ' ')
    const session = await stripe.checkout.sessions.create({
      mode: sponsor.recurring ? 'subscription' : 'payment',
      customer_email: sponsor.contact_email ?? undefined,
      success_url: thankYouUrl(siteOrigin),
      cancel_url: returnUrl(siteOrigin, returnPath, 'sponsor', 'cancelled'),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: sponsor.amount_cents,
            product_data: { name: `${ORG.name} Sponsorship: ${tierLabel} tier` },
            ...(sponsor.recurring ? { recurring: { interval: 'month' as const } } : {}),
          },
        },
      ],
      metadata: { flow: 'sponsor', sponsor_id: sponsor.id },
    })

    return NextResponse.json({ url: session.url })
  }

  const sponsorName = clean(body.sponsorName, 160)
  const contactName = clean(body.contactName, 160)
  const contactEmail = clean(body.contactEmail, 180).toLowerCase()
  const tier = clean(body.tier, 40)

  if (!sponsorName || !contactName || !EMAIL_PATTERN.test(contactEmail) || !tier) {
    return NextResponse.json({ error: 'Complete the required sponsorship information.' }, { status: 400 })
  }

  // Price + label come from the sponsor_tiers table (the editable source of
  // truth), never the client, so a checkout always charges the current amount.
  const { data: tierRow } = await admin
    .from('sponsor_tiers')
    .select('slug, label, price_cents, public_checkout, active')
    .eq('slug', tier as SponsorTier)
    .maybeSingle()

  if (!tierRow || !tierRow.active || !tierRow.public_checkout || tierRow.price_cents == null) {
    return NextResponse.json({ error: 'Select a valid sponsorship level.' }, { status: 400 })
  }

  const websiteUrl = safeWebsiteUrl(body.websiteUrl)
  if (body.websiteUrl && !websiteUrl) {
    return NextResponse.json({ error: 'Enter a valid website URL beginning with http:// or https://.' }, { status: 400 })
  }

  const level = { amountCents: tierRow.price_cents, label: tierRow.label }
  const { data: sponsor, error: createError } = await admin
    .from('sponsors')
    .insert({
      name: sponsorName,
      tier: tierRow.slug,
      contact_name: contactName,
      contact_email: contactEmail,
      website_url: websiteUrl,
      amount_cents: level.amountCents,
      recurring: false,
      active: false,
      notes: 'Created through public sponsorship checkout.',
    })
    .select('id')
    .single()

  if (createError || !sponsor) {
    throw createError ?? new Error('Unable to create sponsor record.')
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: contactEmail,
      success_url: thankYouUrl(siteOrigin),
      cancel_url: returnUrl(siteOrigin, returnPath, 'sponsor', 'cancelled'),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: level.amountCents,
            product_data: { name: `${ORG.name} Sponsorship: ${level.label} tier` },
          },
        },
      ],
      metadata: { flow: 'sponsor', sponsor_id: sponsor.id },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    await admin.from('sponsors').delete().eq('id', sponsor.id)
    throw error
  }
}
