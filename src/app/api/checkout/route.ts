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
  amountCents?: number // defaults to the full remaining balance
}

interface DonationCheckoutBody {
  flow: 'donation'
  amountCents: number
  recurring?: boolean
  donorEmail?: string
  donorName?: string
}

interface SponsorCheckoutBody {
  flow: 'sponsor'
  sponsorId: string
}

type CheckoutBody = DuesCheckoutBody | DonationCheckoutBody | SponsorCheckoutBody

export async function POST(request: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return NextResponse.json({ error: 'Stripe is not configured yet.' }, { status: 500 })
  }

  const body = (await request.json()) as CheckoutBody
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
  if (dues.parent_id !== auth.user.id) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
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
          product_data: { name: `${ORG.shortName} Club Dues — ${dues.season}` },
        },
      },
    ],
    metadata: { flow: 'dues', dues_id: dues.id },
  })

  return NextResponse.json({ url: session.url })
}

async function checkoutDonation(stripe: Stripe, body: DonationCheckoutBody, siteOrigin: string) {
  const amountCents = Math.max(100, Math.round(body.amountCents))

  const session = await stripe.checkout.sessions.create({
    mode: body.recurring ? 'subscription' : 'payment',
    customer_email: body.donorEmail,
    success_url: `${siteOrigin}/?donation=success`,
    cancel_url: `${siteOrigin}/?donation=cancelled`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: amountCents,
          product_data: { name: `Donation to ${ORG.name}` },
          ...(body.recurring ? { recurring: { interval: 'month' } } : {}),
        },
      },
    ],
    metadata: { flow: 'donation', donor_name: body.donorName ?? '' },
  })

  return NextResponse.json({ url: session.url })
}

async function checkoutSponsor(stripe: Stripe, body: SponsorCheckoutBody, siteOrigin: string) {
  const admin = createAdminSupabase()
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

  const session = await stripe.checkout.sessions.create({
    mode: sponsor.recurring ? 'subscription' : 'payment',
    customer_email: sponsor.contact_email ?? undefined,
    success_url: `${siteOrigin}/sponsors?sponsor=success`,
    cancel_url: `${siteOrigin}/sponsors?sponsor=cancelled`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: sponsor.amount_cents,
          product_data: { name: `${ORG.name} Sponsorship — ${sponsor.tier} tier` },
          ...(sponsor.recurring ? { recurring: { interval: 'month' } } : {}),
        },
      },
    ],
    metadata: { flow: 'sponsor', sponsor_id: sponsor.id },
  })

  return NextResponse.json({ url: session.url })
}
