/**
 * How much a family may pay toward one dues record in a checkout (Tyler,
 * Oct 24). Everyone can pay the full balance. A family the club marked
 * Payment plan can pay part of it, at least $25 a time (card fees are about
 * 30¢ plus 3% per payment), or whatever is left when that is under $25.
 * The Dues page and the checkout route both use this, so they always agree.
 */

export const PAYMENT_PLAN_MIN_CENTS = 2500
const STRIPE_MIN_CENTS = 50

export type DuesAmountResult = { ok: true; amountCents: number } | { ok: false; error: string }

const dollars = (cents: number) => `$${(cents / 100).toFixed(2).replace(/\.00$/, '')}`

export function duesCheckoutAmount(p: {
  remainingCents: number
  paymentPlan: boolean
  requestedCents?: number | null
}): DuesAmountResult {
  const { remainingCents, paymentPlan } = p
  if (!(remainingCents > 0)) return { ok: false, error: 'These dues are already paid in full.' }
  const requested = p.requestedCents ?? remainingCents
  if (!Number.isInteger(requested) || requested <= 0) return { ok: false, error: 'Enter an amount to pay.' }
  // Stripe can't charge less than 50¢; a balance that small needs the club.
  if (requested === remainingCents && remainingCents < STRIPE_MIN_CENTS) {
    return { ok: false, error: 'This balance is too small to pay by card. Contact the club to settle it.' }
  }
  if (requested === remainingCents) return { ok: true, amountCents: remainingCents }
  if (!paymentPlan) return { ok: false, error: `Pay the full balance of ${dollars(remainingCents)}.` }
  if (requested > remainingCents) {
    return { ok: false, error: `That's more than you owe. The most you can pay is ${dollars(remainingCents)}.` }
  }
  if (requested < PAYMENT_PLAN_MIN_CENTS) {
    return { ok: false, error: `The smallest payment is ${dollars(PAYMENT_PLAN_MIN_CENTS)}.` }
  }
  return { ok: true, amountCents: requested }
}

/** "$40", "40.50", "$1,000" typed by a parent, in cents; null when it isn't an amount. */
export function parseDollars(input: string): number | null {
  const clean = input.replace(/[$,\s]/g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null
  return Math.round(Number(clean) * 100)
}

/**
 * Whether dues let a registration be approved: paid, waived, or on a payment
 * plan (Tyler, Oct 24: payment plan wrestlers are approved while they pay; the
 * balance and the weekly reminders carry on). Registrations and the approve
 * action both ask this.
 */
export function duesClearForApproval(dues: { status: string; payment_plan?: boolean | null } | null | undefined): boolean {
  if (!dues) return false
  return dues.status === 'paid' || dues.status === 'waived' || dues.payment_plan === true
}
