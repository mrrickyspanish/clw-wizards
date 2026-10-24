/**
 * How much a family may pay toward one dues record in a checkout (Tyler,
 * Oct 24). Everyone can pay the full balance. A family the club marked
 * Payment plan can pay part of it, at least $25 a time (card fees are about
 * 30¢ plus 3% per payment), or whatever is left when that is under $25.
 * The Dues page and the checkout route both use this, so they always agree.
 */

export const PAYMENT_PLAN_MIN_CENTS = 2500

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
