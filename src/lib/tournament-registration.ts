/** Payment state for in-house tournament registrations (B4). Local types so this file does not depend on the schema task. */
export type RegistrationStatus = 'registered' | 'confirmed' | 'withdrawn' | 'no_show'
export type RegistrationPaymentMethod = 'card' | 'cash' | 'check' | 'waived'
export type RegistrationPaymentState = 'withdrawn' | 'free' | 'paid' | 'waived' | 'due'

export type RegistrationPaymentInput = {
  /**
   * The EFFECTIVE fee: the registration's own fee_cents when set, otherwise the
   * tournament's entry_fee_cents. A parent's registration keeps fee_cents NULL until
   * checkout locks it, so passing the row value alone would read an unpaid entry as free.
   * Matches coalesce(r.fee_cents, t.entry_fee_cents) in family_tournament_roster().
   */
  feeCents: number | null | undefined
  paidCents: number | null | undefined
  paymentMethod: RegistrationPaymentMethod | null | undefined
  status: RegistrationStatus
}

export const MIN_ENTRY_FEE_CENTS = 100
export const MAX_ENTRY_FEE_CENTS = 100000
export const MAX_WRESTLERS_PER_CHECKOUT = 10
export const MIN_WEIGHT_LBS = 30
export const MAX_WEIGHT_LBS = 300

/**
 * 'withdrawn' for a withdrawn registration; otherwise, in the same order as the SQL in
 * family_tournament_roster(): 'waived' when an admin waived it, 'free' when the effective
 * fee is missing or 0, 'paid' when the fee is covered, and 'due' otherwise.
 * `feeCents` must be the effective fee (row fee, else tournament entry fee).
 */
export function registrationPaymentState(input: RegistrationPaymentInput): RegistrationPaymentState {
  if (input.status === 'withdrawn') return 'withdrawn'
  if (input.paymentMethod === 'waived') return 'waived'
  const fee = input.feeCents ?? 0
  if (!(fee > 0)) return 'free'
  if ((input.paidCents ?? 0) >= fee) return 'paid'
  return 'due'
}

/** True only when nothing is owed (free, paid or waived) and the status is registered or confirmed. */
export function countsAsRegistered(input: RegistrationPaymentInput): boolean {
  if (input.status !== 'registered' && input.status !== 'confirmed') return false
  const state = registrationPaymentState(input)
  return state === 'free' || state === 'paid' || state === 'waived'
}

/** Fee times wrestler count, or null for a count outside 1 to 10 or a fee outside 100 to 100000 cents. */
export function checkoutTotal(feeCents: number, count: number): number | null {
  if (!Number.isInteger(count) || count < 1 || count > MAX_WRESTLERS_PER_CHECKOUT) return null
  if (!Number.isInteger(feeCents) || feeCents < MIN_ENTRY_FEE_CENTS || feeCents > MAX_ENTRY_FEE_CENTS) return null
  return feeCents * count
}

/**
 * A wrestler weight from 30 to 300 lbs with at most one decimal place, as a clean
 * string ("52", "52.5"). A trailing "lb" or "lbs" is allowed. Returns null otherwise.
 */
export function parseWeight(input: string | number | null | undefined): string | null {
  if (input === null || input === undefined) return null
  const text = String(input).trim().replace(/\s*lbs?\.?$/i, '')
  if (!/^\d{1,3}(\.\d)?$/.test(text)) return null
  const value = Number(text)
  if (!Number.isFinite(value) || value < MIN_WEIGHT_LBS || value > MAX_WEIGHT_LBS) return null
  return String(value)
}
