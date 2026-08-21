import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, CheckCircle2, Mail } from 'lucide-react'

import { getStripeClient } from '@/lib/stripe'
import { TaxStatusNote } from '@/components/sponsorship/TaxStatusNote'
import { CTA_BUTTON, CTA_LINK } from '@/lib/cta'
import { ORG } from '@/config/org.config'
import { pageMetadata } from '@/lib/page-metadata'

export const metadata: Metadata = pageMetadata({
  title: 'Thank You',
  description: 'Your support for Crystal Lake Wizards Wrestling Club was received.',
  // A receipt page has nothing to offer search, and indexing it would put a
  // page keyed to a payment session into results.
  robots: { index: false, follow: false },
})

type CompletedCheckout = {
  amountCents: number
  firstName: string | null
  email: string | null
  recurring: boolean
  flow: string | null
}

/**
 * Stripe rewrites {CHECKOUT_SESSION_ID} in the success URL before redirecting,
 * so the visitor arrives holding the id of the session they just completed.
 * Reading it back is what lets this page name the real amount instead of
 * thanking someone for an unspecified gift.
 *
 * Everything here is best effort. A missing, malformed, or unfinished session
 * is not an error worth showing a donor who has already paid -- the page falls
 * back to a thank-you without the specifics.
 */
async function loadCheckout(sessionId: string | undefined): Promise<CompletedCheckout | null> {
  if (!sessionId || !sessionId.startsWith('cs_')) return null

  try {
    const stripe = getStripeClient()
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.payment_status !== 'paid' && session.status !== 'complete') return null

    const fullName = session.customer_details?.name ?? session.metadata?.donor_name ?? null

    return {
      amountCents: session.amount_total ?? 0,
      firstName: fullName ? (fullName.trim().split(/\s+/)[0] ?? null) : null,
      email: session.customer_details?.email ?? session.customer_email ?? null,
      recurring: session.mode === 'subscription',
      flow: session.metadata?.flow ?? null,
    }
  } catch {
    return null
  }
}

function money(cents: number) {
  return `$${(cents / 100).toFixed(2).replace(/\.00$/, '')}`
}

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id: sessionId } = await searchParams
  const checkout = await loadCheckout(sessionId)

  const isSponsor = checkout?.flow === 'sponsor'
  const greeting = checkout?.firstName ? `Thank you, ${checkout.firstName}.` : 'Thank you.'

  let summary: string
  if (!checkout) {
    summary = `Your support for ${ORG.name} was received.`
  } else if (isSponsor) {
    summary = `Your sponsorship payment of ${money(checkout.amountCents)} was received.`
  } else if (checkout.recurring) {
    summary = `Your ${money(checkout.amountCents)} monthly gift starts today.`
  } else {
    summary = `Your gift of ${money(checkout.amountCents)} is headed straight to the wrestling room.`
  }

  return (
    <main className="overflow-x-clip bg-clw-black text-clw-white">
      <section className="px-5 py-16 sm:px-8 sm:py-24 lg:px-12 lg:py-28 xl:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-clw-gold sm:h-16 sm:w-16" />

          <h1 className="mt-6 font-display text-[clamp(3rem,9vw,5.5rem)] uppercase leading-[0.88] text-clw-gold">
            {greeting}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-relaxed text-clw-white sm:text-xl">
            {summary}
          </p>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-clw-gray">
            {isSponsor
              ? 'Our sponsorship team will follow up about your listing and logo placement. Nothing else is needed from you right now.'
              : 'Every dollar goes toward mat time, tournament access, equipment, and keeping the cost of wrestling within reach for families who need it.'}
          </p>

          <div className="mx-auto mt-10 max-w-xl border border-clw-gold/25 bg-clw-black-2 p-5 text-left sm:p-6">
            <p className="flex items-center gap-2.5 text-base font-semibold text-clw-white">
              <Mail className="h-5 w-5 shrink-0 text-clw-gold" /> Your receipt is on the way
            </p>
            <p className="mt-2.5 text-base leading-relaxed text-clw-gray">
              {checkout?.email
                ? `We sent a receipt to ${checkout.email}. If it does not arrive in a few minutes, check your spam folder.`
                : 'A receipt is on its way to the email address you entered at checkout. If it does not arrive in a few minutes, check your spam folder.'}
              {checkout?.recurring
                ? ' You can change or cancel your monthly gift at any time by replying to that email.'
                : ''}
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-xl">
            <TaxStatusNote
              variant={isSponsor ? 'sponsorship' : 'donation'}
              className="text-center text-clw-gray/85"
            />
          </div>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/program"
              className={`${CTA_BUTTON} bg-clw-gold text-clw-black hover:bg-clw-gold-l`}
            >
              See what you supported
            </Link>
            <Link href="/sponsorship" className={`${CTA_LINK} text-clw-gold hover:text-clw-gold-l`}>
              Other ways to help <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
