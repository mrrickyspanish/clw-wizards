import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { Resend } from 'resend'

import { getStripeClient } from '@/lib/stripe'
import { sendAlert } from '@/lib/alerts'
import { createAdminSupabase } from '@/lib/supabase/admin'
import { formatCents } from '@/lib/format/money'
import { ORG } from '@/config/org.config'
import {
  duesPaymentNotice,
  giftNotice,
  moneyOutNotice,
  sendPaymentNotice,
  tournamentPaymentNotice,
  tournamentRefundNotice,
} from '@/lib/payments/notice'

const ADMIN_EMAIL = process.env.ALERT_EMAIL ?? ORG.contactEmail

export async function POST(request: Request) {
  // Trimmed for the same reason as the secret key in lib/stripe.ts: a signing
  // secret pasted into a hosting dashboard often carries a trailing newline,
  // and the resulting failure reads as a signature mismatch, which sends you
  // looking at the payload instead of at the env var.
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim()
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
      // A bank payment (if one is ever turned on in Stripe) completes the
      // checkout before the money arrives; it is recorded when it clears.
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.metadata?.flow === 'dues') await handleDuesFlow(session)
        else if (session.metadata?.flow === 'tournament') await handleTournamentFlow(session)
        break
      }
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.metadata?.flow === 'dues') {
          await sendAlert('Dues bank payment failed', { sessionId: session.id, duesId: session.metadata?.dues_id })
        } else if (session.metadata?.flow === 'tournament') {
          await sendAlert('Tournament entry bank payment failed: the entries still show payment due', {
            sessionId: session.id,
            checkoutId: session.metadata?.checkout_id,
          })
        }
        break
      }
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const flow = session.metadata?.flow
        if (flow === 'dues') await handleDuesFlow(session)
        else if (flow === 'donation') await handleDonationFlow(session)
        else if (flow === 'sponsor') await handleSponsorFlow(session)
        else if (flow === 'tournament') await handleTournamentFlow(session)
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
      // A recurring donor or sponsor's card declined on renewal. Distinct from
      // customer.subscription.deleted, which only fires once Stripe's own
      // retry schedule (Smart Retries, over the following weeks) finally gives
      // up -- this is the first signal anything went wrong, and the only one a
      // donor sees before then.
      case 'invoice.payment_failed': {
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
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
  // Only money that has arrived counts toward the balance. A card payment is
  // 'paid' here; a bank payment is 'unpaid' until it clears, and then
  // checkout.session.async_payment_succeeded brings it back here.
  if (session.payment_status !== 'paid') {
    await sendAlert('Dues payment started but not yet received', {
      sessionId: session.id,
      duesId,
      paymentStatus: session.payment_status,
      amount: formatCents(amountPaidCents),
    })
    return
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null

  // One step in the database: the payment is kept in dues_charges (once per
  // checkout, however often Stripe sends this event) and added to the balance.
  // A family on a payment plan can pay several times, so every payment counts
  // on its own, not just the latest.
  const { data: rows, error } = await supabase.rpc('record_dues_charge', {
    _dues: duesId,
    _session: session.id,
    _intent: paymentIntentId,
    _amount: amountPaidCents,
  })
  if (error) throw new Error(`Could not record dues payment ${session.id}: ${error.message}`)
  const dues = (rows ?? [])[0]
  if (!dues) throw new Error(`Dues record not found for ${duesId}`)
  if (!dues.applied) return

  // Two checkouts open at once (two tabs, two parents) can both be paid. The
  // record stops at the amount billed, so say so: the extra needs a refund.
  const { data: charges } = await supabase.from('dues_charges').select('net_cents').eq('dues_id', duesId)
  const cardTotal = (charges ?? []).reduce((sum, c) => sum + c.net_cents, 0)
  if (cardTotal > dues.amount_cents) {
    await sendAlert('Dues overpaid: refund the extra in Stripe', {
      duesId,
      billed: formatCents(dues.amount_cents),
      paidByCard: formatCents(cardTotal),
      sessionId: session.id,
    })
  }

  await noticeDuesPayment({
    parentId: dues.parent_id,
    athleteId: dues.athlete_id,
    season: dues.season,
    amountCents: dues.amount_cents,
    paidNowCents: amountPaidCents,
    paidTotalCents: dues.amount_paid_cents,
  })

  const customerEmail = session.customer_details?.email ?? session.customer_email
  if (customerEmail) {
    await sendDuesConfirmationEmail({
      to: customerEmail,
      amountPaidCents,
      status: dues.status,
      remainingCents: Math.max(0, dues.amount_cents - dues.amount_paid_cents),
      sessionId: session.id,
    })
  }
}

/**
 * In-house tournament entries (B4). The checkout route made one
 * tournament_checkouts row per Stripe session and put its id in the metadata.
 * record_tournament_payment applies it once: a repeated event comes back
 * applied = false and sends nothing.
 */
async function handleTournamentFlow(session: Stripe.Checkout.Session) {
  const supabase = createAdminSupabase()
  const checkoutId = session.metadata?.checkout_id
  const amountPaidCents = session.amount_total ?? 0

  if (!checkoutId) {
    throw new Error(`Stripe tournament checkout ${session.id} is missing checkout_id metadata.`)
  }
  if (amountPaidCents <= 0) {
    throw new Error(`Stripe tournament checkout ${session.id} has an invalid payment amount.`)
  }
  if (session.payment_status !== 'paid') {
    await sendAlert('Tournament entry payment started but not yet received', {
      sessionId: session.id,
      checkoutId,
      paymentStatus: session.payment_status,
      amount: formatCents(amountPaidCents),
    })
    return
  }

  const { data: stored, error: storedError } = await supabase
    .from('tournament_checkouts')
    .select('id, status, stripe_checkout_session_id, registration_ids')
    .eq('id', checkoutId)
    .maybeSingle()
  if (storedError) throw new Error(`Could not read tournament checkout ${checkoutId}: ${storedError.message}`)
  if (!stored) {
    throw new Error(`Tournament payment ${session.id} was taken but checkout ${checkoutId} does not exist.`)
  }
  // The function would quietly store this session over the one saved at
  // checkout. That should never happen (one row per session), so say so.
  if (stored.status === 'pending' && stored.stripe_checkout_session_id && stored.stripe_checkout_session_id !== session.id) {
    await sendAlert('Tournament payment arrived under a different Stripe session than the checkout saved', {
      checkoutId,
      savedSessionId: stored.stripe_checkout_session_id,
      paidSessionId: session.id,
    })
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null

  const { data: rows, error } = await supabase.rpc('record_tournament_payment', {
    _checkout: checkoutId,
    _session: session.id,
    _intent: paymentIntentId,
    _amount: amountPaidCents,
  })
  // Money was taken and is not recorded yet. Failing makes Stripe retry, and
  // the handler's alert tells the club why (for example a registration with
  // no locked price).
  if (error) throw new Error(`Tournament payment ${session.id} was taken but could not be recorded: ${error.message}`)
  const result = (rows ?? [])[0]
  if (!result) throw new Error(`Tournament payment ${session.id} was taken but checkout ${checkoutId} returned nothing.`)

  if (!result.applied) {
    // Stripe sent the same payment again: nothing to do. A different session
    // on a settled checkout is a second payment that nothing recorded.
    if (result.session_mismatch) {
      await sendAlert('Tournament payment received for a checkout that was already paid: refund or reconcile in Stripe', {
        checkoutId,
        tournament: result.tournament_name,
        sessionId: session.id,
        amount: formatCents(amountPaidCents),
      })
    }
    return
  }

  if (amountPaidCents !== result.amount_cents) {
    await sendAlert('Tournament payment amount differs from the checkout', {
      checkoutId,
      tournament: result.tournament_name,
      expected: formatCents(result.amount_cents),
      paid: formatCents(amountPaidCents),
      sessionId: session.id,
    })
  }
  if (result.overpay) {
    await sendAlert('Tournament entry overpaid: refund the extra in Stripe', {
      checkoutId,
      tournament: result.tournament_name,
      paid: formatCents(amountPaidCents),
      detail: 'At least one entry already showed paid, cash, check or waived before this card payment.',
      sessionId: session.id,
    })
  }
  const expectedEntries = stored.registration_ids?.length ?? result.athlete_ids.length
  if (result.registrations_marked < expectedEntries) {
    await sendAlert('Tournament payment marked fewer entries paid than it covers', {
      checkoutId,
      tournament: result.tournament_name,
      covers: expectedEntries,
      markedPaid: result.registrations_marked,
      detail: 'An entry was removed before payment, or an admin had already marked it cash, check or waived. Check the roster.',
      sessionId: session.id,
    })
  }

  const names = await tournamentNames(result.payer_id, result.athlete_ids)
  try {
    await sendPaymentNotice(
      tournamentPaymentNotice({
        payerName: names.payer,
        wrestlerNames: names.wrestlers,
        entries: expectedEntries,
        tournamentName: result.tournament_name,
        tournamentId: result.tournament_id,
        paidCents: amountPaidCents,
      })
    )
  } catch (err) {
    console.error('Tournament payment notice failed:', err)
  }

  const customerEmail = session.customer_details?.email ?? session.customer_email
  if (customerEmail) {
    await sendTournamentReceiptEmail({
      to: customerEmail,
      amountPaidCents,
      tournamentName: result.tournament_name,
      wrestlerNames: names.wrestlers,
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

  await sendPaymentNotice(giftNotice({ kind: 'donation', name: customerName, email: customerEmail, amountCents, recurring }))

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

  await sendPaymentNotice(
    giftNotice({
      kind: 'sponsorship',
      name: sponsor.name,
      email: sponsor.contact_email,
      amountCents: sponsor.amount_cents ?? session.amount_total ?? 0,
      recurring: Boolean(subscriptionId),
      tier: sponsor.tier === 'yellow' ? 'Gold' : sponsor.tier,
    })
  )

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

    await sendPaymentNotice(
      giftNotice({ kind: 'donation', name: invoice.customer_name ?? null, email: invoice.customer_email ?? null, amountCents, recurring: true, renewal: true })
    )

    // The first receipt tells a monthly giver they will get one of these each
    // month, so every renewal has to actually send it.
    if (invoice.customer_email) {
      await sendDonationThankYouEmail({
        to: invoice.customer_email,
        name: invoice.customer_name ?? null,
        amountCents,
        recurring: true,
      })
    }
    return
  }

  const { data: sponsor } = await supabase
    .from('sponsors')
    .select('name')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle()

  if (sponsor) {
    await sendPaymentNotice(
      giftNotice({ kind: 'sponsorship', name: sponsor.name, email: null, amountCents, recurring: true, renewal: true })
    )
    // Sponsors have no payment ledger table -- surface renewals as an alert
    // rather than inventing a schema change for it.
    await sendAlert('Recurring sponsorship payment received', {
      sponsor: sponsor.name,
      amount: formatCents(amountCents),
      invoiceId: invoice.id,
    })
  }
}

/**
 * Stripe retries a failed subscription charge automatically over roughly the
 * following few weeks (Smart Retries) before finally giving up and firing
 * customer.subscription.deleted. This event fires on every attempt in that
 * cycle, not just the first -- acting on all of them would mean re-emailing
 * the same donor for the same failure every few days. attempt_count is
 * Stripe's own count of authorization attempts on this invoice; > 1 means
 * this is a retry of a failure already handled.
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (invoice.billing_reason !== 'subscription_cycle') return
  if ((invoice.attempt_count ?? 0) > 1) return

  const subscriptionId =
    typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id ?? null
  if (!subscriptionId) return

  const supabase = createAdminSupabase()
  const amountCents = invoice.amount_due

  const { data: donation } = await supabase
    .from('donations')
    .select('id, donor_name')
    .eq('stripe_subscription_id', subscriptionId)
    .limit(1)
    .maybeSingle()

  if (donation) {
    if (invoice.customer_email) {
      await sendDonationPaymentFailedEmail({
        to: invoice.customer_email,
        name: invoice.customer_name ?? donation.donor_name,
        amountCents,
      })
    }
    await sendPaymentNotice(
      moneyOutNotice({ kind: 'failed', who: invoice.customer_name ?? donation.donor_name ?? invoice.customer_email ?? null, amountCents, detail: 'Recurring donation.' })
    )
    await sendAlert('Recurring donation payment failed', {
      donor: invoice.customer_email ?? donation.donor_name ?? 'unknown',
      amount: formatCents(amountCents),
      invoiceId: invoice.id,
    })
    return
  }

  const { data: sponsor } = await supabase
    .from('sponsors')
    .select('name, contact_email')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle()

  if (sponsor) {
    // Sponsor relationships are handled personally, same as a cancellation in
    // handleSubscriptionDeleted -- alert admin to follow up directly rather
    // than send an automated dunning email to a paying sponsor.
    await sendPaymentNotice(
      moneyOutNotice({ kind: 'failed', who: sponsor.name, amountCents, detail: 'Recurring sponsorship. Reach out to the sponsor directly.' })
    )
    await sendAlert('Recurring sponsorship payment failed', {
      sponsor: sponsor.name,
      contactEmail: sponsor.contact_email,
      amount: formatCents(amountCents),
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

  // A dues payment: take off only what this refund changed on that one
  // payment, so other payments on the same dues stay counted.
  const { data: refundRows, error: refundError } = await supabase.rpc('record_dues_refund', {
    _intent: paymentIntentId,
    _net: stillPaidCents,
  })
  if (refundError) throw refundError
  const refunded = (refundRows ?? [])[0]
  if (refunded?.found) {
    // Stripe can redeliver this event; only a refund that changed the balance is news.
    if (refunded.changed && refunded.parent_id && refunded.amount_cents !== null && refunded.paid_before_cents !== null && refunded.amount_paid_cents !== null) {
      const names = await familyNames(refunded.parent_id, refunded.athlete_id)
      await sendPaymentNotice(
        moneyOutNotice({
          kind: 'refund',
          who: names.parent,
          amountCents: refunded.paid_before_cents - refunded.amount_paid_cents,
          detail: `Season dues for ${names.wrestler ?? 'their wrestler'}. Now ${formatCents(refunded.amount_paid_cents)} paid of ${formatCents(refunded.amount_cents)}.`,
        })
      )
    }
    return
  }

  // A dues payment from before payments were kept one by one (none should be
  // left: they were all copied in). It was the record's only payment, so what
  // the charge still holds is what the record has paid.
  const { data: dues } = await supabase
    .from('dues_payments')
    .select('id, amount_cents, amount_paid_cents, parent_id, athlete_id')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .maybeSingle()

  if (dues) {
    const status = stillPaidCents <= 0 ? 'pending' : stillPaidCents < dues.amount_cents ? 'partial' : 'paid'
    const { error } = await supabase
      .from('dues_payments')
      .update({ amount_paid_cents: stillPaidCents, status })
      .eq('id', dues.id)
    if (error) throw error
    if (stillPaidCents < dues.amount_paid_cents) {
      const names = await familyNames(dues.parent_id, dues.athlete_id)
      await sendPaymentNotice(
        moneyOutNotice({
          kind: 'refund',
          who: names.parent,
          amountCents: dues.amount_paid_cents - stillPaidCents,
          detail: `Season dues for ${names.wrestler ?? 'their wrestler'}. Now ${formatCents(stillPaidCents)} paid of ${formatCents(dues.amount_cents)}.`,
        })
      )
    }
    return
  }

  // A tournament entry payment (B4). Checked before the donation and
  // sponsorship fallback below, so it is never reported as one of those.
  const { data: tournamentRows, error: tournamentError } = await supabase.rpc('record_tournament_refund', {
    _intent: paymentIntentId,
    _net: stillPaidCents,
  })
  if (tournamentError) throw tournamentError
  const tournamentRefund = (tournamentRows ?? [])[0]
  if (tournamentRefund?.found) {
    // Stripe can redeliver this event; only a refund that changed the record is news.
    if (tournamentRefund.changed) {
      const { data: checkout } = await supabase
        .from('tournament_checkouts')
        .select('tournament_id, athlete_ids')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .maybeSingle()
      const names = await tournamentNames(tournamentRefund.payer_id, checkout?.athlete_ids ?? [])
      await sendPaymentNotice(
        tournamentRefundNotice({
          payerName: names.payer,
          wrestlerNames: names.wrestlers,
          tournamentName: tournamentRefund.tournament_name ?? 'a tournament',
          tournamentId: checkout?.tournament_id ?? null,
          refundedCents: tournamentRefund.refunded_cents ?? 0,
          full: stillPaidCents <= 0,
        })
      )
    }
    return
  }

  await sendPaymentNotice(
    moneyOutNotice({ kind: 'refund', who: charge.billing_details?.name ?? charge.receipt_email ?? null, amountCents: charge.amount_refunded, detail: 'A donation or sponsorship (not dues). Check the Stripe dashboard.' })
  )

  // Donations are an append-only gift log (tax receipts may already reference
  // them) and sponsors have no stored payment_intent -- flag both for a human
  // to reconcile rather than silently rewriting the record.
  await sendAlert('Stripe charge refunded (no matching dues record)', {
    paymentIntentId,
    amountRefunded: formatCents(charge.amount_refunded),
    receiptEmail: charge.receipt_email,
  })
}

async function handleDisputeCreated(dispute: Stripe.Dispute) {
  const paymentIntentId =
    typeof dispute.payment_intent === 'string' ? dispute.payment_intent : dispute.payment_intent?.id ?? null

  await sendPaymentNotice(
    moneyOutNotice({ kind: 'dispute', who: null, amountCents: dispute.amount, detail: dispute.reason ? `Reason given: ${dispute.reason.replace(/_/g, ' ')}.` : null })
  )
  await sendAlert('Stripe payment disputed', {
    paymentIntentId,
    amount: formatCents(dispute.amount),
    reason: dispute.reason,
  })
}

async function familyNames(parentId: string | null, athleteId: string | null) {
  const supabase = createAdminSupabase()
  const [{ data: parent }, { data: athlete }] = await Promise.all([
    parentId ? supabase.from('profiles').select('full_name').eq('id', parentId).maybeSingle() : Promise.resolve({ data: null }),
    athleteId
      ? supabase.from('athletes').select('first_name, last_name').eq('id', athleteId).maybeSingle()
      : Promise.resolve({ data: null }),
  ])
  return {
    parent: (parent?.full_name as string | null | undefined) ?? null,
    wrestler: athlete ? `${athlete.first_name} ${athlete.last_name}` : null,
  }
}

/** The payer's name and the wrestlers' names for a tournament notice. Never throws. */
async function tournamentNames(payerId: string | null, athleteIds: string[]) {
  try {
    const supabase = createAdminSupabase()
    const [{ data: payer }, { data: athletes }] = await Promise.all([
      payerId ? supabase.from('profiles').select('full_name').eq('id', payerId).maybeSingle() : Promise.resolve({ data: null }),
      athleteIds.length
        ? supabase.from('athletes').select('id, first_name, last_name').in('id', athleteIds)
        : Promise.resolve({ data: [] as { id: string; first_name: string; last_name: string }[] }),
    ])
    const byId = new Map((athletes ?? []).map((a) => [a.id, `${a.first_name} ${a.last_name}`]))
    return {
      payer: (payer?.full_name as string | null | undefined) ?? null,
      wrestlers: athleteIds.map((id) => byId.get(id)).filter((name): name is string => Boolean(name)),
    }
  } catch (err) {
    console.error('Tournament notice names unavailable:', err)
    return { payer: null, wrestlers: [] as string[] }
  }
}

/** Tells the payment-notice list about a dues payment, with the season's running count. Never throws. */
async function noticeDuesPayment(p: {
  parentId: string
  athleteId: string | null
  season: string
  amountCents: number
  paidNowCents: number
  paidTotalCents: number
}) {
  try {
    const [names, { data: seasonRows }] = await Promise.all([
      familyNames(p.parentId, p.athleteId),
      createAdminSupabase().from('dues_payments').select('status, amount_cents, amount_paid_cents').eq('season', p.season),
    ])
    await sendPaymentNotice(
      duesPaymentNotice({
        parentName: names.parent,
        wrestlerName: names.wrestler,
        paidNowCents: p.paidNowCents,
        paidTotalCents: p.paidTotalCents,
        amountCents: p.amountCents,
        season: p.season,
        seasonRows: (seasonRows ?? []) as { status: string; amount_cents: number; amount_paid_cents: number }[],
      })
    )
  } catch (err) {
    console.error('Dues payment notice failed:', err)
  }
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

/**
 * A receipt or thank-you email failing to send after a payment already
 * succeeded is worse than the payment itself failing: Stripe's own checkout
 * page already tells a family directly when a card is declined, but nothing
 * tells them their successful payment went unacknowledged. One retry after a
 * short delay covers the common cause -- a transient Resend or network blip,
 * the same class of failure this app spent tonight chasing on the comms side
 * -- without meaningfully delaying the webhook response Stripe is waiting on.
 * onFinalFailure is the existing sendAlert-to-admin fallback; it still fires,
 * now only after both attempts are actually exhausted.
 */
async function sendReceiptEmail(
  attempt: () => Promise<{ error: { message: string } | null }>,
  onFinalFailure: (message: string) => Promise<void>
) {
  const first = await attempt()
  if (!first.error) return

  await new Promise((resolve) => setTimeout(resolve, 2000))

  const second = await attempt()
  if (second.error) await onFinalFailure(second.error.message)
}

async function sendDuesConfirmationEmail(params: {
  to: string
  amountPaidCents: number
  status: string
  remainingCents: number
  sessionId: string
}) {
  const resend = getResend()
  if (!resend) return

  const amount = formatCents(params.amountPaidCents)
  const statusLine =
    params.status === 'paid'
      ? 'Your dues are now fully paid.'
      : `This payment has been applied to your balance. ${formatCents(params.remainingCents)} left to pay.`

  await sendReceiptEmail(
    () =>
      resend.emails.send({
        from: FROM_ADDRESS,
        to: [params.to],
        subject: `${ORG.shortName} - Dues payment received`,
        html: `<p>Thank you! We received your payment of <strong>${amount}</strong>.</p><p>${statusLine}</p><p style="color:#999;font-size:12px;">Reference: ${params.sessionId.slice(-12).toUpperCase()}</p>`,
      }),
    (message) => sendAlert('Dues confirmation email failed', { sessionId: params.sessionId, error: message })
  )
}

function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** A plain payment receipt for tournament entries: not a gift, so no tax wording. */
async function sendTournamentReceiptEmail(params: {
  to: string
  amountPaidCents: number
  tournamentName: string
  wrestlerNames: string[]
  sessionId: string
}) {
  const resend = getResend()
  if (!resend) return

  const amount = formatCents(params.amountPaidCents)
  const who = params.wrestlerNames.length ? ` for ${escapeHtml(params.wrestlerNames.join(', '))}` : ''

  await sendReceiptEmail(
    () =>
      resend.emails.send({
        from: FROM_ADDRESS,
        to: [params.to],
        subject: `${ORG.shortName} - Tournament entry payment received`,
        html: `<p>Thank you! We received your payment of <strong>${amount}</strong>${who}.</p><p>Tournament: ${escapeHtml(params.tournamentName)}. Your entry is paid.</p><p>Need to change or cancel an entry? Reply to this email or contact the club.</p><p style="color:#999;font-size:12px;">Reference: ${params.sessionId.slice(-12).toUpperCase()}</p>`,
      }),
    (message) => sendAlert('Tournament receipt email failed', { sessionId: params.sessionId, error: message })
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

  const amount = formatCents(params.amountCents)
  const taxYear = new Date().getFullYear()
  const recurringLine = params.recurring
    ? '<p>This is a recurring monthly gift. You will receive a receipt like this one each month, and you can stop it at any time by replying to this email.</p>'
    : ''

  // The donate page tells a giver "you will receive an emailed receipt after
  // checkout", so this has to carry what a receipt actually needs: the amount,
  // the tax year, the EIN, and the no-goods-or-services statement a donor
  // relies on to substantiate a deduction. Matches the sponsor letter below.
  await sendReceiptEmail(
    () =>
      resend.emails.send({
        from: FROM_ADDRESS,
        to: [params.to],
        bcc: [ADMIN_EMAIL],
        subject: `Your donation receipt from ${ORG.name}`,
        html: `<p>Dear ${params.name ?? 'Friend of the Wizards'},</p>
<p>Thank you for your generous donation of <strong>${amount}</strong> to ${ORG.name}. Your support goes toward mat time, tournament access, equipment, and keeping the cost of wrestling within reach for families who need it.</p>
${recurringLine}
<p>${ORG.name} is a registered 501(c)(3) nonprofit organization, EIN ${ORG.ein}. No goods or services were provided in exchange for this contribution; it is tax-deductible to the full extent allowed by law. Please retain this receipt for your tax records.</p>
<p>Date: ${new Date().toLocaleDateString('en-US', { timeZone: 'America/Chicago', month: 'long', day: 'numeric', year: 'numeric' })}<br/>Amount: ${amount}<br/>Tax Year: ${taxYear}</p>
<p>With gratitude,<br/>${ORG.name}</p>`,
      }),
    (message) => sendAlert('Donation receipt email failed', { to: params.to, error: message })
  )
}

async function sendDonationPaymentFailedEmail(params: { to: string; name: string | null; amountCents: number }) {
  const resend = getResend()
  if (!resend) return

  const amount = formatCents(params.amountCents)

  await sendReceiptEmail(
    () =>
      resend.emails.send({
        from: FROM_ADDRESS,
        to: [params.to],
        bcc: [ADMIN_EMAIL],
        subject: `We couldn't process your recurring donation to ${ORG.name}`,
        html: `<p>Dear ${params.name ?? 'Friend of the Wizards'},</p>
<p>We tried to process your recurring monthly donation of <strong>${amount}</strong> to ${ORG.name} and the payment did not go through. This can happen for a number of reasons -- an expired card, insufficient funds, or a bank decline.</p>
<p>We will automatically try again over the next few weeks. If you would like to update your payment method sooner, or have any questions, please reply to this email or reach us at ${ORG.contactEmail}.</p>
<p>Thank you for your continued support.</p>
<p>With gratitude,<br/>${ORG.name}</p>`,
      }),
    (message) => sendAlert('Donation payment-failed email failed to send', { to: params.to, error: message })
  )
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

  const amount = formatCents(params.amountCents)
  const taxYear = new Date().getFullYear()
  const recipients = [params.contactEmail, ADMIN_EMAIL].filter((e): e is string => Boolean(e))

  if (!recipients.length) return

  await sendReceiptEmail(
    () =>
      resend.emails.send({
        from: FROM_ADDRESS,
        to: recipients,
        subject: `Thank you for sponsoring ${ORG.name} - ${params.tier} tier`,
        html: `<p>Dear ${params.contactName ?? params.sponsorName},</p>
<p>On behalf of ${ORG.name}, thank you for your sponsorship of <strong>${amount}</strong> at the <strong>${params.tier}</strong> level for the ${taxYear} season.</p>
<p>${ORG.name} is a 501(c)(3) nonprofit organization. No goods or services were provided in exchange for this contribution; it is tax-deductible to the full extent allowed by law. Please retain this letter for your tax records.</p>
<p>Tax Year: ${taxYear}<br/>Sponsor: ${params.sponsorName}</p>
<p>With gratitude,<br/>${ORG.name}</p>`,
      }),
    (message) => sendAlert('Sponsor thank-you letter failed', { sponsorId: params.sponsorId, error: message })
  )
}
