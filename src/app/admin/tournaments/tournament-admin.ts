import { parseDollars } from '@/lib/payments/dues-amount'
import { cleanTrackWrestlingUrl } from '@/lib/tw-roster'
import {
  MAX_ENTRY_FEE_CENTS,
  MIN_ENTRY_FEE_CENTS,
  type RegistrationPaymentMethod,
  type RegistrationPaymentState,
} from '@/lib/tournament-registration'

// Pure helpers for the admin tournament pages (Tyler, Nov 14 video: B2 to B6).
// Kept out of actions.ts because a 'use server' file may only export async
// functions, and out of the pages so the tests can load them.

export const MAX_SPOTS = 500
export const MAX_CLUB_LINK_LENGTH = 500
export const MAX_STREET_ADDRESS_LENGTH = 200

type Parsed<K extends string, T> = ({ ok: true } & { [key in K]: T }) | { ok: false; error: string }

/**
 * A stored tournaments.start_time as the 'HH:MM' value a time input shows.
 * '08:00' and '08:00:00' stay as they are, older text like '8:00 AM' becomes
 * '08:00', and anything else is blank, so Session 1 never starts with a time
 * the input cannot show.
 */
export function toSessionTime(value: string | null | undefined): string {
  const text = (value ?? '').trim()
  const m = /^(\d{1,2}):([0-5]\d)(?::[0-5]\d)?\s*([AaPp][Mm])?$/.exec(text)
  if (!m) return ''
  let hour = Number(m[1])
  const meridiem = m[3]?.toLowerCase()
  if (meridiem) {
    if (hour < 1 || hour > 12) return ''
    hour = (hour % 12) + (meridiem === 'pm' ? 12 : 0)
  }
  if (hour > 23) return ''
  return `${String(hour).padStart(2, '0')}:${m[2]}`
}

/** Cents as the text the Cost field shows: 2500 is '25', 2550 is '25.50', null is ''. */
export function centsToDollarInput(cents: number | null | undefined): string {
  if (typeof cents !== 'number' || !Number.isFinite(cents) || cents <= 0) return ''
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2)
}

/** "Cost per wrestler": blank means the site takes no payment (null); otherwise $1 to $1,000 in cents. */
export function parseEntryFee(input: string | null | undefined): Parsed<'cents', number | null> {
  const text = (input ?? '').trim()
  if (!text) return { ok: true, cents: null }
  const cents = parseDollars(text)
  if (cents === null) return { ok: false, error: 'Enter the cost per wrestler as an amount, like 25 or 25.50.' }
  if (cents < MIN_ENTRY_FEE_CENTS || cents > MAX_ENTRY_FEE_CENTS) {
    return { ok: false, error: 'Cost per wrestler must be between $1 and $1,000. Leave it blank if families do not pay on our site.' }
  }
  return { ok: true, cents }
}

/** The club's TrackWrestling registrations link: blank is null; otherwise an https link, cleaned of session codes. */
export function parseClubLink(input: string | null | undefined): Parsed<'url', string | null> {
  const text = (input ?? '').trim()
  if (!text) return { ok: true, url: null }
  let url: URL
  try {
    url = new URL(text)
  } catch {
    return { ok: false, error: 'The TrackWrestling club registrations link must be a full link starting with https://' }
  }
  if (url.protocol !== 'https:') {
    return { ok: false, error: 'The TrackWrestling club registrations link must start with https://' }
  }
  const clean = cleanTrackWrestlingUrl(text)
  if (clean.length > MAX_CLUB_LINK_LENGTH) return { ok: false, error: 'That TrackWrestling link is too long.' }
  return { ok: true, url: clean }
}

/** "Number of spots": blank is null; otherwise a whole number from 1 to 500. */
export function parseSpots(input: string | number | null | undefined): Parsed<'spots', number | null> {
  const text = String(input ?? '').trim()
  if (!text) return { ok: true, spots: null }
  if (!/^\d+$/.test(text) || Number(text) < 1 || Number(text) > MAX_SPOTS) {
    return { ok: false, error: `Number of spots must be a whole number from 1 to ${MAX_SPOTS}.` }
  }
  return { ok: true, spots: Number(text) }
}

const PAID_BY: Record<RegistrationPaymentMethod, string> = {
  card: 'Paid by card',
  cash: 'Paid by cash',
  check: 'Paid by check',
  waived: 'Waived',
}

/** What the admin roster shows for a site registration's payment. */
export function paymentLabel(state: RegistrationPaymentState, method: RegistrationPaymentMethod | null | undefined): string {
  switch (state) {
    case 'withdrawn':
      return 'Withdrawn'
    case 'waived':
      return 'Waived'
    case 'free':
      return 'Free'
    case 'due':
      return 'Payment due'
    case 'paid':
      return method ? PAID_BY[method] : 'Paid'
  }
}

export type CombinedRosterRow = {
  source: 'trackwrestling' | 'site'
  division: string | null
  weight: string | null
  wrestler: string
  // The name as TrackWrestling lists it; null for a site registration.
  externalName: string | null
  // 'Yes' or 'No' for a TrackWrestling row; the payment label for a site row.
  paid: string
}

/**
 * The roster spreadsheet: the pasted TrackWrestling list plus the families who
 * registered on our site, with a Source column. Same columns as before, in the
 * same order, with Source added at the end.
 */
export function combinedRosterCsv(tournament: { name: string; date: string }, rows: CombinedRosterRow[]): string {
  const esc = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  // Leading = + - @ would run as a formula in a spreadsheet.
  const safe = (v: string) => esc(/^[=+\-@]/.test(v) ? `'${v}` : v)
  const lines = [
    ['Tournament', 'Date', 'Division', 'Weight', 'Wrestler', 'Name on TrackWrestling', 'Paid', 'Source'].join(','),
    ...rows.map((r) =>
      [
        tournament.name,
        tournament.date,
        r.division ?? '',
        r.weight ?? '',
        r.wrestler,
        r.externalName ?? '',
        r.paid,
        r.source === 'site' ? 'Our site' : 'TrackWrestling',
      ]
        .map(safe)
        .join(',')
    ),
  ]
  return lines.join('\n')
}
