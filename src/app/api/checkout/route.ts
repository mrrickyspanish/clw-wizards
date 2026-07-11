import { NextResponse } from 'next/server'
import type Stripe from 'stripe'

import { getStripeClient } from '@/lib/stripe'
import { sendAlert } from '@/lib/alerts'
import { createServerSupabase } from '@/lib/supabase/server'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { ORG } from '@/config/org.config'

interface DuesCheckoutBody {
  flow: 'dues'
  duesId: string
  amountCents?: number
}

interface DonationCheckoutBody {
  flow: 'donation'
  amountCents: number
  recurring?: boolean
  donorEmail?: string
  donorName?: string
  returnPath?: string
}

type PublicSponsorTier = 'white' | 'black' | 'yellow' | 'platinum'

interface SponsorCheckoutBody {
  flow: 'sponsor'
  sponsorId?: string
  sponsorName?: string
  contactName?: string
  contactEmail?: string
  websiteUrl?: string
  tier?: PublicSponsorTier
  returnPath?: string
}

type CheckoutBody = DuesCheckoutBody | DonationCheckoutBody | SponsorCheckoutBody

const PUBLIC_SPONSOR_LEVELS: Record<PublicSponsorTier, { amountCents: number; label: string }> = {
  white: { amountCents: 15000, label: 'White' },
  black: { amountCents: 25000, label: 'Black' },
  yellow: { amountCents: 50000, label: 'Gold' },
  platinum: { amountCents: 100000, label: 'Platinum' },
}

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

export async function POST(request: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return NextResponse.json({ error: 'Stripe is not configured yet.' }, { status: 500 })
  }

  let body: CheckoutBody
  try {
    body = (await request.json()) as CheckoutBody
  } catch {
    return NextResponse.json({ error: 'Invalid checkout request.' }, { status: 400 })
  }

  const url = new URL(request.url)
  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin
  const stripe = getStripeClient()

  try {
    if (body.flow === 'dues') return await checkoutDues(stripe, body, siteOrigin)
    if (body.flow === 'donation') return await checkoutDonation(stripe, body, siteOrigin)
    if (body.flow === 'sponsor') return await checkoutSponsor(stripe, body, siteOrigin)
  } catch (err) {
    console.error('Stripe checkout session creation failed:', err)
    await sendAlert('Stripe checkout session creation failed', {
      flow: (body as CheckoutBody).flow,
      error: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ error: 'Unable to start checkout. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ error: 'Unknown checkout flow.' }, { status: 400 })
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
    .select('id, parent_id, amount_cents, amount_paid_cents, season')
    .eq('id', body.duesId)
    .single()

  if (error || !dues) {
    return NextResponse.json({ error: 'Dues record not found.' }, { status: 404 })
  }
  // The billed parent, or a co-guardian of that family, may pay these dues.
  if (dues.parent_id !== auth.user.id) {
    const { data: link } = await admin
      .from('family_guardians')
      .select('id')
      .eq('owner_id', dues.parent_id)
      .eq('guardian_id', auth.user.id)
      .maybeSingle()
    if (!link) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const remainingCents = dues.amount_cents - dues.amount_paid_cents
  if (remainingCents <= 0) {
    return NextResponse.json({ error: 'These dues are already paid in full.' }, { status: 400 })
  }

  const amountCents = Math.min(remainingCents, Math.max(1, body.amountCents ?? remainingCents))

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: auth.user.email,
    success_url: `${siteOrigin}/dues?checkout=success`,
    cancel_url: `${siteOrigin}/dues?checkout=cancelled`,
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
    success_url: returnUrl(siteOrigin, returnPath, 'donation', 'success'),
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
      success_url: returnUrl(siteOrigin, returnPath, 'sponsor', 'success'),
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
  const tier = body.tier

  if (!sponsorName || !contactName || !EMAIL_PATTERN.test(contactEmail) || !tier || !PUBLIC_SPONSOR_LEVELS[tier]) {
    return NextResponse.json({ error: 'Complete the required sponsorship information.' }, { status: 400 })
  }

  const websiteUrl = safeWebsiteUrl(body.websiteUrl)
  if (body.websiteUrl && !websiteUrl) {
    return NextResponse.json({ error: 'Enter a valid website URL beginning with http:// or https://.' }, { status: 400 })
  }

  const level = PUBLIC_SPONSOR_LEVELS[tier]
  const { data: sponsor, error: createError } = await admin
    .from('sponsors')
    .insert({
      name: sponsorName,
      tier,
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
      success_url: returnUrl(siteOrigin, returnPath, 'sponsor', 'success'),
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
