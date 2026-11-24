// "Download spreadsheet" on Admin > Registrations (Tyler, Nov 24): every
// registration for the current season, one row per wrestler, the same
// columns Tyler was first sent by hand. Pure functions only, so the route
// stays thin and this file can be tested without a database.
//
// The USA card column says whether a card is on file, never the number: the
// club does not pass card numbers around.

export type ExportEnrollment = {
  athlete_id: string
  parent_id: string
  status: string
  submitted_at: string | null
  dues_payment_id: string | null
  usa_card_document_id: string | null
  card_override_at: string | null
  grade: string | null
  school: string | null
  weight_lbs: number | null
  shirt_size: string | null
  years_experience: number | null
  season_commitment: string | null
}

export type ExportAthlete = {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string | null
  age_division: string | null
  practice_group: string | null
  shirt_size: string | null
  usa_wrestling_card_number: string | null
  usa_wrestling_card_url: string | null
  birth_certificate_url: string | null
  birth_certificate_on_file: boolean | null
}

export type ExportParent = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  street_address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
}

export type ExportDues = {
  id: string
  amount_cents: number
  amount_paid_cents: number | null
  status: string
  payment_plan: boolean | null
}

export type ExportGuardian = {
  athlete_id: string
  ordinal: number
  name: string | null
  relationship: string | null
  phone: string | null
  email: string | null
  coach_interest: string | null
}

export type ExportSignature = { athlete_id: string; accepted_at: string; typed_signature: string | null }

export type ExportInput = {
  enrollments: ExportEnrollment[]
  athletes: ExportAthlete[]
  parents: ExportParent[]
  dues: ExportDues[]
  guardians: ExportGuardian[]
  /** Signatures of the season's required agreements (the waiver). */
  signatures: ExportSignature[]
  /** Wrestlers with a USA card upload in athlete_documents. */
  cardUploads: Set<string>
  /** Wrestlers with a birth certificate upload in athlete_documents. */
  birthCertificateUploads: Set<string>
}

export const EXPORT_HEADERS = [
  'Status', 'Submitted', 'First name', 'Last name', 'Birth date', 'Age division', 'Practice group', 'Grade', 'School',
  'Weight (lbs)', 'Shirt', 'Years experience', 'Season commitment', 'Birth certificate', 'USA card', 'Waiver signed',
  'Waiver signed by', 'Dues ($)', 'Paid ($)', 'Dues status', 'Payment plan', 'Account holder', 'Account email',
  'Account phone', 'Address', 'Guardian 1', 'Guardian 1 relationship', 'Guardian 1 phone', 'Guardian 1 email',
  'Guardian 2', 'Guardian 2 relationship', 'Guardian 2 phone', 'Guardian 2 email', 'Interested in coaching',
] as const

type Cell = string | number | null

const clubDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Chicago' }) : null
const titleCase = (s: string | null) =>
  s ? s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : null
const dollars = (cents: number | null | undefined) => (cents == null ? null : (cents / 100).toFixed(2))

export function usaCardStatus(athlete: ExportAthlete, enrollment: ExportEnrollment, hasUpload: boolean): string {
  if (athlete.usa_wrestling_card_number?.trim()) return 'Number on file'
  if (enrollment.usa_card_document_id || athlete.usa_wrestling_card_url || hasUpload) return 'Card uploaded'
  if (enrollment.card_override_at) return 'Cleared by club'
  return 'Missing'
}

export function birthCertificateStatus(athlete: ExportAthlete, hasUpload: boolean): string {
  if (athlete.birth_certificate_on_file) return 'On file'
  if (athlete.birth_certificate_url || hasUpload) return 'Uploaded'
  return 'Missing'
}

/** One row per enrollment, sorted by wrestler last name then first name. */
export function registrationRows(input: ExportInput): Cell[][] {
  const athleteById = new Map(input.athletes.map((a) => [a.id, a]))
  const parentById = new Map(input.parents.map((p) => [p.id, p]))
  const duesById = new Map(input.dues.map((d) => [d.id, d]))
  const latestSignature = new Map<string, ExportSignature>()
  for (const s of input.signatures) {
    const known = latestSignature.get(s.athlete_id)
    if (!known || s.accepted_at > known.accepted_at) latestSignature.set(s.athlete_id, s)
  }

  const rows: { sortKey: string; cells: Cell[] }[] = []
  for (const e of input.enrollments) {
    const a = athleteById.get(e.athlete_id)
    if (!a) continue
    const p = parentById.get(e.parent_id)
    const d = e.dues_payment_id ? duesById.get(e.dues_payment_id) : undefined
    const sig = latestSignature.get(a.id)
    const guardians = input.guardians.filter((g) => g.athlete_id === a.id)
    const g1 = guardians.find((g) => g.ordinal === 1)
    const g2 = guardians.find((g) => g.ordinal === 2)
    const address = p ? [p.street_address, p.city, p.state, p.postal_code].filter((x) => x && x.trim()).join(', ') : ''
    rows.push({
      sortKey: `${a.last_name.toLowerCase()}\u0000${a.first_name.toLowerCase()}`,
      cells: [
        titleCase(e.status), clubDate(e.submitted_at), a.first_name, a.last_name, a.date_of_birth, a.age_division,
        a.practice_group, e.grade, e.school, e.weight_lbs, e.shirt_size ?? a.shirt_size, e.years_experience,
        e.season_commitment, birthCertificateStatus(a, input.birthCertificateUploads.has(a.id)),
        usaCardStatus(a, e, input.cardUploads.has(a.id)), clubDate(sig?.accepted_at ?? null), sig?.typed_signature ?? null,
        dollars(d?.amount_cents), d ? dollars(d.amount_paid_cents ?? 0) : null, titleCase(d?.status ?? null),
        d?.payment_plan ? 'Yes' : null, p?.full_name ?? null, p?.email ?? null, p?.phone ?? null, address || null,
        g1?.name ?? null, g1?.relationship ?? null, g1?.phone ?? null, g1?.email ?? null,
        g2?.name ?? null, g2?.relationship ?? null, g2?.phone ?? null, g2?.email ?? null,
        guardians.some((g) => g.coach_interest === 'Yes') ? 'Yes' : null,
      ],
    })
  }
  return rows.sort((x, y) => x.sortKey.localeCompare(y.sortKey)).map((r) => r.cells)
}

/** A cell Excel cannot run as a formula, quoted for CSV. */
export function csvCell(value: Cell): string {
  if (value == null) return ''
  let text = String(value)
  // A typed value starting with = + - @ (or a tab or return) would run as a
  // formula in Excel. Numbers we produce (weights, dollars) are safe as they are.
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** The whole file: a byte-order mark so Excel reads accents, then CRLF lines. */
export function toCsv(headers: readonly string[], rows: Cell[][]): string {
  const lines = [headers.map(csvCell).join(','), ...rows.map((r) => r.map(csvCell).join(','))]
  return `﻿${lines.join('\r\n')}\r\n`
}

export function exportFileName(seasonName: string | null | undefined, today: Date): string {
  const slug = (seasonName ?? 'season').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'season'
  return `CLW-Wizards-registrations-${slug}-${today.toLocaleDateString('en-CA', { timeZone: 'America/Chicago' })}.csv`
}
