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

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const flow = session.metadata?.flow
        if (flow === 'dues') await handleDuesFlow(session)
        else if (flow === 'donation') await handleDonationFlow(session)
        else if (flow === 'sponsor') await handleSponsorFlow(session)
        else console.warn('Stripe checkout.session.completed with unrecognized flow:', flow, session.id)
        break
      }
      // Recurring donations and sponsorships only get recorded once, at signup,
      // by the checkout.session.completed handlers above. Every renewal after
      // that is a fresh invoice with billing_reason 'subscription_cycle' -- this
      // is the only signal that a recurring gift or sponsorship kept paying.
      case 'invoice.paid': {
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        break
      }
      // A recurring sponsorship whose card fails or gets cancelled must stop
      // showing on /partners and the header ticker -- nothing else clears it.
      case 'customer.subscription.deleted': {
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      }
      // Keeps dues records honest if a refund happens straight from the Stripe
      // dashboard instead of through the app.
      case 'charge.refunded': {
        await handleChargeRefunded(event.data.object as Stripe.Charge)
        break
      }
      case 'charge.dispute.created': {
        await handleDisputeCreated(event.data.object as Stripe.Dispute)
        break
      }
      default:
        return NextResponse.json({ received: true, ignored: true })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`Stripe webhook handler failed for event "${event.type}":`, err)
    await sendAlert(`Stripe webhook handler failed (event: ${event.type})`, {
      eventId: event.id,
      error: message,
    })

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
  const recurring = session.mode === 'subscription'

  if (amountCents <= 0) {
    throw new Error(`Stripe donation checkout ${session.id} has an invalid payment amount.`)
  }

  const { error } = await supabase.from('donations').insert({
    donor_name: customerName,
    donor_email: customerEmail,
    amount_cents: amountCents,
    recurring,
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id:
      typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null,
    stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null,
    stripe_subscription_id:
      typeof session.subscription === 'string' ? session.subscription : session.subscription?.id ?? null,
  })

  if (error) throw error

  if (customerEmail) {
    await sendDonationThankYouEmail({ to: customerEmail, name: customerName, amountCents, recurring })
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
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      active: true,
    })
    .eq('id', sponsorId)
    .select('name, tier, amount_cents, contact_email, contact_name')
    .single()

  if (updateError || !sponsor) {
    throw new Error(`Sponsor record not found for ${sponsorId}: ${updateError?.message ?? 'unknown error'}`)
  }

  await sendSponsorThankYouLetter({
    sponsorName: sponsor.name,
    tier: sponsor.tier === 'yellow' ? 'Gold' : sponsor.tier,
    amountCents: sponsor.amount_cents ?? session.amount_total ?? 0,
    contactEmail: sponsor.contact_email,
    contactName: sponsor.contact_name,
    sponsorId,
  })
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // 'subscription_create' is the first invoice on a new subscription -- that
  // payment is already recorded by handleDonationFlow/handleSponsorFlow off the
  // matching checkout.session.completed event. Only renewals land here.
  if (invoice.billing_reason !== 'subscription_cycle') return

  const subscriptionId =
    typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id ?? null
  if (!subscriptionId) return

  const paymentIntentId =
    typeof invoice.payment_intent === 'string' ? invoice.payment_intent : invoice.payment_intent?.id ?? null
  const amountCents = invoice.amount_paid

  const supabase = createAdminSupabase()

  const { data: donation } = await supabase
    .from('donations')
    .select('id')
    .eq('stripe_subscription_id', subscriptionId)
    .limit(1)
    .maybeSingle()

  if (donation) {
    // Stripe retries webhook deliveries; skip if this renewal was already logged.
    if (paymentIntentId) {
      const { data: existing } = await supabase
        .from('donations')
        .select('id')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .maybeSingle()
      if (existing) return
    }

    const { error } = await supabase.from('donations').insert({
      donor_name: invoice.customer_name ?? null,
      donor_email: invoice.customer_email ?? null,
      amount_cents: amountCents,
      recurring: true,
      stripe_payment_intent_id: paymentIntentId,
      stripe_customer_id: typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id ?? null,
      stripe_subscription_id: subscriptionId,
    })
    if (error) throw error
    return
  }

  const { data: sponsor } = await supabase
    .from('sponsors')
    .select('name')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle()

  if (sponsor) {
    // Sponsors have no payment ledger table -- surface renewals as an alert
    // rather than inventing a schema change for it.
    await sendAlert('Recurring sponsorship payment received', {
      sponsor: sponsor.name,
      amount: `$${(amountCents / 100).toFixed(2)}`,
      invoiceId: invoice.id,
    })
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = createAdminSupabase()

  const { data: sponsor, error } = await supabase
    .from('sponsors')
    .update({ active: false })
    .eq('stripe_subscription_id', subscription.id)
    .select('name, contact_email')
    .maybeSingle()

  if (error) throw error
  if (!sponsor) return

  await sendAlert('Recurring sponsorship ended', {
    sponsor: sponsor.name,
    contactEmail: sponsor.contact_email,
    subscriptionId: subscription.id,
  })
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id ?? null
  if (!paymentIntentId) return

  const supabase = createAdminSupabase()
  // charge.amount_refunded is the cumulative total refunded on this charge, so
  // charge.amount - charge.amount_refunded is the amount still actually paid --
  // recomputing it this way (rather than decrementing) stays correct even if
  // Stripe redelivers this event.
  const stillPaidCents = Math.max(0, charge.amount - charge.amount_refunded)

  const { data: dues } = await supabase
    .from('dues_payments')
    .select('id, amount_cents')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .maybeSingle()

  if (dues) {
    const status = stillPaidCents <= 0 ? 'pending' : stillPaidCents < dues.amount_cents ? 'partial' : 'paid'
    const { error } = await supabase
      .from('dues_payments')
      .update({ amount_paid_cents: stillPaidCents, status })
      .eq('id', dues.id)
    if (error) throw error
    return
  }

  // Donations are an append-only gift log (tax receipts may already reference
  // them) and sponsors have no stored payment_intent -- flag both for a human
  // to reconcile rather than silently rewriting the record.
  await sendAlert('Stripe charge refunded (no matching dues record)', {
    paymentIntentId,
    amountRefunded: `$${(charge.amount_refunded / 100).toFixed(2)}`,
    receiptEmail: charge.receipt_email,
  })
}

async function handleDisputeCreated(dispute: Stripe.Dispute) {
  const paymentIntentId =
    typeof dispute.payment_intent === 'string' ? dispute.payment_intent : dispute.payment_intent?.id ?? null

  await sendAlert('Stripe payment disputed', {
    paymentIntentId,
    amount: `$${(dispute.amount / 100).toFixed(2)}`,
    reason: dispute.reason,
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
  recurring: boolean
}) {
  const resend = getResend()
  if (!resend) return

  const amount = `$${(params.amountCents / 100).toFixed(2)}`
  const recurringLine = params.recurring
    ? ' This is a recurring monthly gift. Thank you for the ongoing support.'
    : ''

  await resend.emails
    .send({
      from: FROM_ADDRESS,
      to: [params.to],
      bcc: [ADMIN_EMAIL],
      subject: `Thank you for supporting ${ORG.name}`,
      html: `<p>Dear ${params.name ?? 'Friend of the Wizards'},</p><p>Thank you for your generous donation of <strong>${amount}</strong> to ${ORG.name}.${recurringLine}</p><p>Your support helps our wrestlers compete and grow.</p>`,
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
