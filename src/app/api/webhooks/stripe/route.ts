import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { Resend } from 'resend'

import { getStripeClient } from '@/lib/stripe'
import { sendAlert } from '@/lib/alerts'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { ORG } from '@/config/org.config'

const ADMIN_EMAIL = process.env.ALERT_EMAIL ?? ORG.contactEmail

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Stripe webhook is not configured.' }, { status: 500 })
  }

  const body = await request.text()
  const sig = request.headers.get('stripe-signature')
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header.' }, { status: 400 })
  }

  const stripe = getStripeClient()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook verification failed.'
    console.error('Stripe webhook verification error:', message)
    await sendAlert('Stripe webhook signature verification failed', { message })
    return NextResponse.json({ error: message }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true, ignored: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const flow = session.metadata?.flow

  try {
    if (flow === 'dues') {
      await handleDuesFlow(session)
    } else if (flow === 'donation') {
      await handleDonationFlow(session)
    } else if (flow === 'sponsor') {
      await handleSponsorFlow(session)
    } else {
      console.warn('Stripe checkout.session.completed with unrecognized flow:', flow, session.id)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`Stripe webhook handler failed for flow "${flow}":`, err)
    await sendAlert(`Stripe webhook handler failed (flow: ${flow ?? 'unknown'})`, {
      eventId: event.id,
      sessionId: session.id,
      error: message,
    })

    // Returning a non-2xx response is intentional. Stripe will retry the event,
    // which protects against a successful charge being lost after a transient
    // Supabase or application failure.
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleDuesFlow(session: Stripe.Checkout.Session) {
  const supabase = createAdminSupabase()
  const duesId = session.metadata?.dues_id
  const amountPaidCents = session.amount_total ?? 0

  if (!duesId) {
    throw new Error(`Stripe dues checkout ${session.id} is missing dues_id metadata.`)
  }
  if (amountPaidCents <= 0) {
    throw new Error(`Stripe dues checkout ${session.id} has an invalid payment amount.`)
  }

  const { data: dues, error: fetchError } = await supabase
    .from('dues_payments')
    .select('amount_cents, amount_paid_cents, parent_id, stripe_checkout_session_id')
    .eq('id', duesId)
    .single()

  if (fetchError || !dues) {
    throw new Error(`Dues record not found for ${duesId}: ${fetchError?.message ?? 'unknown error'}`)
  }

  // Stripe may deliver the same event more than once. If this checkout session
  // was already applied, acknowledge it without adding the payment again or
  // sending a duplicate receipt.
  if (dues.stripe_checkout_session_id === session.id) return

  const newAmountPaid = Math.min(dues.amount_cents, dues.amount_paid_cents + amountPaidCents)
  const status = newAmountPaid >= dues.amount_cents ? 'paid' : 'partial'
  const paymentIntentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null

  let updateQuery = supabase
    .from('dues_payments')
    .update({
      amount_paid_cents: newAmountPaid,
      status,
      stripe_payment_intent_id: paymentIntentId,
      stripe_checkout_session_id: session.id,
    })
    .eq('id', duesId)

  // Compare-and-set prevents two simultaneous deliveries of the same event from
  // both applying the amount. The losing request returns 500 and is retried.
  updateQuery = dues.stripe_checkout_session_id
    ? updateQuery.eq('stripe_checkout_session_id', dues.stripe_checkout_session_id)
    : updateQuery.is('stripe_checkout_session_id', null)

  const { data: updated, error: updateError } = await updateQuery.select('id').maybeSingle()
  if (updateError) throw updateError
  if (!updated) throw new Error(`Dues record ${duesId} changed while Stripe event ${session.id} was processing.`)

  const customerEmail = session.customer_details?.email ?? session.customer_email
  if (customerEmail) {
    await sendDuesConfirmationEmail({
      to: customerEmail,
      amountPaidCents,
      status,
      sessionId: session.id,
    })
  }
}

async function handleDonationFlow(session: Stripe.Checkout.Session) {
  const supabase = createAdminSupabase()

  const { data: existing, error: existingError } = await supabase
    .from('donations')
    .select('id')
    .eq('stripe_checkout_session_id', session.id)
    .maybeSingle()

  if (existingError) throw existingError
  if (existing) return

  const customerEmail = session.customer_details?.email ?? session.customer_email ?? null
  const customerName = session.customer_details?.name ?? session.metadata?.donor_name ?? null
  const amountCents = session.amount_total ?? 0

  if (amountCents <= 0) {
    throw new Error(`Stripe donation checkout ${session.id} has an invalid payment amount.`)
  }

  const { error } = await supabase.from('donations').insert({
    donor_name: customerName,
    donor_email: customerEmail,
    amount_cents: amountCents,
    recurring: false,
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id:
      typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null,
    stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null,
    stripe_subscription_id: null,
  })

  if (error) throw error

  if (customerEmail) {
    await sendDonationThankYouEmail({ to: customerEmail, name: customerName, amountCents })
  }
}

async function handleSponsorFlow(session: Stripe.Checkout.Session) {
  const supabase = createAdminSupabase()
  const sponsorId = session.metadata?.sponsor_id

  if (!sponsorId) {
    throw new Error(`Stripe sponsor checkout ${session.id} is missing sponsor_id metadata.`)
  }

  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null
  const subscriptionId =
    typeof session.subscription === 'string' ? session.subscription : session.subscription?.id ?? null

  const { data: sponsor, error: updateError } = await supabase
    .from('sponsors')
    .update({ stripe_customer_id: customerId, stripe_subscription_id: subscriptionId })
    .eq('id', sponsorId)
    .select('name, tier, amount_cents, contact_email, contact_name')
    .single()

  if (updateError || !sponsor) {
    throw new Error(`Sponsor record not found for ${sponsorId}: ${updateError?.message ?? 'unknown error'}`)
  }

  await sendSponsorThankYouLetter({
    sponsorName: sponsor.name,
    tier: sponsor.tier,
    amountCents: sponsor.amount_cents ?? session.amount_total ?? 0,
    contactEmail: sponsor.contact_email,
    contactName: sponsor.contact_name,
    sponsorId,
  })
}

function getResend() {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    console.warn('RESEND_API_KEY not set - skipping confirmation email.')
    return null
  }
  return new Resend(resendKey)
}

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL ?? `${ORG.shortName} <onboarding@resend.dev>`

async function sendDuesConfirmationEmail(params: {
  to: string
  amountPaidCents: number
  status: string
  sessionId: string
}) {
  const resend = getResend()
  if (!resend) return

  const amount = `$${(params.amountPaidCents / 100).toFixed(2)}`
  const statusLine =
    params.status === 'paid' ? 'Your dues are now fully paid.' : 'This payment has been applied to your balance.'

  await resend.emails
    .send({
      from: FROM_ADDRESS,
      to: [params.to],
      subject: `${ORG.shortName} - Dues payment received`,
      html: `<p>Thank you! We received your payment of <strong>${amount}</strong>.</p><p>${statusLine}</p><p style="color:#999;font-size:12px;">Reference: ${params.sessionId.slice(-12).toUpperCase()}</p>`,
    })
    .catch((err) =>
      sendAlert('Dues confirmation email failed', { sessionId: params.sessionId, error: String(err) })
    )
}

async function sendDonationThankYouEmail(params: {
  to: string
  name: string | null
  amountCents: number
}) {
  const resend = getResend()
  if (!resend) return

  const amount = `$${(params.amountCents / 100).toFixed(2)}`

  await resend.emails
    .send({
      from: FROM_ADDRESS,
      to: [params.to],
      bcc: [ADMIN_EMAIL],
      subject: `Thank you for supporting ${ORG.name}`,
      html: `<p>Dear ${params.name ?? 'Friend of the Wizards'},</p><p>Thank you for your generous donation of <strong>${amount}</strong> to ${ORG.name}.</p><p>Your support helps our wrestlers compete and grow.</p>`,
    })
    .catch((err) => sendAlert('Donation thank-you email failed', { to: params.to, error: String(err) }))
}

async function sendSponsorThankYouLetter(params: {
  sponsorName: string
  tier: string
  amountCents: number
  contactEmail: string | null
  contactName: string | null
  sponsorId: string
}) {
  const resend = getResend()
  if (!resend) return

  const amount = `$${(params.amountCents / 100).toFixed(2)}`
  const taxYear = new Date().getFullYear()
  const recipients = [params.contactEmail, ADMIN_EMAIL].filter((e): e is string => Boolean(e))

  if (!recipients.length) return

  await resend.emails
    .send({
      from: FROM_ADDRESS,
      to: recipients,
      subject: `Thank you for sponsoring ${ORG.name} - ${params.tier} tier`,
      html: `<p>Dear ${params.contactName ?? params.sponsorName},</p>
<p>On behalf of ${ORG.name}, thank you for your sponsorship of <strong>${amount}</strong> at the <strong>${params.tier}</strong> level for the ${taxYear} season.</p>
<p>${ORG.name} is a 501(c)(3) nonprofit organization. No goods or services were provided in exchange for this contribution; it is tax-deductible to the full extent allowed by law. Please retain this letter for your tax records.</p>
<p>Tax Year: ${taxYear}<br/>Sponsor: ${params.sponsorName}</p>
<p>With gratitude,<br/>${ORG.name}</p>`,
    })
    .catch((err) => sendAlert('Sponsor thank-you letter failed', { sponsorId: params.sponsorId, error: String(err) }))
}
