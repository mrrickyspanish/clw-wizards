import { countsAsRegistered, type RegistrationPaymentMethod, type RegistrationStatus } from '@/lib/tournament-registration'

/** Club spot counts for a tournament (B6). Local types so this file does not depend on the schema task. */
export type SpotEntryInput = { athlete_id: string | null }

export type SpotRegistrationInput = {
  athlete_id: string
  status: RegistrationStatus
  fee_cents?: number | null
  paid_cents?: number | null
  payment_method?: RegistrationPaymentMethod | null
}

/**
 * "5 of 12 spots filled", or "14 of 12 spots filled (2 over)".
 * Null when no allotment is set (missing, zero, negative or not a whole number).
 */
export function spotsLine(filled: number, allotted: number | null | undefined): string | null {
  if (typeof allotted !== 'number' || !Number.isInteger(allotted) || allotted < 1) return null
  const count = Number.isFinite(filled) && filled > 0 ? Math.floor(filled) : 0
  const noun = allotted === 1 ? 'spot' : 'spots'
  const over = count - allotted
  return `${count} of ${allotted} ${noun} filled${over > 0 ? ` (${over} over)` : ''}`
}

/**
 * Wrestlers taking a club spot: each matched athlete once across the TrackWrestling
 * roster and site registrations, plus each unmatched TrackWrestling row on its own.
 * Site registrations count only when countsAsRegistered() says so.
 */
export function distinctRegisteredCount(entries: SpotEntryInput[], registrations: SpotRegistrationInput[]): number {
  const athletes = new Set<string>()
  let unmatched = 0
  for (const e of entries) {
    if (e.athlete_id) athletes.add(e.athlete_id)
    else unmatched += 1
  }
  for (const r of registrations) {
    const counts = countsAsRegistered({
      feeCents: r.fee_cents,
      paidCents: r.paid_cents,
      paymentMethod: r.payment_method,
      status: r.status,
    })
    if (counts) athletes.add(r.athlete_id)
  }
  return athletes.size + unmatched
}
